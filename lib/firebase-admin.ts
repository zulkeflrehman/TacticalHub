import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tecticalhub';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (getApps().length === 0) {
  try {
    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin SDK initialized successfully with service account.");
    } else {
      console.warn("Firebase Admin initialized without private key credentials. Falls back to project-id initialization.");
      initializeApp({
        projectId,
      });
    }
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export default initializeApp;
