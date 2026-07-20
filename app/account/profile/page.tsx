'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Mail, Phone, ShoppingBag, User } from 'lucide-react';
import AuthGate from '@/components/auth/AuthGate';
import LogoutButton from '@/components/account/LogoutButton';
import { listUserOrders } from '@/lib/client-services';
import type { OrderDto, StoreUserDto } from '@/lib/catalog-types';

function ProfileContent({ profile }: { profile: StoreUserDto }) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listUserOrders(profile.id).then(setOrders).finally(() => setLoading(false)); }, [profile.id]);

  return <div className="space-y-8">
    <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-brand-black/5 pb-4">
      <div><h1 className="text-2xl sm:text-3xl font-black uppercase">Welcome, {profile.name || 'Customer'}</h1><p className="text-xs font-semibold uppercase text-brand-dark-gray">Shopper dashboard</p></div><LogoutButton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <aside className="lg:col-span-4 bg-brand-white border border-brand-black/5 p-6 clip-angled space-y-4">
        <h2 className="text-xs font-black uppercase border-l-2 border-brand-accent pl-2">Profile Information</h2>
        <p className="flex gap-2 text-xs font-bold"><User className="w-4 h-4 text-brand-accent" />{profile.name}</p>
        <p className="flex gap-2 text-xs font-bold break-all"><Mail className="w-4 h-4 text-brand-accent shrink-0" />{profile.email}</p>
        {profile.phone && <p className="flex gap-2 text-xs font-bold"><Phone className="w-4 h-4 text-brand-accent" />{profile.phone}</p>}
        {profile.role === 'ADMIN' && <Link href="/admin/dashboard" className="inline-block bg-brand-black text-brand-white px-4 py-2 text-xs font-bold uppercase">Open Admin Console</Link>}
      </aside>
      <section className="lg:col-span-8 bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-5">
        <h2 className="text-xs font-black uppercase border-l-2 border-brand-accent pl-2">Order History ({orders.length})</h2>
        {loading ? <p className="text-xs font-bold uppercase">Loading orders...</p> : orders.length === 0 ? <div className="py-12 text-center"><ShoppingBag className="w-10 h-10 mx-auto text-brand-dark-gray/30"/><p className="mt-3 text-xs font-bold uppercase">No orders yet</p></div> : orders.map((order) => <article key={order.id} className="border border-brand-black/5 p-4 bg-brand-light-gray space-y-3">
          <div className="flex justify-between text-xs"><strong>{order.orderNumber}</strong><span className="flex gap-1"><Calendar className="w-3 h-3"/>{order.createdAt.toLocaleDateString()}</span></div>
          {order.items.map((item) => <div key={item.inventoryId} className="flex justify-between text-xs"><span>{item.name} × {item.quantity}</span><strong>Rs. {(item.price * item.quantity).toLocaleString()}</strong></div>)}
          <div className="flex justify-between border-t pt-2 text-xs"><span className="font-bold uppercase">{order.status}</span><strong>Rs. {order.total.toLocaleString()}</strong></div>
        </article>)}
      </section>
    </div>
  </div>;
}

export default function ProfilePage() {
  return <AuthGate>{(_user, profile) => <ProfileContent profile={profile} />}</AuthGate>;
}
