'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application route failed.', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-black uppercase">We could not load this page</h1>
      <p className="text-sm text-brand-dark-gray">Please retry. If the issue continues, contact store support.</p>
      <button onClick={reset} className="bg-brand-black px-6 py-3 text-xs font-bold uppercase text-brand-white">
        Try again
      </button>
    </main>
  );
}
