'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CategoryListing from '@/components/storefront/CategoryListing';
import { listCategories, listPublishedProducts } from '@/lib/client-services';
import type { CategoryDto, ProductDto } from '@/lib/catalog-types';

function CategoryView() {
  const slug = useSearchParams().get('slug') || '';
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listCategories(), listPublishedProducts()]).then(([categories, catalog]) => {
      setCategory(categories.find((entry) => entry.slug === slug) || null);
      setProducts(catalog.filter((entry) => entry.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug));
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="py-20 text-center text-xs font-bold uppercase">Loading collection...</p>;
  if (!category) return <div className="py-20 text-center"><h1 className="text-2xl font-black uppercase">Collection not found</h1><Link href="/" className="text-xs font-bold underline">Return home</Link></div>;
  return <CategoryListing category={category} initialProducts={products} />;
}

export default function CategoryPage() {
  return <Suspense fallback={<p className="py-20 text-center text-xs font-bold uppercase">Loading collection...</p>}><CategoryView /></Suspense>;
}
