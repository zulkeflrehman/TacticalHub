'use client';

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-black text-brand-white text-xs font-semibold py-2 px-4 text-center tracking-wider uppercase border-b border-brand-dark-gray/30 flex items-center justify-center gap-2">
      <span>🇵🇰 Nationwide Cash on Delivery</span>
      <span className="text-brand-dark-gray">|</span>
      <span className="text-brand-accent">Free Delivery on Orders Over Rs. 5,000</span>
    </div>
  );
}
