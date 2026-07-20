'use client';

import Link from 'next/link';
import { Calendar, ChevronRight, FileText, FolderOpen, Home, LayoutDashboard, Mail, ShoppingCart, Ticket, UserCircle } from 'lucide-react';
import AuthGate from '@/components/auth/AuthGate';
import LogoutButton from '@/components/account/LogoutButton';

const sidebarLinks = [
  { name: 'Dashboard Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Manage Products', icon: ShoppingCart, href: '/admin/products' },
  { name: 'Categories', icon: FolderOpen, href: '/admin/categories' },
  { name: 'Manage Orders', icon: Calendar, href: '/admin/orders' },
  { name: 'Discount Coupons', icon: Ticket, href: '/admin/coupons' },
  { name: 'Content Pages', icon: FileText, href: '/admin/content' },
  { name: 'Messages', icon: Mail, href: '/admin/messages' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate admin>{(_user, profile) => (
    <div className="min-h-screen flex bg-brand-light-gray">
      <aside className="hidden md:flex flex-col w-64 bg-brand-black text-brand-white shrink-0 border-r border-brand-dark-gray/30">
        <div className="p-6 border-b border-brand-dark-gray/20"><Link href="/" className="text-lg font-black uppercase">TECTICAL<span className="text-brand-accent">HUB</span></Link><span className="text-[8px] font-bold tracking-widest text-brand-accent uppercase block">Control Center</span></div>
        <nav className="flex-1 p-4 space-y-1">{sidebarLinks.map((link) => <Link key={link.name} href={link.href} className="flex items-center justify-between p-3 text-xs font-bold uppercase text-brand-white/80 hover:bg-brand-dark-gray/20"><span className="flex items-center gap-3"><link.icon className="w-4 h-4 text-brand-accent"/>{link.name}</span><ChevronRight className="w-3 h-3"/></Link>)}</nav>
        <div className="p-4 border-t border-brand-dark-gray/20 space-y-3"><div className="flex gap-2"><UserCircle className="w-5 h-5 text-brand-accent"/><span className="text-[10px] font-bold truncate">{profile.name}</span></div><Link href="/" className="flex justify-center gap-2 p-2 border border-brand-accent/20 text-xs font-bold uppercase text-brand-accent"><Home className="w-3.5 h-3.5"/> Return Store</Link></div>
      </aside>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <header className="bg-brand-white border-b border-brand-black/5 p-4 md:px-8 flex items-center justify-between"><div className="flex md:hidden gap-2 overflow-x-auto">{sidebarLinks.map((link) => <Link key={link.href} href={link.href} title={link.name}><link.icon className="w-5 h-5"/></Link>)}</div><span className="hidden sm:inline text-xs font-bold">Authorized: {profile.email}</span><LogoutButton/></header>
        <main className="p-6 md:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )}</AuthGate>;
}
