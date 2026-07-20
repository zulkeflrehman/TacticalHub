export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PHONE_CONFIRMATION_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'UNREACHABLE',
  'INVALID',
] as const;

export type PhoneConfirmationStatus = (typeof PHONE_CONFIRMATION_STATUSES)[number];

const NEXT_ORDER_STATUSES: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const NEXT_PAYMENT_STATUSES: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ['PAID'],
  PAID: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && ORDER_STATUSES.includes(value as OrderStatus);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && PAYMENT_STATUSES.includes(value as PaymentStatus);
}

export function isPhoneConfirmationStatus(value: unknown): value is PhoneConfirmationStatus {
  return typeof value === 'string'
    && PHONE_CONFIRMATION_STATUSES.includes(value as PhoneConfirmationStatus);
}

export function allowedNextOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return NEXT_ORDER_STATUSES[status];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || NEXT_ORDER_STATUSES[from].includes(to);
}

export function assertOrderStatusTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrderStatus(from, to)) {
    throw new Error(`Order cannot move backward from ${from} to ${to}.`);
  }
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  return from === to || NEXT_PAYMENT_STATUSES[from].includes(to);
}

export function allowedNextPaymentStatuses(status: PaymentStatus): readonly PaymentStatus[] {
  return NEXT_PAYMENT_STATUSES[status];
}

export function assertPaymentStatusTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPaymentStatus(from, to)) {
    throw new Error(`Payment cannot move backward from ${from} to ${to}.`);
  }
}

export function normalizePakistaniMobile(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (/^03\d{9}$/.test(compact)) return `+92${compact.slice(1)}`;
  if (/^\+923\d{9}$/.test(compact)) return compact;
  throw new Error('Enter a Pakistani mobile number in the format 03XXXXXXXXX.');
}

export function isPakistaniMobile(value: string): boolean {
  try {
    normalizePakistaniMobile(value);
    return true;
  } catch {
    return false;
  }
}
