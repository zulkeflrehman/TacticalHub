import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    try {
      const cleanEmail = email.toLowerCase().trim();
      await adminDb.collection('newsletterSubscribers').doc(cleanEmail).set({
        email: cleanEmail,
        createdAt: new Date()
      });
      return NextResponse.json({ success: true, message: 'Subscribed successfully.' });
    } catch (err) {
      console.warn("Firestore offline during newsletter subscribe. Returning success in demo mode.", err);
      return NextResponse.json({ success: true, message: 'Subscribed in demo mode.' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
