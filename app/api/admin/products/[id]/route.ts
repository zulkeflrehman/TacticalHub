import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

// PATCH /api/admin/products/[id] — update price, stock, status, flags
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
    const { price, stock, compareAtPrice, status, isFeatured, isNewArrival, isBestSeller, name, vendor } = body;

    const productRef = adminDb.collection('products').doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (price !== undefined) updateData.price = Number(price);
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (status !== undefined) updateData.status = status;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isNewArrival !== undefined) updateData.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller;
    if (name !== undefined) updateData.name = name;
    if (vendor !== undefined) updateData.vendor = vendor;

    // If stock is being updated, update the first variant's stock
    if (stock !== undefined) {
      const existingData = productDoc.data();
      const variants = existingData?.variants || [];
      if (variants.length > 0) {
        variants[0].stock = Number(stock);
        // Also update price on all variants if price changed
        if (price !== undefined) {
          variants.forEach((v: any) => { v.price = Number(price); });
        }
        updateData.variants = variants;
      }
    }

    await productRef.update(updateData);

    const updatedDoc = await productRef.get();
    return NextResponse.json({
      success: true,
      product: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Product updated successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — permanently delete a product
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
    const productRef = adminDb.collection('products').doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

    await productRef.delete();
    return NextResponse.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
