export default function AnnouncementBar() {
  return (
    <div className="bg-brand-black text-brand-white text-xs font-semibold py-2 px-4 text-center tracking-wider uppercase border-b border-brand-dark-gray/30 flex items-center justify-center gap-2">
      <span>Pakistan Storefront</span>
      <span className="text-brand-dark-gray">|</span>
      <span className="text-brand-accent">Shipping and payment options confirmed at checkout</span>
    </div>
  );
}
