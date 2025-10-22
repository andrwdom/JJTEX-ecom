# Firebase Setup Guide for JJTEX Frontend

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "JJTEX" (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Google Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains

## 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) icon
4. Register your app with a name like "JJTEX Frontend"
5. Copy the Firebase configuration object

## 4. Create Environment File

Create a `.env` file in the frontend directory with the following content:

```env
# Backend URL
VITE_BACKEND_URL=https://api.jjtextiles.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id-here
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
VITE_FIREBASE_APP_ID=your-app-id-here
```

Replace the placeholder values with your actual Firebase configuration values.

## 5. Backend Firebase Setup

The backend already has Firebase Admin SDK configured. You need to:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable in your backend to point to this file

## 6. Test the Setup

1. Start your frontend: `npm run dev`
2. Start your backend: `npm start`
3. Navigate to `/login` and try Google authentication

## Security Notes

- Never commit the `.env` file to version control
- Keep your Firebase service account key secure
- Use environment variables for all sensitive configuration
