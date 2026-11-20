# Build Kenya

## Firebase setup

1. In Firebase Console, enable **Authentication → Email/Password**.
2. Copy `.env.example` to `.env`. From **Project settings → General → Your apps**, copy the web app values into the matching `VITE_FIREBASE_*` variables.
3. Install dependencies with `npm ci`, then start the app with `npm run dev`. Open `http://localhost:3000`.

Citizens can continue without an account. Supervisors, NGOs, and funders authenticate with Firebase Authentication. Their organization details are saved in that browser’s local storage and do not sync across devices or browsers.

Members can submit launched projects that are missing from the tracker or progress updates for listed projects. Oversight users review these submissions; verifying a launch adds it to the tracker, and verifying an update applies the reported progress. Project submissions and tracker data are stored in browser local storage and are not shared across devices.

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

Never commit `.env` or service-account credentials. The app’s public Firebase web configuration is not an authorization boundary; the admin custom claim protects administrator-only routes. For production, use HTTPS and manage Firebase credentials outside the source repository.
