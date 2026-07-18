'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';
import { 
  Search, Eye, X, Loader2,
  MapPin, FileText 
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  number: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  items?: OrderItem[];
}

interface OrderManagerProps {
  initialOrders: Order[];
}

export default function OrderManager({ initialOrders }: OrderManagerProps) {
  const addToast = useToastStore((state) => state.addToast);

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtering
  const filteredOrders = orders.filter(o =>
    o.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        addToast(`Order updated to "${newStatus}".`, 'success');
      } else {
        addToast(data.message || 'Failed to update status.', 'error');
      }
    } catch {
      addToast('Network error updating order.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusChange = async (id: string, newPayStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPayStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: newPayStatus } : o));
        if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPayStatus } : null);
        addToast(`Payment updated to "${newPayStatus}".`, 'success');
      } else {
        addToast(data.message || 'Failed to update payment status.', 'error');
      }
    } catch {
      addToast('Network error updating order.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper toolbar */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-white border border-brand-black/10 py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-black clip-angled-sm"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-dark-gray/50" />
        </div>
      </div>

      {/* Main Datatable */}
      <div className="bg-brand-white border border-brand-black/5 clip-angled-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="bg-brand-light-gray text-brand-dark-gray uppercase text-[10px] border-b border-brand-black/5">
                <th className="p-3">Order No.</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total Bill</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Order Status</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/5">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-brand-dark-gray/50 text-xs font-semibold">No orders found.</td></tr>
              ) : filteredOrders.map(o => (
                <tr key={o.id} className={`hover:bg-brand-light-gray/40 ${updatingId === o.id ? 'opacity-60' : ''}`}>
                  <td className="p-3 font-bold text-brand-black">{o.number}</td>
                  <td className="p-3">
                    <div>
                      <p className="font-bold text-brand-black">{o.customer}</p>
                      <p className="text-[10px] text-brand-dark-gray/60 font-semibold">{o.email}</p>
                    </div>
                  </td>
                  <td className="p-3 font-extrabold text-brand-black">Rs. {o.total.toLocaleString()}</td>
                  <td className="p-3 text-brand-dark-gray uppercase">{o.paymentMethod}</td>
                  
                  {/* Order Status Select */}
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      className="bg-brand-light-gray border border-brand-black/10 py-1 px-1.5 focus:outline-none text-[11px] font-bold uppercase cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </td>

                  {/* Payment Status Select */}
                  <td className="p-3">
                    <select
                      value={o.paymentStatus}
                      onChange={e => handlePaymentStatusChange(o.id, e.target.value)}
                      className="bg-brand-light-gray border border-brand-black/10 py-1 px-1.5 focus:outline-none text-[11px] font-bold uppercase cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="AUTHORIZED">Authorized</option>
                      <option value="PAID">Paid</option>
                      <option value="FAILED">Failed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </td>

                  <td className="p-3 text-brand-dark-gray whitespace-nowrap">{o.date}</td>

                  {/* View details */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      disabled={updatingId === o.id}
                      className="p-1.5 bg-brand-light-gray border border-brand-black/5 text-brand-dark-gray hover:border-brand-black hover:text-brand-black clip-angled-sm disabled:opacity-60"
                      title="View invoice details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="bg-brand-white border border-brand-black/10 p-6 md:p-8 max-w-lg w-full relative z-10 clip-angled-lg space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black flex items-center gap-1">
                <FileText className="w-4 h-4 text-brand-accent" />
                <span>Invoice: {selectedOrder.number}</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-brand-dark-gray hover:text-brand-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Address / Contact Card */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-dark-gray block">Customer</span>
                <span className="text-brand-black font-bold">{selectedOrder.customer}</span>
                <span className="text-brand-dark-gray font-semibold block">{selectedOrder.email}</span>
                <span className="text-brand-dark-gray font-semibold block">{selectedOrder.phone}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-brand-dark-gray block">Shipping Address</span>
                <span className="text-brand-black font-medium leading-relaxed block flex gap-1 items-start">
                  <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <span>{selectedOrder.address}</span>
                </span>
              </div>
            </div>

            {/* Note alert if present */}
            {selectedOrder.notes && (
              <div className="bg-brand-light-gray border border-brand-black/5 p-3 text-[10px] font-semibold text-brand-dark-gray clip-angled-sm">
                <p className="font-bold text-brand-black uppercase">Order Note:</p>
                <p className="mt-0.5 leading-relaxed">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Items Breakdown list */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-dark-gray/60">Ordered Items</h4>
                <div className="border border-brand-black/5 divide-y divide-brand-black/5 text-xs">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-3 p-3 font-semibold">
                      <span className="col-span-2 text-brand-black">{item.name} <strong className="text-brand-dark-gray font-bold">x {item.quantity}</strong></span>
                      <span className="text-brand-black text-right">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary details */}
            <div className="border-t border-brand-black/5 pt-4 text-xs font-semibold space-y-2 text-brand-dark-gray">
              <div className="flex justify-between">
                <span>Shipping Method</span>
                <span className="text-brand-black">Cash on Delivery (Standard)</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="text-brand-black uppercase font-bold">{selectedOrder.paymentStatus}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-brand-black/5">
                <span className="font-black text-brand-black uppercase">Total Bill</span>
                <span className="text-base font-black text-brand-black">Rs. {selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3 transition-colors clip-angled border border-brand-black"
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
