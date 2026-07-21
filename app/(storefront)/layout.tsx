import StoreHeader from '@/components/layout/StoreHeader';
import StoreFooter from '@/components/layout/StoreFooter';
import MobileBottomNavigation from '@/components/layout/MobileBottomNavigation';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light-gray text-brand-black overflow-x-hidden">
      <StoreHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-12">
        {children}
      </main>
      <StoreFooter />
      <MobileBottomNavigation />
    </div>
  );
}
