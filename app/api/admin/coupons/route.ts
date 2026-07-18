import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection('coupons').get();
    const coupons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
        startsAt: data.startsAt?.toDate ? data.startsAt.toDate() : new Date(data.startsAt),
      };
    });
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/admin/coupons — create a new coupon
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, discountType, discountValue, minOrderValue, maxUsage, expiresAt, isActive } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { success: false, message: 'code, discountType, and discountValue are required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();

    // Check if coupon code already exists
    const existing = await adminDb.collection('coupons').doc(cleanCode).get();
    if (existing.exists) {
      return NextResponse.json(
        { success: false, message: `Coupon code "${cleanCode}" already exists.` },
        { status: 400 }
      );
    }

    const couponData = {
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxUsage: maxUsage ? Number(maxUsage) : null,
      usedCount: 0,
      startsAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('coupons').doc(cleanCode).set(couponData);

    return NextResponse.json({
      success: true,
      coupon: { id: cleanCode, ...couponData },
      message: 'Coupon created successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
