# Build Kenya

## Local development and account approval

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env`.
3. Set `AUTH_SECRET` to a random value of at least 32 characters, and set a private `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters). For example, generate a secret with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

4. Start the frontend and API together with `npm run dev`, then open `http://localhost:3000`.

The SQLite database is created at `data/build-kenya.sqlite`. Citizens can continue without an account. Supervisors and NGOs can request oversight access; their request stays pending until an administrator signs in at `http://localhost:3000/admin` and approves it. The administrator role is not offered in the public role selector.

The administrator email and password are read only from `.env`; do not commit that file. This setup is intended for local development. A production deployment should use HTTPS, private environment secrets, backups, and a managed database appropriate to its hosting environment.
