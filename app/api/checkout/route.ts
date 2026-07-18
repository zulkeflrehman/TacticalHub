import { NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      email,
      phone,
      firstName,
      lastName,
      address,
      city,
      state,
      postalCode,
      paymentMethod,
      items,
      couponCode,
      notes,
      userId
    } = body;

    // Validate request
    if (!email || !phone || !firstName || !lastName || !address || !city || !state || !postalCode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'All required shipping details and cart items must be provided.' },
        { status: 400 }
      );
    }

    const orderResult = await OrderService.createOrder({
      userId,
      email,
      phone,
      firstName,
      lastName,
      address,
      city,
      state,
      postalCode,
      paymentMethod,
      notes,
      couponCode,
      items
    });

    if (orderResult.success) {
      return NextResponse.json({
        success: true,
        order: orderResult.order,
        isMock: orderResult.isMock
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to process checkout order.' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error during checkout.' },
      { status: 500 }
    );
  }
}
