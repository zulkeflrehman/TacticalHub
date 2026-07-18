import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category') || undefined;
    const isFeatured = searchParams.get('featured') === 'true' ? true : undefined;
    const searchQuery = searchParams.get('q') || undefined;

    const products = await ProductService.getProducts({
      categorySlug,
      isFeatured,
      searchQuery
    });

    return NextResponse.json({
      success: true,
      products
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error fetching products.' },
      { status: 500 }
    );
  }
}
