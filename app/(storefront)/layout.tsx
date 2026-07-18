import StoreHeader from '@/components/layout/StoreHeader';
import StoreFooter from '@/components/layout/StoreFooter';
import MobileBottomNavigation from '@/components/layout/MobileBottomNavigation';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-light-gray text-brand-black">
      <StoreHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
      <StoreFooter />
      <MobileBottomNavigation />
    </div>
  );
}
