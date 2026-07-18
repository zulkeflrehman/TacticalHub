import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import CategoryListing from '@/components/storefront/CategoryListing';
import { Metadata } from 'next';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categories = await ProductService.getCategories();
  const cat = categories.find(c => c.slug === resolvedParams.slug);

  if (!cat) {
    return {
      title: 'Collection Not Found | TECTICALHUB'
    };
  }

  return {
    title: `${cat.name.toUpperCase()} | Buy Tactical Gear & Tents at TECTICALHUB`,
    description: `Shop premium military-grade ${cat.name.toLowerCase()} at TecticalHub. High performance outdoor tools. Cash on Delivery across Pakistan.`
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categories = await ProductService.getCategories();
  const cat = categories.find(c => c.slug === resolvedParams.slug);

  if (!cat) {
    notFound();
  }

  const products = await ProductService.getProducts({
    categorySlug: resolvedParams.slug
  });

  return (
    <CategoryListing
      category={cat}
      initialProducts={products}
    />
  );
}
