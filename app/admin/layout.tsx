import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import LogoutButton from '@/components/account/LogoutButton';
import { 
  LayoutDashboard, ShoppingCart, Calendar, Ticket, 
  Home, ChevronRight, UserCircle, FolderOpen, FileText 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Route security check (redundancy for middleware)
  if (!user || user.role !== 'ADMIN') {
    redirect('/account/login');
  }

  const sidebarLinks = [
    { name: 'Dashboard Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
    { name: 'Manage Products', icon: ShoppingCart, href: '/admin/products' },
    { name: 'Categories', icon: FolderOpen, href: '/admin/categories' },
    { name: 'Manage Orders', icon: Calendar, href: '/admin/orders' },
    { name: 'Discount Coupons', icon: Ticket, href: '/admin/coupons' },
    { name: 'Content Pages', icon: FileText, href: '/admin/content' },
  ];

  return (
    <div className="min-h-screen flex bg-brand-light-gray">
      {/* Dark Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-black text-brand-white shrink-0 border-r border-brand-dark-gray/30">
        <div className="p-6 border-b border-brand-dark-gray/20">
          <Link href="/" className="text-lg font-black uppercase tracking-tighter text-brand-white">
            TECTICAL<span className="text-brand-accent">HUB</span>
          </Link>
          <span className="text-[8px] font-bold tracking-widest text-brand-accent uppercase block mt-1">
            Control Center
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider text-brand-white/80 hover:text-brand-white hover:bg-brand-dark-gray/20 transition-all clip-angled-sm group"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
                <span>{link.name}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-brand-dark-gray/50 group-hover:text-brand-accent transition-colors" />
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-dark-gray/20 space-y-3">
          <div className="flex items-center gap-2 px-2">
            <UserCircle className="w-5 h-5 text-brand-accent" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-brand-white block truncate">{user.name || 'Admin'}</span>
              <span className="text-[8px] text-brand-dark-gray uppercase font-bold block">Security: Admin</span>
            </div>
          </div>
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 p-2 border border-brand-accent/20 hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase transition-all clip-angled text-brand-accent"
          >
            <Home className="w-3.5 h-3.5" /> Return Store
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <header className="bg-brand-white border-b border-brand-black/5 py-4 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark-gray md:hidden">
            <Link href="/" className="font-bold text-brand-black uppercase">TECTICALHUB</Link>
            <span>/</span>
            <span>Admin Control Panel</span>
          </div>
          <div className="hidden md:block text-xs font-semibold text-brand-dark-gray">
            Operational Region: <strong className="text-brand-black">Pakistan (PKR)</strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-bold text-brand-black">
              Authorized: {user.email}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
