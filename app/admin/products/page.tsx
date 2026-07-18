import { ProductService } from '@/lib/services/product-service';
import ProductList from '@/components/admin/ProductList';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await ProductService.getProducts();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Manage Inventory
        </h1>
        <p className="text-xs text-brand-dark-gray font-semibold uppercase tracking-wider mt-1">
          Catalog Products & Stock Allocations
        </p>
      </div>

      <ProductList initialProducts={products} />
    </div>
  );
}
