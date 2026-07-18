import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import { Metadata } from 'next';
import ContactForm from '@/components/storefront/ContactForm';

interface ContentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const fallbackPages: Record<string, { title: string; content: string }> = {
  'about-us': {
    title: 'About Us',
    content: 'Welcome to TecticalHub, Pakistan’s premium independent supplier of military-grade gear, camping tents, travel accessories, and self-defense equipment. We source high-performance equipment designed for extreme environments, offering unmatched durability and reliability. Our mission is to prepare you for any adventure.'
  },
  'contact-us': {
    title: 'Contact Us',
    content: 'Have questions? We are here to help. You can contact TecticalHub support by email at support@tecticalhub.com.pk, or by phone at +92-300-1234567. Our support hours are Monday to Saturday, 9:00 AM - 6:00 PM.'
  },
  'faq': {
    title: 'Frequently Asked Questions',
    content: '1. What is the delivery time? Standard delivery takes 3-5 business days across Pakistan.\n2. Do you offer Cash on Delivery? Yes, COD is our primary payment method.\n3. What is your return policy? We offer a 7-day hassle-free return policy for unused products in original packaging.'
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: 'Your privacy is extremely important to TecticalHub. We only collect details necessary to process your orders securely (shipping addresses, email, phone number). We do not share your private data with third parties except for delivery partner logistics.'
  },
  'terms-and-conditions': {
    title: 'Terms & Conditions',
    content: 'By using TecticalHub storefront, you agree to comply with our Terms of Service. Prices and product availability are subject to change. Order completion is verified on the server before dispatch.'
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    content: 'We ship all orders across Pakistan. Standard shipping is 250 PKR. Orders above 5,000 PKR qualify for Free Shipping. Tracking information is sent once the order is shipped.'
  },
  'return-policy': {
    title: 'Return and Refund Policy',
    content: 'We offer a 7-day return policy on all eligible purchases. If you receive a damaged or incorrect product, contact us within 48 hours. Returns are processed within 5 business days after inspection.'
  }
};

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const page = fallbackPages[slug];

  return {
    title: page ? `${page.title} | TECTICALHUB` : 'Page Not Found | TECTICALHUB'
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  let pageTitle = '';
  let pageContent = '';

  try {
    const doc = await adminDb.collection('contentPages').doc(slug).get();
    if (doc.exists) {
      const data = doc.data();
      pageTitle = data?.title || '';
      pageContent = data?.content || '';
    }
  } catch (err) {
    console.warn("Firestore offline, loading informational page from fallback dictionary.", err);
  }

  // Fallback if not in Firestore or Firestore offline
  if (!pageTitle && fallbackPages[slug]) {
    pageTitle = fallbackPages[slug].title;
    pageContent = fallbackPages[slug].content;
  }

  if (!pageTitle) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-brand-white border border-brand-black/5 p-8 md:p-12 clip-angled-lg">
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-brand-black">{pageTitle}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          {pageTitle}
        </h1>
      </div>

      <hr className="border-brand-black/5" />

      {/* Content body */}
      <div className="text-xs sm:text-sm font-semibold text-brand-dark-gray leading-relaxed whitespace-pre-line space-y-4">
        {pageContent}
      </div>

      {slug === 'contact-us' && (
        <div className="mt-8 border-t border-brand-black/5 pt-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-black mb-4">
            Send Us A Message
          </h3>
          <ContactForm />
        </div>
      )}
    </div>
  );
}
