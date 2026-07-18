import { adminDb } from '@/lib/firebase-admin';
import { ProductService } from '@/lib/services/product-service';
import Link from 'next/link';
import { 
  DollarSign, ShoppingCart, Package, AlertTriangle, 
  ArrowUpRight, ShieldAlert, CheckCircle2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let stats = {
    revenue: 0,
    ordersCount: 0,
    productsCount: 0,
    lowStockCount: 0,
    recentOrders: [] as any[]
  };

  try {
    const productsSnap = await adminDb.collection('products').get();
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const ordersSnap = await adminDb.collection('orders').get();
    const orders = ordersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      };
    });

    // Sort descending by date
    orders.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    stats.productsCount = products.length;
    stats.ordersCount = orders.length;
    stats.revenue = orders.reduce((acc: number, o: any) => acc + (o.total || 0), 0);

    // Calculate low stock (under 10 items)
    let lowStock = 0;
    products.forEach((p: any) => {
      const stock = (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
      if (stock < 10) lowStock++;
    });
    stats.lowStockCount = lowStock;

    stats.recentOrders = orders.slice(0, 5).map((o: any) => ({
      id: o.id,
      number: o.orderNumber,
      customer: `${o.firstName || ''} ${o.lastName || ''}`,
      total: o.total || 0,
      status: o.status || 'PENDING',
      date: new Date(o.createdAt).toLocaleDateString()
    }));

  } catch (err) {
    console.warn("Firestore connection failed in admin dashboard stats. Serving mock statistics.", err);
    
    const jsonProds = await ProductService.getProducts();
    stats.productsCount = jsonProds.length;
    stats.ordersCount = 142;
    stats.revenue = 1428500;
    stats.lowStockCount = 4;
    stats.recentOrders = [
      { id: '1', number: 'TECT-98242', customer: 'Imran Khan', total: 24500, status: 'PENDING', date: '2026-07-18' },
      { id: '2', number: 'TECT-87143', customer: 'Sajid Mehmood', total: 11999, status: 'CONFIRMED', date: '2026-07-17' },
      { id: '3', number: 'TECT-76295', customer: 'Ayesha Bibi', total: 7999, status: 'SHIPPED', date: '2026-07-16' },
      { id: '4', number: 'TECT-65239', customer: 'Bilal Ahmed', total: 32000, status: 'DELIVERED', date: '2026-07-15' },
      { id: '5', number: 'TECT-54210', customer: 'Farhan Ali', total: 5500, status: 'CANCELLED', date: '2026-07-14' }
    ];
  }

  const kpis = [
    { title: 'Total Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-success' },
    { title: 'Orders Placed', value: stats.ordersCount, icon: ShoppingCart, color: 'text-brand-accent' },
    { title: 'Products in Store', value: stats.productsCount, icon: Package, color: 'text-info' },
    { title: 'Low Stock Alerts', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-error' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Dashboard Overview
        </h1>
        <p className="text-xs text-brand-dark-gray font-semibold uppercase tracking-wider mt-1">
          Store Operations & Financials
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-brand-white border border-brand-black/5 p-6 clip-angled flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark-gray/60">{kpi.title}</span>
              <p className="text-xl sm:text-2xl font-black text-brand-black">{kpi.value}</p>
            </div>
            <div className={`p-3 bg-brand-light-gray rounded-none border border-brand-black/5 clip-angled-sm ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
              Recent Orders
            </h3>
            <Link href="/admin/orders" className="text-[10px] font-extrabold uppercase text-brand-black hover:text-brand-accent transition-colors flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="bg-brand-light-gray text-brand-dark-gray uppercase text-[10px] border-b border-brand-black/5">
                  <th className="p-3">Order No.</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-black/5">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-light-gray/40">
                    <td className="p-3 font-bold text-brand-black">{o.number}</td>
                    <td className="p-3 text-brand-dark-gray">{o.customer}</td>
                    <td className="p-3 text-brand-black font-extrabold">Rs. {o.total.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase clip-angled-sm ${
                        o.status === 'DELIVERED'
                          ? 'bg-success/10 text-success border border-success/20'
                          : o.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-600 border border-red-200'
                          : 'bg-brand-accent/20 text-brand-black border border-brand-accent/40'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-brand-dark-gray">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-brand-white border border-brand-black/5 p-6 clip-angled-lg space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-black border-l-2 border-brand-accent pl-2">
            Low Stock Alerts
          </h3>

          <div className="space-y-3">
            {stats.lowStockCount > 0 ? (
              <>
                <div className="bg-red-50 text-red-600 border border-red-100 p-3 text-[10px] font-semibold flex gap-2 items-start clip-angled-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-bold uppercase">Inventory Warning</p>
                    <p className="mt-0.5 leading-relaxed">
                      {stats.lowStockCount} products are currently running low on stock and need attention.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/products"
                  className="w-full inline-block text-center py-2.5 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase transition-colors clip-angled"
                >
                  Adjust Inventory
                </Link>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-brand-dark-gray/60 font-semibold">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                All stock levels are optimal.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
