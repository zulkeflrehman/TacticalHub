import { NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { adminDb } from '@/lib/firebase-admin';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user || !user.email) {
        return NextResponse.json(
          { success: false, message: 'Account creation failed.' },
          { status: 400 }
        );
      }

      // 2. Set profile displayName on Client Auth
      if (name) {
        await updateProfile(user, { displayName: name });
      }

      // 3. Store user record in Firestore
      await adminDb.collection('users').doc(user.uid).set({
        email: user.email,
        name: name || '',
        phone: phone || '',
        role: 'CUSTOMER',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 4. Log the user in
      await createSession({
        id: user.uid,
        email: user.email,
        role: 'CUSTOMER',
        name: name || undefined
      });

      return NextResponse.json({
        success: true,
        user: { id: user.uid, email: user.email, name: name || undefined, role: 'CUSTOMER' },
        message: 'Account created successfully.'
      });

    } catch (fbErr: any) {
      console.warn("Firebase registration failed, falling back to mock:", fbErr.message);

      if (fbErr.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists.' },
          { status: 400 }
        );
      }

      // Fallback in case of Firebase configuration error or offline development
      const mockUser = {
        id: `mock-user-${Date.now()}`,
        email,
        name: name || 'Mock Customer',
        role: 'CUSTOMER' as const
      };

      await createSession(mockUser);

      return NextResponse.json({
        success: true,
        user: mockUser,
        message: 'Database offline. Registered in demo mode.'
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
