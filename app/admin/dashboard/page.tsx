'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { listAllOrders, listAllProducts } from '@/lib/client-services';
import type { OrderDto, ProductDto } from '@/lib/catalog-types';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([listAllProducts(), listAllOrders()]).then(([catalog, sales]) => { setProducts(catalog); setOrders(sales); }).finally(() => setLoading(false)); }, []);
  const stats = useMemo(() => ({
    revenue: orders.filter((order) => !['CANCELLED', 'REFUNDED'].includes(order.status)).reduce((sum, order) => sum + order.total, 0),
    lowStock: products.filter((product) => product.stock < 10).length,
  }), [orders, products]);
  const kpis = [
    { title: 'Order Value', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: DollarSign },
    { title: 'Orders Placed', value: orders.length, icon: ShoppingCart },
    { title: 'Products', value: products.length, icon: Package },
    { title: 'Low Stock', value: stats.lowStock, icon: AlertTriangle },
  ];
  return <div className="space-y-8">
    <div><h1 className="text-2xl sm:text-3xl font-black uppercase">Dashboard Overview</h1><p className="text-xs text-brand-dark-gray font-semibold uppercase">Spark-plan store operations</p></div>
    {loading ? <p className="text-xs font-bold uppercase">Loading dashboard...</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{kpis.map((kpi) => <div key={kpi.title} className="bg-brand-white border border-brand-black/5 p-6 flex justify-between"><div><span className="text-[10px] font-black uppercase text-brand-dark-gray">{kpi.title}</span><p className="text-xl font-black">{kpi.value}</p></div><kpi.icon className="w-5 h-5 text-brand-accent"/></div>)}</div>
      <section className="bg-brand-white border border-brand-black/5 p-6 space-y-4"><div className="flex justify-between"><h2 className="text-xs font-black uppercase">Recent Orders</h2><Link href="/admin/orders" className="text-xs font-bold underline">View all</Link></div>{orders.slice(0, 5).map((order) => <div key={order.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t pt-3 text-xs"><strong>{order.orderNumber}</strong><span>{order.firstName} {order.lastName}</span><span>{order.status}</span><strong className="text-right">Rs. {order.total.toLocaleString()}</strong></div>)}{orders.length === 0 && <p className="text-xs text-brand-dark-gray">No orders have been placed.</p>}</section>
    </>}
  </div>;
}
