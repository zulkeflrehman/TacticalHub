import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { OrderService } from '@/lib/services/order-service';
import LogoutButton from '@/components/account/LogoutButton';
import Link from 'next/link';
import { User, ShoppingBag, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSession();

  if (!user) {
    redirect('/account/login');
  }

  const orders = await OrderService.getOrders(user.id);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span className="text-brand-black">My Account</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-black/5 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
            Welcome, {user.name || 'Customer'}
          </h1>
          <p className="text-xs text-brand-dark-gray font-semibold uppercase tracking-wider mt-1">
            Shopper Dashboard • Role: <span className="text-brand-black font-extrabold">{user.role}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Profile Info (4 cols) */}
        <div className="lg:col-span-4 bg-brand-white border border-brand-black/5 p-6 clip-angled space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
              Profile Information
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2.5 font-semibold text-brand-dark-gray">
                <User className="w-4.5 h-4.5 text-brand-accent shrink-0" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-brand-dark-gray/60 block">Full Name</span>
                  <span className="text-brand-black font-bold">{user.name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 font-semibold text-brand-dark-gray">
                <Mail className="w-4.5 h-4.5 text-brand-accent shrink-0" />
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-brand-dark-gray/60 block">Email Address</span>
                  <span className="text-brand-black font-bold">{user.email}</span>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-2.5 font-semibold text-brand-dark-gray">
                  <Phone className="w-4.5 h-4.5 text-brand-accent shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-brand-dark-gray/60 block">Mobile Phone</span>
                    <span className="text-brand-black font-bold">{user.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-brand-black/5" />

          <div className="space-y-3 text-[10px] font-semibold text-brand-dark-gray leading-normal">
            <p className="font-bold text-brand-black uppercase">Need Assistance?</p>
            <p>For custom delivery inquiries or order modification requests, contact TecticalHub support at support@tecticalhub.com.pk.</p>
          </div>
        </div>

        {/* Right Side: Order History (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
              Order History ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <ShoppingBag className="w-12 h-12 text-brand-dark-gray/30 mx-auto stroke-[1.5]" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">No orders placed yet</h4>
                  <p className="text-[11px] text-brand-dark-gray mt-1">You haven&apos;t placed any orders with us yet.</p>
                </div>
                <Link
                  href="/"
                  className="inline-block border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase py-2.5 px-6 transition-colors clip-angled"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div 
                    key={order.id}
                    className="border border-brand-black/5 p-4 clip-angled-sm bg-brand-light-gray space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-black/5 pb-2 text-xs">
                      <div>
                        <span className="font-black text-brand-black">{order.orderNumber}</span>
                        <span className="text-[10px] text-brand-dark-gray font-semibold ml-2 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase clip-angled-sm ${
                        order.status === 'DELIVERED'
                          ? 'bg-success text-brand-white'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-500 text-brand-white'
                          : 'bg-brand-black text-brand-accent'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Order items listing */}
                    <div className="divide-y divide-brand-black/5">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between py-2 text-xs font-semibold">
                          <span className="text-brand-dark-gray">{item.name} <strong className="text-brand-black font-bold">x {item.quantity}</strong></span>
                          <span className="text-brand-black">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-baseline border-t border-brand-black/5 pt-2 text-xs">
                      <span className="font-bold text-brand-dark-gray uppercase">Total paid ({order.paymentMethod})</span>
                      <span className="text-sm font-extrabold text-brand-black">Rs. {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
