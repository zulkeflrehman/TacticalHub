'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { 
  Search, User, Heart, ShoppingBag, Menu, X, 
  Globe, DollarSign, LogOut, LayoutDashboard
} from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import CartDrawer from '../cart/CartDrawer';
import type { StoreUserDto } from '@/lib/catalog-types';
import { getUserProfile, listPublishedProducts } from '@/lib/client-services';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import CatalogImage from '@/components/ui/CatalogImage';

interface SuggestedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string }[];
  vendor: string;
}

export default function StoreHeader() {
  const router = useRouter();
  const { cart, wishlist, toggleMiniCart } = useStore();
  
  const [sessionUser, setSessionUser] = useState<StoreUserDto | null>(null);
  const [catalog, setCatalog] = useState<SuggestedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listPublishedProducts().then(setCatalog).catch(() => setCatalog([]));
    return onAuthStateChanged(auth, (user) => {
      if (!user) return setSessionUser(null);
      getUserProfile(user).then(setSessionUser).catch(() => setSessionUser(null));
    });
  }, []);

  // Debounced Search Suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    const delayDebounce = setTimeout(() => {
      const needle = searchQuery.trim().toLowerCase();
      setSuggestions(catalog.filter((product) =>
        product.name.toLowerCase().includes(needle) || product.vendor.toLowerCase().includes(needle),
      ).slice(0, 6));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [catalog, searchQuery]);

  // Click outside search listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setSearchQuery('');
    setShowSuggestions(false);
    router.push(`/products?slug=${encodeURIComponent(slug)}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSessionUser(null);
    router.push('/');
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const visibleSuggestions = searchQuery.trim().length >= 2 ? suggestions : [];

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Camping Tents', href: '/categories?slug=camping-tents' },
    { name: 'Travel & Camping', href: '/categories?slug=travel-camping' },
    { name: 'Knives & Tasers', href: '/categories?slug=knives-tasers' },
    { name: 'Premium Items', href: '/categories?slug=premium-items' },
  ];

  return (
    <header className="w-full bg-brand-white shadow-sm border-b border-brand-black/5 z-40 relative">
      <AnnouncementBar />

      {/* Top Utility Bar (Desktop Only) */}
      <div className="hidden lg:flex items-center justify-between px-8 py-2.5 bg-brand-black text-brand-white/80 text-[11px] font-semibold border-b border-brand-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 hover:text-brand-accent transition-colors cursor-pointer">
            <Globe className="w-3.5 h-3.5" />
            <span>ENGLISH</span>
          </div>
          <div className="flex items-center gap-1 hover:text-brand-accent transition-colors cursor-pointer">
            <DollarSign className="w-3.5 h-3.5" />
            <span>PKR</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/pages?slug=faq" className="hover:text-brand-white transition-colors">FAQ</Link>
          <Link href="/pages?slug=shipping-policy" className="hover:text-brand-white transition-colors">SHIPPING</Link>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
        {/* Mobile Hamburger Menu Icon */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 text-brand-black hover:bg-brand-light-gray"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tighter text-brand-black leading-none flex items-center gap-1">
            TECTICAL<span className="text-brand-accent">HUB</span>
          </span>
          <span className="text-[9px] font-bold tracking-widest text-brand-dark-gray/80 uppercase mt-0.5 select-none">
            MILITARY & OUTDOOR GEAR
          </span>
        </Link>

        {/* Autocomplete Search Bar (Desktop Only) */}
        <div ref={searchRef} className="hidden lg:block flex-1 max-w-lg relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search tactical equipment, tents, batons..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-brand-light-gray border border-brand-black/10 focus:border-brand-black py-2.5 pl-4 pr-12 text-sm font-semibold clip-angled focus:outline-none transition-standard"
            />
            <button 
              type="submit" 
              className="absolute right-0.5 top-0.5 bottom-0.5 px-4 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && visibleSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-white border border-brand-black/10 shadow-xl z-50 p-2 clip-angled">
              <div className="text-[10px] uppercase font-bold text-brand-dark-gray px-3 py-1.5 border-b border-brand-black/5">
                Suggested Products
              </div>
              <div className="divide-y divide-brand-black/5">
                {visibleSuggestions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSuggestionClick(p.slug)}
                    className="flex gap-3 p-3 hover:bg-brand-light-gray cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 bg-brand-light-gray relative shrink-0">
                      {p.images[0]?.url ? (
                        <CatalogImage src={p.images[0].url} alt={p.name} sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px]">No Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-black truncate">{p.name}</p>
                      <p className="text-[10px] text-brand-dark-gray">{p.vendor}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold">Rs. {p.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div 
                onClick={handleSearchSubmit}
                className="text-center py-2 text-xs font-bold text-brand-black hover:text-brand-accent transition-colors bg-brand-light-gray cursor-pointer mt-1 uppercase"
              >
                View all results
              </div>
            </div>
          )}
        </div>

        {/* Action Icons Panel */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Dashboard (Admin Only) */}
          {sessionUser?.role === 'ADMIN' && (
            <Link 
              href="/admin/dashboard" 
              className="p-2 text-brand-black hover:text-brand-accent transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase"
              title="Admin Dashboard"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          {/* Account Profile / Login */}
          {sessionUser ? (
            <div className="relative group">
              <button className="p-2 text-brand-black hover:bg-brand-light-gray transition-colors flex items-center gap-1">
                <User className="w-5 h-5" />
                <span className="hidden md:inline text-xs font-bold tracking-tight truncate max-w-[80px]">
                  {sessionUser.name || 'Account'}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-brand-white border border-brand-black/10 shadow-lg hidden group-hover:block z-50 p-1 w-44 clip-angled">
                <Link href="/account/profile" className="flex items-center gap-2 p-2.5 text-xs font-bold hover:bg-brand-light-gray transition-colors">
                  <User className="w-4 h-4" /> My Profile
                </Link>
                {sessionUser.role === 'ADMIN' && (
                  <Link href="/admin/dashboard" className="flex items-center gap-2 p-2.5 text-xs font-bold hover:bg-brand-light-gray transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2.5 text-xs font-bold hover:bg-red-50 text-red-500 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          ) : (
            <Link 
              href="/account/login" 
              className="p-2 text-brand-black hover:bg-brand-light-gray transition-colors flex items-center gap-1"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Wishlist Link */}
          <Link 
            href="/wishlist" 
            className="p-2 text-brand-black hover:bg-brand-light-gray transition-colors relative"
            title="My Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-black text-brand-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-brand-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Icon Drawer Trigger */}
          <button 
            onClick={() => toggleMiniCart(true)}
            className="p-2 text-brand-black hover:bg-brand-light-gray transition-colors relative"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-accent text-brand-black text-[9px] font-extrabold flex items-center justify-center rounded-full border border-brand-white">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation (Desktop Only) */}
      <div className="hidden lg:block border-t border-brand-black/5">
        <nav className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-8 py-3.5">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs font-bold uppercase tracking-widest text-brand-black hover:text-brand-accent transition-colors relative group py-1"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-brand-white shadow-2xl flex flex-col z-50 animate-slide-right">
            <div className="p-4 border-b border-brand-black/5 flex items-center justify-between bg-brand-black text-brand-white">
              <span className="font-extrabold tracking-tight text-base uppercase">TECTICALHUB</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-brand-white/80 hover:text-brand-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-brand-black/5">
              {/* Mobile Search input */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-light-gray border border-brand-black/10 py-2.5 pl-3 pr-10 text-xs font-semibold focus:outline-none"
                />
                <button type="submit" className="absolute right-3 top-3 text-brand-dark-gray">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block p-3 text-xs font-extrabold uppercase tracking-wider hover:bg-brand-light-gray text-brand-black transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-brand-black/5 bg-brand-light-gray text-[10px] font-bold text-brand-dark-gray space-y-3">
              <div className="flex gap-4">
                <Link href="/pages?slug=faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
                <Link href="/pages?slug=shipping-policy" onClick={() => setIsMobileMenuOpen(false)}>Shipping Policy</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer element */}
      <CartDrawer />
    </header>
  );
}
