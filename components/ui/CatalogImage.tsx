import Image from 'next/image';

export default function CatalogImage({
  src,
  alt,
  className = 'object-cover',
  sizes = '100vw',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
