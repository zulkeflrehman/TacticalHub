import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

const VALID_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const VALID_PAYMENT_STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'];

// PATCH /api/admin/orders/[id] — update order status or payment status
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
    const { status, paymentStatus } = body;

    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid order status: ${status}` },
        { status: 400 }
      );
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, message: `Invalid payment status: ${paymentStatus}` },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection('orders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    await orderRef.update(updateData);

    const updatedDoc = await orderRef.get();
    return NextResponse.json({
      success: true,
      order: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Order updated successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
