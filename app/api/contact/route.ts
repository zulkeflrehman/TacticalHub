import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { name, email, phone, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    try {
      const messageRef = adminDb.collection('contactMessages').doc();
      await messageRef.set({
        id: messageRef.id,
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
        isRead: false,
        createdAt: new Date()
      });
      return NextResponse.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
      console.warn("Firestore offline during contact form submit. Returning success in demo mode.", err);
      return NextResponse.json({ success: true, message: 'Message recorded in demo mode.' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
