# Build Kenya

## Firebase setup

1. In Firebase Console, enable **Authentication → Email/Password** and create a **Cloud Firestore** database.
2. Copy `.env.example` to `.env`. From **Project settings → General → Your apps**, copy the web app values into the matching `VITE_FIREBASE_*` variables. These are client configuration values; protect account data with the included Firestore rules.
3. In **Firestore → Rules**, publish the contents of `firestore.rules`.
4. Install dependencies with `npm ci`, then start the app with `npm run dev`. Open `http://localhost:3000`.

Citizens can continue without an account. Supervisors and NGOs create a Firebase Authentication account and a pending `accountRequests/{uid}` Firestore document. They cannot use oversight screens until an administrator approves the request.

## Configure the administrator

1. Create the administrator’s email/password account in Firebase Console under **Authentication → Users**.
2. Grant that Firebase user the `admin: true` custom claim with the trusted Firebase Admin SDK. Keep a service-account JSON file outside the repository, then set the variables in PowerShell:

   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\secure\firebase-service-account.json'
   $env:VITE_FIREBASE_PROJECT_ID = 'your-firebase-project-id'
   $env:FIREBASE_ADMIN_UID = 'the-admin-user-uid'
   npm run firebase:grant-admin
   ```

3. Sign out and back in, then open `http://localhost:3000/admin`. The administrator role is not displayed on the public role-selection screen.

Never commit `.env` or service-account credentials. The app’s public Firebase web configuration is not an authorization boundary; the Firestore rules and admin custom claim protect account approvals. For production, use HTTPS and manage Firebase credentials outside the source repository.
