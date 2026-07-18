'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToastStore } from '@/lib/toast-store';
import { Mail, ShieldCheck } from 'lucide-react';

export default function StoreFooter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Successfully subscribed to our newsletter!', 'success');
        setEmail('');
      } else {
        addToast(data.message || 'Subscription failed.', 'error');
      }
    } catch {
      addToast('Error subscribing to newsletter.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const footerLinks = {
    shop: [
      { name: 'Camping Tents', href: '/categories/camping-tents' },
      { name: 'Travel & Camping', href: '/categories/travel-camping' },
      { name: 'Knives & Tasers', href: '/categories/knives-tasers' },
      { name: 'Premium Items', href: '/categories/premium-items' },
    ],
    info: [
      { name: 'About Us', href: '/pages/about-us' },
      { name: 'Contact Us', href: '/pages/contact-us' },
      { name: 'FAQs', href: '/pages/faq' },
    ],
    policies: [
      { name: 'Privacy Policy', href: '/pages/privacy-policy' },
      { name: 'Terms of Service', href: '/pages/terms-and-conditions' },
      { name: 'Shipping Policy', href: '/pages/shipping-policy' },
      { name: 'Returns & Refund Policy', href: '/pages/return-policy' },
    ]
  };

  return (
    <footer className="bg-brand-black text-brand-white pt-12 pb-24 lg:pb-12 border-t border-brand-dark-gray/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-brand-dark-gray/20">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="text-xl font-black uppercase tracking-tighter text-brand-white">
              TECTICAL<span className="text-brand-accent">HUB</span>
            </Link>
            <p className="text-xs text-brand-white/70 leading-relaxed font-medium">
              Premium independent outdoor adventure outlet. Supplying Pakistan with military-grade survival tools, tents, defensive baton sticks, and high-performance wear.
            </p>
            <div className="flex gap-4 pt-1">
              <a href="#" aria-label="Facebook" className="text-brand-white/60 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-brand-white/60 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="text-brand-white/60 hover:text-brand-accent transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Policy Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-white border-l-2 border-brand-accent pl-2">Customer Care</h4>
            <ul className="space-y-2 text-xs font-semibold text-brand-white/75">
              {footerLinks.info.map(l => (
                <li key={l.name}>
                  <Link href={l.href} className="hover:text-brand-accent transition-colors">{l.name}</Link>
                </li>
              ))}
              {footerLinks.policies.map(l => (
                <li key={l.name}>
                  <Link href={l.href} className="hover:text-brand-accent transition-colors">{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-white border-l-2 border-brand-accent pl-2">Collections</h4>
            <ul className="space-y-2 text-xs font-semibold text-brand-white/75">
              {footerLinks.shop.map(l => (
                <li key={l.name}>
                  <Link href={l.href} className="hover:text-brand-accent transition-colors">{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-white border-l-2 border-brand-accent pl-2">Stay Prepared</h4>
            <p className="text-xs text-brand-white/70 leading-relaxed font-medium">
              Subscribe to get notified about new tactical inventory arrivals, restocks, and exclusive promo codes.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2 pt-1">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-brand-dark-gray/30 border border-brand-dark-gray/60 focus:border-brand-accent py-2.5 pl-4 pr-12 text-xs font-semibold text-brand-white focus:outline-none clip-angled"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1 bottom-1 px-3.5 bg-brand-accent text-brand-black hover:bg-brand-accent-hover transition-colors clip-angled flex items-center justify-center"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[10px] font-bold text-brand-white/50 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} TecticalHub. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-accent" />
            <span>SECURE CHECKOUT | CASH ON DELIVERY ONLY</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
