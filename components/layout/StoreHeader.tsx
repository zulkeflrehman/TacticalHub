'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  // ref for the hamburger button so focus can be restored when drawer closes
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  // ref for the first focusable element inside the drawer
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

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

  // closeDrawer is stable (only calls stable state setters and refs); define before the effect.
  const closeDrawer = useCallback(() => {
    setIsMobileMenuOpen(false);
    requestAnimationFrame(() => menuBtnRef.current?.focus());
  }, []);

  // Body-scroll lock + Escape key for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerCloseRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, closeDrawer]);

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
    <header className="w-full bg-brand-white shadow-sm border-b border-brand-black/5 z-40 sticky top-0">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Hamburger Menu Icon */}
        <button
          ref={menuBtnRef}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-drawer"
          className="lg:hidden p-3 -ml-1 text-brand-black hover:bg-brand-light-gray rounded-none min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1 text-xl font-extrabold uppercase leading-none tracking-tighter text-brand-black min-[360px]:text-2xl sm:text-3xl">
            TECTICAL<span className="text-brand-accent">HUB</span>
          </span>
          <span className="mt-0.5 hidden select-none text-[9px] font-bold uppercase tracking-widest text-brand-dark-gray/80 min-[360px]:block">
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
        <div className="flex items-center gap-0 sm:gap-3">
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

          {/* Account Profile / Login - Hidden on mobile, accessible via menu */}
          {sessionUser ? (
            <div className="relative group hidden sm:block">
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
              className="p-2 text-brand-black hover:bg-brand-light-gray transition-colors flex items-center gap-1 hidden sm:flex"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="p-2 sm:p-2.5 text-brand-black hover:bg-brand-light-gray transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="My Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-black text-brand-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-brand-white">
                {wishlist.length > 9 ? '9+' : wishlist.length}
              </span>
            )}
          </Link>

          {/* Cart Icon Drawer Trigger */}
          <button
            onClick={() => toggleMiniCart(true)}
            data-testid="cart-button"
            className="p-2 sm:p-2.5 text-brand-black hover:bg-brand-light-gray transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Shopping Cart"
            aria-label={`Shopping cart, ${totalCartItems} item${totalCartItems !== 1 ? 's' : ''}`}
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-accent text-brand-black text-[9px] font-extrabold flex items-center justify-center rounded-full border border-brand-white">
                {totalCartItems > 9 ? '9+' : totalCartItems}
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
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[min(320px,85vw)] bg-brand-white shadow-2xl flex flex-col z-50 animate-slide-right">
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-brand-black/5 flex items-center justify-between bg-brand-black text-brand-white shrink-0">
              <span className="font-extrabold tracking-tight text-sm uppercase">TECTICALHUB</span>
              <button
                ref={drawerCloseRef}
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="text-brand-white/80 hover:text-brand-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-brand-black/5 shrink-0">
              <form onSubmit={(e) => { handleSearchSubmit(e); closeDrawer(); }} className="relative">
                <input
                  type="search"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                  className="w-full bg-brand-light-gray border border-brand-black/10 py-2.5 pl-3 pr-11 text-sm font-semibold focus:outline-none focus:border-brand-black"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute right-0 top-0 bottom-0 px-3 text-brand-dark-gray hover:text-brand-black min-w-[44px] flex items-center justify-center"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Scrollable Nav Links */}
            <nav
              aria-label="Mobile navigation"
              className="flex-1 overflow-y-auto"
            >
              <div className="px-2 py-2 space-y-0.5">
                <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-brand-dark-gray/50">
                  Shop
                </p>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={closeDrawer}
                    className="flex items-center px-3 py-3 text-sm font-bold uppercase tracking-wide hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]"
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="border-t border-brand-black/5 mt-2" />

                <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-brand-dark-gray/50">
                  Account
                </p>
                <Link
                  href="/account/profile"
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]"
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>{sessionUser ? (sessionUser.name || 'My Account') : 'Sign In / Register'}</span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeDrawer}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]"
                >
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>Wishlist</span>
                  {wishlist.length > 0 && (
                    <span className="ml-auto text-[10px] font-black bg-brand-black text-brand-white rounded-full w-5 h-5 flex items-center justify-center">{wishlist.length}</span>
                  )}
                </Link>
                <button
                  onClick={() => { toggleMiniCart(true); closeDrawer(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px] text-left"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Cart</span>
                  {totalCartItems > 0 && (
                    <span className="ml-auto text-[10px] font-black bg-brand-accent text-brand-black rounded-full w-5 h-5 flex items-center justify-center">{totalCartItems}</span>
                  )}
                </button>

                {sessionUser?.role === 'ADMIN' && (
                  <>
                    <div className="border-t border-brand-black/5 mt-2" />
                    <Link
                      href="/admin/dashboard"
                      onClick={closeDrawer}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]"
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </>
                )}

                {sessionUser && (
                  <button
                    onClick={() => { handleLogout(); closeDrawer(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold hover:bg-red-50 text-red-500 transition-colors min-h-[44px] text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Log Out</span>
                  </button>
                )}

                <div className="border-t border-brand-black/5 mt-2" />
                <p className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-brand-dark-gray/50">
                  Info
                </p>
                <Link href="/pages?slug=faq" onClick={closeDrawer} className="flex items-center px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]">FAQ</Link>
                <Link href="/pages?slug=shipping-policy" onClick={closeDrawer} className="flex items-center px-3 py-3 text-sm font-bold hover:bg-brand-light-gray text-brand-black transition-colors min-h-[44px]">Shipping Policy</Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Cart Drawer element */}
      <CartDrawer />
    </header>
  );
}
