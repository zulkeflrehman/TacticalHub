export const MAX_ORDER_LINES = 5;
export const MAX_ITEM_QUANTITY = 20;
export const SHIPPING_COST_PKR = 250;
export const FREE_SHIPPING_THRESHOLD_PKR = 5000;

export function calculateShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_PKR ? 0 : SHIPPING_COST_PKR;
}

export function calculateCouponDiscount(
  subtotal: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number,
): number {
  if (!Number.isInteger(subtotal) || subtotal < 0 || !Number.isInteger(discountValue) || discountValue <= 0) {
    throw new Error('Coupon values must be positive whole PKR amounts.');
  }
  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new Error('Coupon percentage cannot exceed 100.');
  }
  const raw = discountType === 'PERCENTAGE' ? Math.floor(subtotal * discountValue / 100) : discountValue;
  return Math.min(subtotal, raw);
}
