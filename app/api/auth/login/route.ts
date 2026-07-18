import { NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { adminDb } from '@/lib/firebase-admin';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    try {
      // 1. Authenticate with Firebase Client SDK (run on Server Route)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user || !user.email) {
        return NextResponse.json(
          { success: false, message: 'Authentication failed.' },
          { status: 401 }
        );
      }

      // 2. Fetch User Profile from Firestore
      const userRef = adminDb.collection('users').doc(user.uid);
      const userDoc = await userRef.get();

      let role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER';
      let name = user.displayName || email.split('@')[0];

      if (userDoc.exists) {
        const userData = userDoc.data();
        role = userData?.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
        name = userData?.name || name;
      } else {
        // Auto-create document if missing in Firestore but exists in Auth
        role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER';
        await userRef.set({
          email: user.email,
          role,
          name,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 3. Set Session Cookie using our existing JWT helper
      await createSession({
        id: user.uid,
        email: user.email,
        role,
        name
      });

      return NextResponse.json({
        success: true,
        user: { id: user.uid, email: user.email, name, role },
        message: 'Logged in successfully.'
      });

    } catch (fbErr: any) {
      console.warn("Firebase Auth failed, checking demo credentials fallback:", fbErr.message);

      // Handle standard demo credentials in offline fallback mode or if Firebase setup is pending
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === 'admin@tecticalhub.com' && password === 'admin_password_123') {
        const mockAdmin = {
          id: 'mock-admin-id',
          email: 'admin@tecticalhub.com',
          name: 'TecticalHub Admin',
          role: 'ADMIN' as const
        };
        await createSession(mockAdmin);
        return NextResponse.json({
          success: true,
          user: mockAdmin,
          message: 'Database offline. Logged in as demo ADMIN.'
        });
      }

      if (cleanEmail === 'user@tecticalhub.com' && password === 'user_password_123') {
        const mockCustomer = {
          id: 'mock-customer-id',
          email: 'user@tecticalhub.com',
          name: 'Demo Customer',
          role: 'CUSTOMER' as const
        };
        await createSession(mockCustomer);
        return NextResponse.json({
          success: true,
          user: mockCustomer,
          message: 'Database offline. Logged in as demo CUSTOMER.'
        });
      }

      // If it wasn't fallback credentials, return the Firebase error message
      let message = 'Invalid email or password.';
      if (fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (fbErr.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed login attempts.';
      } else {
        message = fbErr.message || message;
      }

      return NextResponse.json(
        { success: false, message },
        { status: 401 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
