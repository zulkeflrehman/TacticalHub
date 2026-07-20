'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ContactForm from '@/components/storefront/ContactForm';
import { getContentPage } from '@/lib/client-services';
import type { ContentPageDto } from '@/lib/catalog-types';

const fallbackPages: Record<string, Omit<ContentPageDto, 'id' | 'slug' | 'isPublished'>> = {
  'about-us': { title: 'About Us', content: 'TecticalHub is an independent Pakistan-based tactical, camping, and outdoor equipment store.' },
  'contact-us': { title: 'Contact Us', content: 'Send us a message using the form below and the store team will respond by email.' },
  faq: { title: 'Frequently Asked Questions', content: 'Delivery timing is confirmed when an order is processed. Cash on Delivery is available across supported locations in Pakistan.' },
  'privacy-policy': { title: 'Privacy Policy', content: 'We collect account, contact, and delivery details needed to process orders. Review and publish a complete legal policy before launch.' },
  'terms-and-conditions': { title: 'Terms & Conditions', content: 'Prices and availability can change. Orders are subject to confirmation before dispatch. Review and publish complete legal terms before launch.' },
  'shipping-policy': { title: 'Shipping Policy', content: 'Standard shipping is Rs. 250. Orders of Rs. 5,000 or more receive free shipping. Confirm delivery coverage and timings before launch.' },
  'return-policy': { title: 'Returns & Refund Policy', content: 'Review and publish the final return window, item-condition requirements, exclusions, and refund process before launch.' },
};

function ContentView() {
  const slug = useSearchParams().get('slug') || '';
  const [page, setPage] = useState<ContentPageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentPage(slug).then((entry) => {
      const fallback = fallbackPages[slug];
      setPage(entry || (fallback ? { id: slug, slug, isPublished: true, ...fallback } : null));
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="py-20 text-center text-xs font-bold uppercase">Loading page...</p>;
  if (!page) return <div className="py-20 text-center"><h1 className="text-2xl font-black uppercase">Page not found</h1><Link href="/" className="text-xs font-bold underline">Return home</Link></div>;
  return (
    <article className="max-w-3xl mx-auto space-y-8 bg-brand-white border border-brand-black/5 p-6 md:p-10 clip-angled-lg">
      <div className="space-y-2"><Link href="/" className="text-[10px] font-bold uppercase text-brand-dark-gray hover:underline">Home / Information</Link><h1 className="text-2xl sm:text-3xl font-black uppercase">{page.title}</h1></div>
      <div className="whitespace-pre-line text-sm font-medium leading-7 text-brand-dark-gray">{page.content}</div>
      {slug === 'contact-us' && <ContactForm />}
    </article>
  );
}

export default function ContentPage() {
  return <Suspense fallback={<p className="py-20 text-center text-xs font-bold uppercase">Loading page...</p>}><ContentView /></Suspense>;
}
