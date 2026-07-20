'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ margin: '5rem auto', maxWidth: 560, padding: 24, textAlign: 'center' }}>
          <h1>TECTICALHUB is temporarily unavailable</h1>
          <p>Please retry in a moment.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
