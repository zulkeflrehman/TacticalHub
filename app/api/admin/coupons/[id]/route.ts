import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

// PATCH /api/admin/coupons/[id] — toggle active/inactive or update fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const couponRef = adminDb.collection('coupons').doc(id);
    const couponDoc = await couponRef.get();

    if (!couponDoc.exists) {
      return NextResponse.json({ success: false, message: 'Coupon not found.' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
    if (body.maxUsage !== undefined) updateData.maxUsage = body.maxUsage ? Number(body.maxUsage) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = new Date(body.expiresAt);

    await couponRef.update(updateData);

    const updatedDoc = await couponRef.get();
    const data = updatedDoc.data();
    return NextResponse.json({
      success: true,
      coupon: {
        id: updatedDoc.id,
        ...data,
        expiresAt: data?.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data?.expiresAt)
      },
      message: 'Coupon updated successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/coupons/[id] — delete a coupon
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const couponRef = adminDb.collection('coupons').doc(id);
    const couponDoc = await couponRef.get();

    if (!couponDoc.exists) {
      return NextResponse.json({ success: false, message: 'Coupon not found.' }, { status: 404 });
    }

    await couponRef.delete();
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
