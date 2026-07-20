'use client';

import { useEffect, useState } from 'react';
import OrderManager, { type AdminOrder } from '@/components/admin/OrderManager';
import { listAllOrders } from '@/lib/client-services';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  useEffect(() => { listAllOrders().then((items) => setOrders(items.map((order) => ({
    id: order.id, number: order.orderNumber, customer: `${order.firstName} ${order.lastName}`.trim(),
    email: order.email, phone: order.phone, address: [order.address, order.city, order.state].filter(Boolean).join(', '),
    total: order.total, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod,
    date: order.createdAt.toLocaleDateString(), notes: order.notes,
    items: order.items.map((item) => ({ id: item.inventoryId, name: item.name, price: item.price, quantity: item.quantity })),
  })))); }, []);
  return <div className="space-y-8"><div><h1 className="text-2xl sm:text-3xl font-black uppercase">Manage Orders</h1><p className="text-xs text-brand-dark-gray font-semibold uppercase">Invoices, Dispatch Tracking & Payment Status</p></div>{orders ? <OrderManager initialOrders={orders}/> : <p className="text-xs font-bold uppercase">Loading orders...</p>}</div>;
}
