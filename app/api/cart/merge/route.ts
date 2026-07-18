import { NextResponse } from 'next/server';
import { CartService } from '@/lib/services/cart-service';

export async function POST(request: Request) {
  try {
    const { userId, items } = await request.json();

    if (!userId || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload.' },
        { status: 400 }
      );
    }

    const mergedCart = await CartService.mergeCarts(userId, items);

    return NextResponse.json({
      success: true,
      cart: mergedCart
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
