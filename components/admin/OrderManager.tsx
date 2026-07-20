'use client';

import { useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  Eye,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { OrderDto } from '@/lib/catalog-types';
import {
  saveAdminOrderOperations,
  transitionAdminOrderStatus,
} from '@/lib/client-services';
import {
  allowedNextOrderStatuses,
  allowedNextPaymentStatuses,
  PAYMENT_STATUSES,
  PHONE_CONFIRMATION_STATUSES,
  type PaymentStatus,
  type PhoneConfirmationStatus,
} from '@/lib/order-policy';
import { useToastStore } from '@/lib/toast-store';

interface OrderManagerProps {
  orders: OrderDto[];
  newOrderIds: Set<string>;
  lastUpdated: Date | null;
  refreshing: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onRefresh: () => Promise<void>;
  onEnableNotifications: () => Promise<void>;
  onToggleSound: () => Promise<void>;
  onMarkSeen: (id: string) => void;
}

export default function OrderManager({
  orders,
  newOrderIds,
  lastUpdated,
  refreshing,
  notificationsEnabled,
  soundEnabled,
  onRefresh,
  onEnableNotifications,
  onToggleSound,
  onMarkSeen,
}: OrderManagerProps) {
  const addToast = useToastStore((state) => state.addToast);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderVersion, setSelectedOrderVersion] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [phoneConfirmation, setPhoneConfirmation] = useState<PhoneConfirmationStatus>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;
  const selectedOrderIsCurrent = Boolean(selectedOrder
    && selectedOrderVersion === selectedOrder.updatedAt.getTime());
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => [order.orderNumber, order.customerName, order.email, order.phone]
      .some((value) => value.toLowerCase().includes(term)));
  }, [orders, searchTerm]);

  const openOrder = (order: OrderDto) => {
    setSelectedOrderId(order.id);
    setSelectedOrderVersion(order.updatedAt.getTime());
    setPhoneConfirmation(order.phoneConfirmation);
    setPaymentStatus(order.paymentStatus);
    setCourierName(order.courierName);
    setTrackingNumber(order.trackingNumber);
    setDeliveryNotes(order.deliveryNotes);
    onMarkSeen(order.id);
  };

  const changeStatus = async (order: OrderDto, nextStatus: OrderDto['status']) => {
    if (nextStatus === order.status) return;
    let cancellationReason = '';
    if (nextStatus === 'CANCELLED') {
      cancellationReason = window.prompt(
        'Enter the cancellation reason. Inventory will be restored atomically exactly once.',
      )?.trim() || '';
      if (!cancellationReason) return;
    }
    setUpdatingId(order.id);
    try {
      const result = await transitionAdminOrderStatus(order.id, nextStatus, cancellationReason);
      addToast(result.restored
        ? 'Order cancelled and inventory restored exactly once.'
        : `Order moved to ${nextStatus}.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update order status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const saveOperations = async () => {
    if (!selectedOrder) return;
    if (!selectedOrderIsCurrent) {
      addToast('This order changed in Firestore. Close and reopen it before editing.', 'info');
      return;
    }
    setUpdatingId(selectedOrder.id);
    try {
      await saveAdminOrderOperations(selectedOrder.id, {
        phoneConfirmation,
        paymentStatus,
        courierName,
        trackingNumber,
        deliveryNotes,
      });
      addToast('Order operations details saved.', 'success');
      setSelectedOrderId(null);
      setSelectedOrderVersion(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save order operations.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const availablePayments = selectedOrder
    ? [selectedOrder.paymentStatus, ...allowedNextPaymentStatuses(selectedOrder.paymentStatus)]
    : PAYMENT_STATUSES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-brand-black/5 bg-brand-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-brand-dark-gray">
          <span className="bg-brand-black px-3 py-2 text-brand-white">
            {newOrderIds.size} new order{newOrderIds.size === 1 ? '' : 's'}
          </span>
          <span>Live listener active</span>
          <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Waiting...'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onRefresh} disabled={refreshing} className="flex items-center gap-1 border border-brand-black px-3 py-2 text-[10px] font-black uppercase disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Manual refresh
          </button>
          <button type="button" onClick={onEnableNotifications} className="flex items-center gap-1 border border-brand-black px-3 py-2 text-[10px] font-black uppercase">
            {notificationsEnabled ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {notificationsEnabled ? 'Notifications on' : 'Enable notification'}
          </button>
          <button type="button" onClick={onToggleSound} className="flex items-center gap-1 border border-brand-black px-3 py-2 text-[10px] font-black uppercase">
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Sound {soundEnabled ? 'on' : 'off'}
          </button>
        </div>
        <p className="basis-full text-[10px] text-brand-dark-gray">
          Browser alerts and sound work only while this dashboard is open. No automatic email, SMS, or WhatsApp notification is sent.
        </p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <input type="search" placeholder="Search order, customer, email or phone..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full bg-brand-white border border-brand-black/10 py-2.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-black" />
        <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-brand-dark-gray/50" />
      </div>

      <div className="overflow-hidden border border-brand-black/5 bg-brand-white clip-angled-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead><tr className="border-b border-brand-black/5 bg-brand-light-gray text-[10px] uppercase text-brand-dark-gray">
              <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th>
              <th className="p-3">Phone</th><th className="p-3">Order status</th><th className="p-3">Payment</th>
              <th className="p-3">Updated</th><th className="p-3 text-center">Details</th>
            </tr></thead>
            <tbody className="divide-y divide-brand-black/5">
              {filteredOrders.map((order) => {
                const nextStatuses = [order.status, ...allowedNextOrderStatuses(order.status)];
                return (
                  <tr key={order.id} className={updatingId === order.id ? 'opacity-60' : 'hover:bg-brand-light-gray/40'}>
                    <td className="p-3 font-bold">
                      {order.orderNumber}
                      {newOrderIds.has(order.id) && <span className="ml-2 bg-brand-accent px-2 py-0.5 text-[8px] font-black uppercase">New</span>}
                    </td>
                    <td className="p-3"><strong className="block">{order.customerName}</strong><span className="text-[10px] text-brand-dark-gray">{order.email}</span></td>
                    <td className="p-3 font-black">Rs. {order.total.toLocaleString()}</td>
                    <td className="p-3"><span className="block">{order.phone}</span><span className="text-[9px] font-black uppercase text-brand-dark-gray">{order.phoneConfirmation}</span></td>
                    <td className="p-3"><select value={order.status} disabled={updatingId === order.id || nextStatuses.length === 1} onChange={(event) => changeStatus(order, event.target.value as OrderDto['status'])} className="bg-brand-light-gray border border-brand-black/10 py-1 px-1.5 text-[10px] font-bold uppercase disabled:opacity-60">{nextStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                    <td className="p-3 text-[10px] font-black uppercase">{order.paymentStatus}</td>
                    <td className="p-3 whitespace-nowrap text-brand-dark-gray">{order.updatedAt.toLocaleString()}</td>
                    <td className="p-3 text-center"><button type="button" onClick={() => openOrder(order)} className="border border-brand-black/10 p-2" title="View and edit order operations"><Eye className="h-3.5 w-3.5" /></button></td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-brand-dark-gray">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close order details" className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={() => setSelectedOrderId(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl space-y-6 overflow-y-auto border border-brand-black/10 bg-brand-white p-6 sm:p-8 clip-angled-lg">
            <div className="flex items-center justify-between border-b border-brand-black/5 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase"><FileText className="h-4 w-4 text-brand-accent" /> {selectedOrder.orderNumber}</h3>
              <button type="button" onClick={() => setSelectedOrderId(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-5 text-xs md:grid-cols-3">
              <div><span className="block text-[10px] font-black uppercase text-brand-dark-gray">Customer contact</span><strong>{selectedOrder.customerName}</strong><p>{selectedOrder.email}</p><p>{selectedOrder.phone}</p></div>
              <div><span className="block text-[10px] font-black uppercase text-brand-dark-gray">Delivery address</span><p className="flex gap-1"><MapPin className="h-3.5 w-3.5 shrink-0 text-brand-accent" />{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} {selectedOrder.postalCode}</p></div>
              <div><span className="block text-[10px] font-black uppercase text-brand-dark-gray">Placed</span><p>{selectedOrder.createdAt.toLocaleString()}</p><p className="font-black uppercase">COD · {selectedOrder.status}</p></div>
            </div>

            <div className="border border-brand-black/5 text-xs">
              {selectedOrder.items.map((item) => <div key={item.inventoryId} className="grid grid-cols-4 gap-2 border-b border-brand-black/5 p-3 last:border-0"><span className="col-span-2 font-bold">{item.name}</span><span>Qty {item.quantity}</span><strong className="text-right">Rs. {(item.price * item.quantity).toLocaleString()}</strong></div>)}
            </div>

            <div className="ml-auto max-w-sm space-y-2 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><strong>Rs. {selectedOrder.subtotal.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Discount</span><strong>- Rs. {selectedOrder.discount.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Delivery charge</span><strong>Rs. {selectedOrder.shippingCost.toLocaleString()}</strong></div>
              <div className="flex justify-between border-t pt-2 text-sm"><span className="font-black uppercase">Final total</span><strong>Rs. {selectedOrder.total.toLocaleString()}</strong></div>
            </div>

            <div className="grid gap-4 border border-brand-black/5 bg-brand-light-gray p-4 sm:grid-cols-2">
              {!selectedOrderIsCurrent && <p className="border border-amber-300 bg-amber-50 p-3 text-[10px] font-bold normal-case text-amber-900 sm:col-span-2">This order changed in real time. Close and reopen it before saving, so newer Firestore data is not overwritten.</p>}
              <label className="space-y-1 text-[10px] font-black uppercase">Phone confirmation<select value={phoneConfirmation} onChange={(event) => setPhoneConfirmation(event.target.value as PhoneConfirmationStatus)} className="block w-full border border-brand-black/10 bg-white p-2 text-xs">{PHONE_CONFIRMATION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="space-y-1 text-[10px] font-black uppercase">Payment status<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)} className="block w-full border border-brand-black/10 bg-white p-2 text-xs">{availablePayments.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="space-y-1 text-[10px] font-black uppercase">Courier name<input value={courierName} maxLength={120} onChange={(event) => setCourierName(event.target.value)} className="block w-full border border-brand-black/10 bg-white p-2 text-xs normal-case" /></label>
              <label className="space-y-1 text-[10px] font-black uppercase">Tracking number<input value={trackingNumber} maxLength={160} onChange={(event) => setTrackingNumber(event.target.value)} className="block w-full border border-brand-black/10 bg-white p-2 text-xs normal-case" /></label>
              <label className="space-y-1 text-[10px] font-black uppercase sm:col-span-2">Delivery notes<textarea value={deliveryNotes} maxLength={1000} rows={3} onChange={(event) => setDeliveryNotes(event.target.value)} className="block w-full border border-brand-black/10 bg-white p-2 text-xs normal-case" /></label>
              <button type="button" onClick={saveOperations} disabled={updatingId === selectedOrder.id || !selectedOrderIsCurrent} className="bg-brand-black px-4 py-3 text-xs font-black uppercase text-white disabled:opacity-50 sm:col-span-2">Save operational details</button>
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <p><strong>Dispatch date:</strong> {selectedOrder.dispatchDate?.toLocaleString() || 'Not dispatched'}</p>
              <p><strong>Inventory restored:</strong> {selectedOrder.inventoryRestored ? `Yes · ${selectedOrder.inventoryRestoredAt?.toLocaleString() || ''}` : 'No'}</p>
              <p><strong>Cancellation reason:</strong> {selectedOrder.cancellationReason || 'Not cancelled'}</p>
              <p><strong>Customer notes:</strong> {selectedOrder.notes || 'None'}</p>
              <p className="sm:col-span-2"><strong>Delivery notes:</strong> {selectedOrder.deliveryNotes || 'None'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
