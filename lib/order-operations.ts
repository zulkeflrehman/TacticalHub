import {
  doc,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import {
  assertOrderStatusTransition,
  assertPaymentStatusTransition,
  isOrderStatus,
  isPaymentStatus,
  isPhoneConfirmationStatus,
  type OrderStatus,
  type PaymentStatus,
  type PhoneConfirmationStatus,
} from './order-policy';

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function requiredStatus(data: DocumentData): OrderStatus {
  if (!isOrderStatus(data.status)) throw new Error('The stored order status is invalid.');
  return data.status;
}

function requiredPaymentStatus(data: DocumentData): PaymentStatus {
  if (!isPaymentStatus(data.paymentStatus)) throw new Error('The stored payment status is invalid.');
  return data.paymentStatus;
}

function missingOperationalDefaults(data: DocumentData): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    phoneConfirmation: 'PENDING',
    courierName: '',
    trackingNumber: '',
    dispatchDate: null,
    cancellationReason: '',
    deliveryNotes: '',
    inventoryRestored: false,
    inventoryRestoredAt: null,
    cancelledAt: null,
  };
  return Object.fromEntries(Object.entries(defaults).filter(([key]) => !(key in data)));
}

export interface OrderOperationsUpdate {
  phoneConfirmation: PhoneConfirmationStatus;
  courierName: string;
  trackingNumber: string;
  deliveryNotes: string;
  paymentStatus: PaymentStatus;
}

export async function saveOrderOperations(
  database: Firestore,
  orderId: string,
  update: OrderOperationsUpdate,
): Promise<void> {
  if (!isPhoneConfirmationStatus(update.phoneConfirmation)) {
    throw new Error('Select a valid phone-confirmation status.');
  }
  if (!isPaymentStatus(update.paymentStatus)) throw new Error('Select a valid payment status.');
  if (update.courierName.trim().length > 120 || update.trackingNumber.trim().length > 160) {
    throw new Error('Courier or tracking information is too long.');
  }
  if (update.deliveryNotes.trim().length > 1000) throw new Error('Delivery notes are too long.');

  await runTransaction(database, async (transaction) => {
    const orderRef = doc(database, 'orders', orderId);
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error('Order not found.');
    const currentPaymentStatus = requiredPaymentStatus(snapshot.data());
    assertPaymentStatusTransition(currentPaymentStatus, update.paymentStatus);
    transaction.update(orderRef, {
      ...missingOperationalDefaults(snapshot.data()),
      phoneConfirmation: update.phoneConfirmation,
      courierName: update.courierName.trim(),
      trackingNumber: update.trackingNumber.trim(),
      deliveryNotes: update.deliveryNotes.trim(),
      paymentStatus: update.paymentStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

export interface CancellationResult {
  restored: boolean;
}

export async function cancelOrderAndRestoreInventory(
  database: Firestore,
  orderId: string,
  reason: string,
): Promise<CancellationResult> {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3 || cleanReason.length > 500) {
    throw new Error('Enter a cancellation reason between 3 and 500 characters.');
  }

  return runTransaction(database, async (transaction) => {
    const orderRef = doc(database, 'orders', orderId);
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) throw new Error('Order not found.');
    const order = orderSnapshot.data();
    const currentStatus = requiredStatus(order);
    const currentPaymentStatus = requiredPaymentStatus(order);

    if (currentStatus === 'CANCELLED') {
      if (order.inventoryRestored === true) return { restored: false };
      throw new Error('This cancelled order has an inconsistent inventory-restoration marker.');
    }
    assertOrderStatusTransition(currentStatus, 'CANCELLED');

    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length < 1 || items.length > 5) throw new Error('The stored order items are invalid.');
    const inventoryRefs = items.map((item: DocumentData) => {
      const inventoryId = String(item.inventoryId || '');
      if (!inventoryId) throw new Error('An order item is missing its inventory reference.');
      return doc(database, 'inventory', inventoryId);
    });
    const inventorySnapshots: DocumentSnapshot<DocumentData>[] = [];
    for (const inventoryRef of inventoryRefs) inventorySnapshots.push(await transaction.get(inventoryRef));

    inventorySnapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) throw new Error('An order inventory record no longer exists.');
      const quantity = Math.trunc(numberValue(items[index].quantity));
      if (quantity < 1 || quantity > 20) throw new Error('An order quantity is invalid.');
      transaction.update(snapshot.ref, {
        stock: Math.trunc(numberValue(snapshot.data().stock)) + quantity,
        lastRestoredOrderId: orderId,
        updatedAt: serverTimestamp(),
      });
    });
    transaction.update(orderRef, {
      ...missingOperationalDefaults(order),
      status: 'CANCELLED',
      paymentStatus: currentPaymentStatus === 'PAID' ? 'REFUNDED' : 'CANCELLED',
      cancellationReason: cleanReason,
      inventoryRestored: true,
      inventoryRestoredAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { restored: true };
  });
}

export async function transitionOrderStatus(
  database: Firestore,
  orderId: string,
  nextStatus: OrderStatus,
  cancellationReason = '',
): Promise<CancellationResult> {
  if (nextStatus === 'CANCELLED') {
    return cancelOrderAndRestoreInventory(database, orderId, cancellationReason);
  }
  await runTransaction(database, async (transaction) => {
    const orderRef = doc(database, 'orders', orderId);
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error('Order not found.');
    const data = snapshot.data();
    const currentStatus = requiredStatus(data);
    assertOrderStatusTransition(currentStatus, nextStatus);
    const changes: Record<string, unknown> = {
      ...missingOperationalDefaults(data),
      status: nextStatus,
      updatedAt: serverTimestamp(),
    };
    if (nextStatus === 'SHIPPED') changes.dispatchDate = serverTimestamp();
    if (nextStatus === 'DELIVERED' && requiredPaymentStatus(data) === 'PENDING') {
      changes.paymentStatus = 'PAID';
    }
    transaction.update(orderRef, changes);
  });
  return { restored: false };
}
