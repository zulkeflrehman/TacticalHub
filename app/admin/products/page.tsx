'use client';

import { useEffect, useState } from 'react';
import ProductList from '@/components/admin/ProductList';
import { listAllProducts, listCategories } from '@/lib/client-services';
import type { ProductDto } from '@/lib/catalog-types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => { Promise.all([listAllProducts(), listCategories()]).then(([items, groups]) => { setProducts(items); setCategories(groups.map((entry) => entry.name)); }); }, []);
  return <div className="space-y-8"><div><h1 className="text-2xl sm:text-3xl font-black uppercase">Manage Inventory</h1><p className="text-xs text-brand-dark-gray font-semibold uppercase">Catalog Products, Publication & Stock</p></div>{products ? <ProductList initialProducts={products} categories={categories}/> : <p className="text-xs font-bold uppercase">Loading catalog...</p>}</div>;
}
