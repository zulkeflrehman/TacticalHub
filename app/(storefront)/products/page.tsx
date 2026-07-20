'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductDetails from '@/components/product/ProductDetails';
import { listPublishedProducts } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';

function ProductView() {
  const slug = useSearchParams().get('slug') || '';
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [related, setRelated] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedProducts().then((products) => {
      const selected = products.find((entry) => entry.slug === slug) || null;
      setProduct(selected);
      setRelated(selected ? products.filter((entry) => entry.categoryName === selected.categoryName && entry.id !== selected.id) : []);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="py-20 text-center text-xs font-bold uppercase">Loading product...</p>;
  if (!product) return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-2xl font-black uppercase">Product not found</h1>
      <Link href="/" className="text-xs font-bold underline">Return to the catalog</Link>
    </div>
  );
  return <ProductDetails product={product} relatedProducts={related} />;
}

export default function ProductPage() {
  return <Suspense fallback={<p className="py-20 text-center text-xs font-bold uppercase">Loading product...</p>}><ProductView /></Suspense>;
}
