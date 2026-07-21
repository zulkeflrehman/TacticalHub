'use client';

import Image from 'next/image';
import { useState } from 'react';

interface CatalogImageProps {
  src: string;
  alt: string;
  /** Tailwind object-* class, e.g. "object-contain" or "object-cover" */
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Wrapper around next/image that:
 * - always fills its parent container (parent must be `position: relative`)
 * - shows a neutral grey placeholder when src is empty
 * - shows the same placeholder on load error
 * - accepts an optional `className` for object-fit overrides
 */
export default function CatalogImage({
  src,
  alt,
  className = 'object-contain',
  sizes = '100vw',
  priority = false,
}: CatalogImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-brand-light-gray">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-brand-dark-gray/25"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h.008v.008H3V9.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      priority={priority}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
