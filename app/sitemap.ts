import { MetadataRoute } from 'next';
import { ProductService } from '@/lib/services/product-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tecticalhub.com.pk';

  // Base routes
  const staticRoutes = [
    '',
    '/wishlist',
    '/cart',
    '/pages/about-us',
    '/pages/contact-us',
    '/pages/faq',
    '/pages/privacy-policy',
    '/pages/terms-and-conditions',
    '/pages/shipping-policy',
    '/pages/return-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

  // Fetch dynamic categories
  let categoryRoutes: any[] = [];
  try {
    const categories = await ProductService.getCategories();
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // Fallback
  }

  // Fetch dynamic products
  let productRoutes: any[] = [];
  try {
    const products = await ProductService.getProducts();
    productRoutes = products.map((prod) => ({
      url: `${baseUrl}/products/${prod.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch {
    // Fallback
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
