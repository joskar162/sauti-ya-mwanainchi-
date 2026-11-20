import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const port = Number(process.env.API_PORT || 3001);
const authSecret = process.env.AUTH_SECRET;
const cookieName = 'build_kenya_session';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000
};
const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
};

if (!authSecret || authSecret.length < 32) {
  throw new Error('Set AUTH_SECRET in .env to a random value at least 32 characters long.');
}

const databasePath = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : fileURLToPath(new URL('../data/build-kenya.sqlite', import.meta.url));
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('oversight', 'admin')),
    organization TEXT NOT NULL DEFAULT '',
    organization_type TEXT NOT NULL DEFAULT '',
    county TEXT NOT NULL DEFAULT 'Tharaka-Nithi',
    approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT REFERENCES accounts(id)
  );
`);

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }
  const existingAdmin = database.prepare('SELECT id, role FROM accounts WHERE email = ?').get(adminEmail);
  if (existingAdmin && existingAdmin.role !== 'admin') {
    throw new Error('ADMIN_EMAIL is already registered as an oversight account. Use a different admin email.');
  }
  if (!existingAdmin) {
    database.prepare(`
      INSERT INTO accounts (
        id, name, email, password_hash, role, organization, organization_type,
        county, approval_status, created_at
      ) VALUES (?, ?, ?, ?, 'admin', 'System administration', 'System administrator',
        'Tharaka-Nithi', 'approved', ?)
    `).run(randomUUID(), 'System Administrator', adminEmail, bcrypt.hashSync(adminPassword, 12), new Date().toISOString());
  }
} else {
  console.warn('Administrator login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to enable approvals.');
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many account requests. Please wait and try again.' }
});

const publicAccount = account => ({
  id: account.id,
  name: account.name,
  email: account.email,
  role: account.role,
  organization: account.organization,
  organizationType: account.organization_type,
  county: account.county
});

const issueSession = (response, account) => {
  const token = jwt.sign(
    { sub: account.id },
    authSecret,
    { expiresIn: '8h', issuer: 'build-kenya' }
  );
  response.cookie(cookieName, token, cookieOptions);
  response.json({ user: publicAccount(account) });
};

const requireAuth = (request, response, next) => {
  const token = request.cookies[cookieName];
  if (!token) return response.status(401).json({ error: 'Please sign in.' });

  let payload;
  try {
    payload = jwt.verify(token, authSecret, { issuer: 'build-kenya' });
  } catch {
    response.clearCookie(cookieName, clearCookieOptions);
    return response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  const account = database.prepare('SELECT * FROM accounts WHERE id = ?').get(payload.sub);
  if (!account || account.approval_status !== 'approved') {
    response.clearCookie(cookieName, clearCookieOptions);
    return response.status(401).json({ error: 'This account is not active.' });
  }
  request.account = account;
  return next();
};

const requireAdmin = (request, response, next) => {
  if (request.account?.role !== 'admin') {
    return response.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
};

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/auth/register', authenticationLimiter, async (request, response, next) => {
  try {
    const { name, email, password, organization, organizationType, county } = request.body ?? {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const validOrganizationTypes = ['NGO', 'Supervisor', 'Auditor-General'];
    if (
      typeof name !== 'string' || name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== 'string' || password.length < 12 ||
      typeof organization !== 'string' || organization.trim().length < 2 ||
      !validOrganizationTypes.includes(organizationType)
    ) {
      return response.status(400).json({
        error: 'Enter your name, a valid email, an organization, a valid account type, and a password of at least 12 characters.'
      });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    try {
      database.prepare(`
        INSERT INTO accounts (
          id, name, email, password_hash, role, organization, organization_type,
          county, approval_status, created_at
        ) VALUES (?, ?, ?, ?, 'oversight', ?, ?, ?, 'pending', ?)
      `).run(
        id, name.trim(), normalizedEmail, passwordHash, organization.trim(),
        organizationType, typeof county === 'string' && county.trim() ? county.trim() : 'Tharaka-Nithi',
        new Date().toISOString()
      );
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return response.status(409).json({ error: 'An account request already exists for that email.' });
      }
      throw error;
    }
    return response.status(201).json({
      message: 'Your request was submitted. An administrator must approve your account before you can sign in.'
    });
  } catch (error) {
    return next(error);
  }
});

const createLoginHandler = expectedRole => async (request, response, next) => {
  try {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const account = database.prepare('SELECT * FROM accounts WHERE email = ?').get(email);
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    if (account.role !== expectedRole) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    if (account.approval_status === 'pending') {
      return response.status(403).json({ error: 'Your account request is awaiting administrator approval.' });
    }
    if (account.approval_status === 'rejected') {
      return response.status(403).json({ error: 'Your account request was not approved. Contact your administrator.' });
    }
    return issueSession(response, account);
  } catch (error) {
    return next(error);
  }
};

app.post('/api/auth/login', authenticationLimiter, createLoginHandler('oversight'));
app.post('/api/admin/login', authenticationLimiter, createLoginHandler('admin'));

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json({ user: publicAccount(request.account) });
});

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie(cookieName, clearCookieOptions);
  response.status(204).end();
});

app.get('/api/admin/registrations', requireAuth, requireAdmin, (request, response) => {
  const status = request.query.status === 'all' ? null : 'pending';
  const registrations = status
    ? database.prepare(`
        SELECT id, name, email, organization, organization_type, county, created_at, approval_status
        FROM accounts WHERE role = 'oversight' AND approval_status = ?
        ORDER BY created_at ASC
      `).all(status)
    : database.prepare(`
        SELECT id, name, email, organization, organization_type, county, created_at, approval_status
        FROM accounts WHERE role = 'oversight'
        ORDER BY created_at DESC
      `).all();
  response.json({ registrations });
});

app.patch('/api/admin/registrations/:id', requireAuth, requireAdmin, (request, response) => {
  const { decision } = request.body ?? {};
  if (!['approved', 'rejected'].includes(decision)) {
    return response.status(400).json({ error: 'Decision must be approved or rejected.' });
  }
  const result = database.prepare(`
    UPDATE accounts
    SET approval_status = ?, reviewed_at = ?, reviewed_by = ?
    WHERE id = ? AND role = 'oversight' AND approval_status = 'pending'
  `).run(decision, new Date().toISOString(), request.account.id, request.params.id);
  if (result.changes === 0) {
    return response.status(404).json({ error: 'Pending account request not found.' });
  }
  return response.json({ status: decision });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'The server could not complete the request.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Build Kenya API listening on http://127.0.0.1:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});
