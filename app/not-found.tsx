import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-black uppercase tracking-widest text-brand-accent">404</p>
      <h1 className="text-3xl font-black uppercase">Page not found</h1>
      <p className="text-sm text-brand-dark-gray">The requested product or page does not exist.</p>
      <Link href="/" className="bg-brand-black px-6 py-3 text-xs font-bold uppercase text-brand-white">Return to store</Link>
    </main>
  );
}
