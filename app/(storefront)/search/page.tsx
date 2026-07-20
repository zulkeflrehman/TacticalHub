'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { listPublishedProducts } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';

function Results() {
  const search = useSearchParams().get('q')?.trim() || '';
  const [catalog, setCatalog] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listPublishedProducts().then(setCatalog).finally(() => setLoading(false)); }, []);
  const products = useMemo(() => {
    const needle = search.toLowerCase();
    return needle ? catalog.filter((product) => [product.name, product.description, product.vendor, product.categoryName].some((value) => value.toLowerCase().includes(needle))) : [];
  }, [catalog, search]);

  return <div className="space-y-8">
    <div><h1 className="text-2xl sm:text-3xl font-black uppercase">Search Results</h1><p className="text-xs text-brand-dark-gray">Results for &ldquo;{search}&rdquo;</p></div>
    {loading ? <p className="text-xs font-bold uppercase">Searching...</p> : products.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="py-20 text-center"><Search className="w-12 h-12 mx-auto text-brand-dark-gray/30"/><p className="mt-4 text-xs font-bold uppercase">No matching products</p><Link href="/" className="text-xs underline">Return home</Link></div>}
  </div>;
}

export default function SearchPage() {
  return <Suspense fallback={<p className="py-20 text-center text-xs font-bold uppercase">Searching...</p>}><Results /></Suspense>;
}
