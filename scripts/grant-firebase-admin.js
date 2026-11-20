import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.env.FIREBASE_ADMIN_UID?.trim();
const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();

if (!uid || !projectId || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error(
    'Set FIREBASE_ADMIN_UID, VITE_FIREBASE_PROJECT_ID, and GOOGLE_APPLICATION_CREDENTIALS before running this script.'
  );
}

initializeApp({
  credential: applicationDefault(),
  projectId
});

const adminAuth = getAuth();
const account = await adminAuth.getUser(uid);
await adminAuth.setCustomUserClaims(uid, {
  ...account.customClaims,
  admin: true
});

console.log(`Granted administrator access to Firebase user ${uid}. Sign out and back in to refresh the ID token.`);
