import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/auth';

// GET /api/admin/products — list all products
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/admin/products — create a new product
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, vendor, categoryName, price, compareAtPrice, stock, description, shortDescription } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, message: 'Product name and price are required.' },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const categorySlug = (categoryName || 'general')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const productData = {
      name,
      slug,
      description: description || `${name}. Premium tactical and outdoor equipment.`,
      shortDescription: shortDescription || `High-quality ${name.toLowerCase()} by ${vendor || 'TecticalHub'}.`,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      vendor: vendor || 'TecticalHub',
      status: 'PUBLISHED',
      categoryId: categorySlug,
      categoryName: categoryName || 'General',
      images: [{ url: 'https://placehold.co/600x600?text=Product', isPrimary: true }],
      variants: [{
        sku: `TECT-${slug.substring(0, 12).toUpperCase()}-STD`,
        name: 'Standard',
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        stock: Number(stock) || 0
      }],
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('products').add(productData);
    return NextResponse.json({
      success: true,
      product: { id: docRef.id, ...productData },
      message: 'Product created successfully.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
