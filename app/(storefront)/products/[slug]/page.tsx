import { notFound } from 'next/navigation';
import { ProductService } from '@/lib/services/product-service';
import ProductDetails from '@/components/product/ProductDetails';
import { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await ProductService.getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found | TECTICALHUB'
    };
  }

  return {
    title: `${product.name.toUpperCase()} | Buy Online in Pakistan at TECTICALHUB`,
    description: `${product.name} by ${product.vendor}. ${product.shortDescription || ''} Flat-rate COD shipping nationwide.`
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await ProductService.getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  // Fetch related products in same category (excluding current)
  const categorySlug = product.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const allRelated = await ProductService.getProducts({ categorySlug });
  const related = allRelated.filter(p => p.slug !== product.slug);

  return (
    <ProductDetails
      product={product}
      relatedProducts={related}
    />
  );
}
