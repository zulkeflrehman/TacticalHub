import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: true, products: [] });
    }

    const results = await ProductService.getProducts({
      searchQuery: query.trim()
    });

    // Limit to top 6 suggestions for popover autocomplete
    return NextResponse.json({
      success: true,
      products: results.slice(0, 6)
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Error executing search.' },
      { status: 500 }
    );
  }
}
