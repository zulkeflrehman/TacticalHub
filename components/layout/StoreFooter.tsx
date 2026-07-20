'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToastStore } from '@/lib/toast-store';
import { Mail, ShieldCheck } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/client-services';

export default function StoreFooter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await subscribeNewsletter(email);
      addToast('Successfully subscribed to our newsletter!', 'success');
      setEmail('');
    } catch {
      addToast('Error subscribing to newsletter.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const footerLinks = {
    shop: [
      { name: 'Camping Tents', href: '/categories?slug=camping-tents' },
      { name: 'Travel & Camping', href: '/categories?slug=travel-camping' },
      { name: 'Knives & Tasers', href: '/categories?slug=knives-tasers' },
      { name: 'Premium Items', href: '/categories?slug=premium-items' },
    ],
    info: [
      { name: 'About Us', href: '/pages?slug=about-us' },
      { name: 'Contact Us', href: '/pages?slug=contact-us' },
      { name: 'FAQs', href: '/pages?slug=faq' },
    ],
    policies: [
      { name: 'Privacy Policy', href: '/pages?slug=privacy-policy' },
      { name: 'Terms of Service', href: '/pages?slug=terms-and-conditions' },
      { name: 'Shipping Policy', href: '/pages?slug=shipping-policy' },
      { name: 'Returns & Refund Policy', href: '/pages?slug=return-policy' },
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
              Independent outdoor and tactical equipment storefront serving customers across Pakistan.
            </p>
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
            <span>Firestore-verified checkout | Cash on Delivery</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
