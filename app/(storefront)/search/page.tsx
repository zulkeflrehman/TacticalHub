import Link from 'next/link';
import { ProductService } from '@/lib/services/product-service';
import ProductCard from '@/components/product/ProductCard';
import { Search } from 'lucide-react';
import { Metadata } from 'next';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  return {
    title: q ? `Search results for "${q}" | TECTICALHUB` : 'Search Gear | TECTICALHUB',
    description: `Search results for tactical equipment matching query ${q}.`
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';

  const products = query
    ? await ProductService.getProducts({ searchQuery: query })
    : [];

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Title */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-brand-dark-gray/60 uppercase tracking-widest flex items-center gap-1">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <span className="text-brand-black">Search Results</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Search Results
        </h1>
        {query ? (
          <p className="text-xs sm:text-sm text-brand-dark-gray font-medium">
            Showing matching results for &ldquo;<strong className="text-brand-black font-extrabold">{query}</strong>&rdquo;
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-brand-dark-gray font-medium">
            Enter a search term above to browse our inventory.
          </p>
        )}
      </div>

      {/* Product Grid Area */}
      <div>
        {products.length === 0 ? (
          <div className="bg-brand-white border border-brand-black/5 py-20 px-4 text-center rounded-none clip-angled">
            <Search className="w-12 h-12 text-brand-dark-gray/30 mx-auto stroke-[1.5] mb-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">No matching results found</h3>
            <p className="text-xs text-brand-dark-gray mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any products matching &ldquo;{query}&rdquo;. Check spelling or try searching broad terms like &ldquo;tent&rdquo; or &ldquo;baton&rdquo;.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block border border-brand-black text-brand-black hover:bg-brand-black hover:text-brand-white text-xs font-bold uppercase py-2.5 px-6 transition-colors clip-angled"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-xs font-semibold text-brand-dark-gray/80">
              Found <strong className="text-brand-black font-extrabold">{products.length}</strong> items matching your search.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
