'use client';

import { useState } from 'react';
import { Edit, Loader2, Package, Plus, Search, Trash2, X } from 'lucide-react';
import CatalogImage from '@/components/ui/CatalogImage';
import {
  adminProductFormToProduct,
  createEmptyAdminProductForm,
  productToAdminProductForm,
  type AdminProductFormValues,
  type ProductNumberInput,
} from '@/lib/admin-product-form';
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from '@/lib/catalog-types';
import type { ProductDto, ProductVariantDto } from '@/lib/catalog-types';
import { archiveProduct, saveProduct } from '@/lib/client-services';
import { useToastStore } from '@/lib/toast-store';

export type AdminProductVariant = ProductVariantDto;
export type AdminProduct = ProductDto;

interface ProductListProps {
  initialProducts: AdminProduct[];
  categories: string[];
}

function numberInput(value: string): ProductNumberInput {
  return value === '' ? '' : Number(value);
}

export default function ProductList({ initialProducts, categories }: ProductListProps) {
  const addToast = useToastStore((state) => state.addToast);
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [productForm, setProductForm] = useState<AdminProductFormValues | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
    || product.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    || product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

  const openCreateForm = () => {
    setProductForm(createEmptyAdminProductForm(categories[0] || ''));
  };

  const openEditForm = (product: AdminProduct) => {
    setProductForm(productToAdminProductForm(product));
  };

  const closeProductForm = () => {
    if (!isSavingForm) setProductForm(null);
  };

  const updateBasePrice = (value: ProductNumberInput) => {
    setProductForm((current) => current && ({
      ...current,
      price: value,
      variants: current.variants.map((variant) =>
        variant.price === current.price ? { ...variant, price: value } : variant),
    }));
  };

  const updateComparePrice = (value: ProductNumberInput) => {
    setProductForm((current) => current && ({
      ...current,
      compareAtPrice: value,
      variants: current.variants.map((variant) =>
        variant.compareAtPrice === current.compareAtPrice ? { ...variant, compareAtPrice: value } : variant),
    }));
  };

  const updateVariant = (index: number, changes: Partial<AdminProductFormValues['variants'][number]>) => {
    setProductForm((current) => current && ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...changes } : variant),
    }));
  };

  const handleProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productForm) return;

    setIsSavingForm(true);
    try {
      const product = adminProductFormToProduct(productForm);
      const slugOwner = products.find((entry) => entry.id !== product.id && entry.slug === product.slug);
      if (slugOwner) throw new Error(`The product slug is already used by “${slugOwner.name}”.`);
      if (!productForm.documentId && products.some((entry) => entry.id === product.id)) {
        throw new Error('A product with this document ID already exists. Use its Edit option instead.');
      }

      const savedProduct = await saveProduct(product);
      if (productForm.documentId) {
        setProducts((current) => current.map((entry) =>
          entry.id === productForm.documentId ? savedProduct : entry));
        addToast(`“${savedProduct.name}” updated in the same Firestore document.`, 'success');
      } else {
        setProducts((current) => [savedProduct, ...current]);
        addToast(`“${savedProduct.name}” created and saved to Firestore.`, 'success');
      }
      setProductForm(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save product.', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}" and remove it from the storefront?`)) return;

    setDeletingId(id);
    try {
      const current = products.find((product) => product.id === id);
      if (!current) throw new Error('Product not found.');
      await archiveProduct(current);
      setProducts((existingProducts) => existingProducts.filter((product) => product.id !== id));
      addToast(`“${name}” archived successfully.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to archive product.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFlag = async (
    id: string,
    flag: 'isFeatured' | 'isNewArrival' | 'isBestSeller',
    current: boolean,
  ) => {
    try {
      const product = products.find((entry) => entry.id === id);
      if (!product) throw new Error('Product not found.');
      const updated = await saveProduct({ ...product, [flag]: !current });
      setProducts((existingProducts) => existingProducts.map((entry) => entry.id === id ? updated : entry));
      addToast('Product flags updated.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update product flag.', 'error');
    }
  };

  const handleStatusChange = async (id: string, current: AdminProduct['status']) => {
    const status = current === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const product = products.find((entry) => entry.id === id);
      if (!product) throw new Error('Product not found.');
      const updated = await saveProduct({ ...product, status });
      setProducts((existingProducts) => existingProducts.map((entry) => entry.id === id ? updated : entry));
      addToast(status === 'PUBLISHED' ? 'Product published.' : 'Product moved to draft.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to change product status.', 'error');
    }
  };

  const editingProduct = Boolean(productForm?.documentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="clip-angled-sm w-full border border-brand-black/10 bg-brand-white py-2 pl-9 pr-4 text-xs font-semibold focus:border-brand-black focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-dark-gray/50" />
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={categories.length === 0}
          title={categories.length === 0 ? 'Create a category before adding products.' : 'Add a product'}
          className="clip-angled flex w-full items-center justify-center gap-1.5 border border-brand-black bg-brand-black px-6 py-2.5 text-xs font-extrabold uppercase text-brand-white transition-colors hover:bg-brand-accent hover:text-brand-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {productForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={closeProductForm} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="clip-angled-lg relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto border border-brand-black/10 bg-brand-white p-5 md:p-8"
          >
            <div className="mb-6 flex items-center justify-between border-b border-brand-black/5 pb-3">
              <div>
                <h3 id="product-form-title" className="text-sm font-black uppercase tracking-widest text-brand-black">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                {editingProduct && (
                  <p className="mt-1 text-[10px] font-semibold text-brand-dark-gray">
                    Firestore document: {productForm.documentId}
                  </p>
                )}
              </div>
              <button type="button" onClick={closeProductForm} disabled={isSavingForm} aria-label="Close product form" className="text-brand-dark-gray hover:text-brand-black disabled:opacity-50">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Product Name *
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => current && ({ ...current, name: event.target.value }))}
                    className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Storefront Slug
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(event) => setProductForm((current) => current && ({ ...current, slug: event.target.value }))}
                    placeholder="Generated from the product name"
                    className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none"
                  />
                </label>
              </div>

              <label className="block space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                Product Description
                <textarea
                  value={productForm.description}
                  onChange={(event) => setProductForm((current) => current && ({ ...current, description: event.target.value }))}
                  maxLength={MAX_PRODUCT_DESCRIPTION_LENGTH}
                  rows={7}
                  placeholder="Describe the product. Line breaks will be preserved on the product-details page."
                  className="mt-1 w-full resize-y border border-brand-black/10 bg-brand-light-gray p-3 text-xs font-semibold normal-case leading-relaxed text-brand-black focus:border-brand-black focus:outline-none"
                />
                <span className="block text-right text-[9px] font-bold normal-case text-brand-dark-gray/70">
                  {productForm.description.length.toLocaleString()} / {MAX_PRODUCT_DESCRIPTION_LENGTH.toLocaleString()} characters
                </span>
              </label>

              <label className="block space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                Short Description
                <input
                  type="text"
                  value={productForm.shortDescription}
                  onChange={(event) => setProductForm((current) => current && ({ ...current, shortDescription: event.target.value }))}
                  placeholder="Defaults to the product name"
                  className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Vendor / Brand
                  <input
                    type="text"
                    value={productForm.vendor}
                    onChange={(event) => setProductForm((current) => current && ({ ...current, vendor: event.target.value }))}
                    className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Category *
                  <select
                    required
                    value={productForm.categoryName}
                    onChange={(event) => setProductForm((current) => current && ({ ...current, categoryName: event.target.value }))}
                    className="admin-product-select mt-1 w-full cursor-pointer border border-brand-black/10 p-2.5 text-xs font-semibold normal-case focus:border-brand-black focus:outline-none"
                  >
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Base Price (PKR) *
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(event) => updateBasePrice(numberInput(event.target.value))}
                    className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold text-brand-black focus:border-brand-black focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Compare Price (PKR)
                  <input
                    type="number"
                    min="0"
                    value={productForm.compareAtPrice}
                    onChange={(event) => updateComparePrice(numberInput(event.target.value))}
                    placeholder="Optional"
                    className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2.5 text-xs font-semibold text-brand-black focus:border-brand-black focus:outline-none"
                  />
                </label>
              </div>

              <label className="block space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                Product Image URLs *
                <textarea
                  required
                  value={productForm.imageUrls}
                  onChange={(event) => setProductForm((current) => current && ({ ...current, imageUrls: event.target.value }))}
                  rows={4}
                  placeholder={'https://cdn.example.com/primary.jpg\nhttps://cdn.example.com/alternate.jpg'}
                  className="mt-1 w-full resize-y border border-brand-black/10 bg-brand-light-gray p-3 text-xs font-semibold normal-case leading-relaxed text-brand-black focus:border-brand-black focus:outline-none"
                />
                <span className="block text-[9px] font-bold normal-case text-brand-dark-gray/70">One URL per line. The first image is the primary image.</span>
              </label>

              <fieldset className="space-y-3 border border-brand-black/10 bg-brand-light-gray/50 p-4">
                <legend className="px-2 text-[10px] font-black uppercase tracking-widest text-brand-dark-gray">Variants & Stock</legend>
                {productForm.variants.map((variant, index) => (
                  <div key={variant.inventoryId || `new-variant-${index}`} className="space-y-3 border border-brand-black/10 bg-brand-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-[10px] font-black uppercase text-brand-black">Variant {index + 1}</strong>
                      {variant.inventoryId && <span className="truncate text-[9px] font-semibold text-brand-dark-gray">Inventory: {variant.inventoryId}</span>}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <label className="space-y-1 text-[9px] font-black uppercase text-brand-dark-gray lg:col-span-2">
                        Variant Name
                        <input type="text" required value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none" />
                      </label>
                      <label className="space-y-1 text-[9px] font-black uppercase text-brand-dark-gray lg:col-span-2">
                        SKU
                        <input type="text" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} placeholder="Generated when blank" className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2 text-xs font-semibold normal-case text-brand-black focus:border-brand-black focus:outline-none" />
                      </label>
                      <label className="space-y-1 text-[9px] font-black uppercase text-brand-dark-gray">
                        Stock *
                        <input type="number" required min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(index, { stock: numberInput(event.target.value) })} className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2 text-xs font-semibold text-brand-black focus:border-brand-black focus:outline-none" />
                      </label>
                      <label className="space-y-1 text-[9px] font-black uppercase text-brand-dark-gray lg:col-span-2">
                        Price (PKR) *
                        <input type="number" required min="1" value={variant.price} onChange={(event) => updateVariant(index, { price: numberInput(event.target.value) })} className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2 text-xs font-semibold text-brand-black focus:border-brand-black focus:outline-none" />
                      </label>
                      <label className="space-y-1 text-[9px] font-black uppercase text-brand-dark-gray lg:col-span-2">
                        Compare Price
                        <input type="number" min="0" value={variant.compareAtPrice} onChange={(event) => updateVariant(index, { compareAtPrice: numberInput(event.target.value) })} className="mt-1 w-full border border-brand-black/10 bg-brand-light-gray p-2 text-xs font-semibold text-brand-black focus:border-brand-black focus:outline-none" />
                      </label>
                    </div>
                  </div>
                ))}
              </fieldset>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_2fr]">
                <label className="space-y-1 text-[10px] font-black uppercase text-brand-dark-gray">
                  Publication Status
                  <select
                    value={productForm.status}
                    onChange={(event) => setProductForm((current) => current && ({ ...current, status: event.target.value as AdminProductFormValues['status'] }))}
                    className="admin-product-select mt-1 w-full cursor-pointer border border-brand-black/10 p-2.5 text-xs font-semibold normal-case focus:border-brand-black focus:outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </label>
                <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-3 border border-brand-black/10 p-3">
                  <legend className="px-2 text-[10px] font-black uppercase text-brand-dark-gray">Storefront Flags</legend>
                  {([
                    ['isFeatured', 'Featured'],
                    ['isNewArrival', 'New Arrival'],
                    ['isBestSeller', 'Best Seller'],
                  ] as const).map(([flag, label]) => (
                    <label key={flag} className="flex items-center gap-2 text-[10px] font-bold uppercase text-brand-dark-gray">
                      <input type="checkbox" checked={productForm[flag]} onChange={(event) => setProductForm((current) => current && ({ ...current, [flag]: event.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-brand-black/5 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeProductForm} disabled={isSavingForm} className="border border-brand-black/15 bg-brand-white px-6 py-3 text-xs font-black uppercase text-brand-dark-gray hover:border-brand-black hover:text-brand-black disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingForm} className="clip-angled flex items-center justify-center gap-2 border border-brand-black bg-brand-black px-7 py-3 text-xs font-black uppercase text-brand-white transition-colors hover:bg-brand-accent hover:text-brand-black disabled:opacity-60">
                  {isSavingForm ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProduct ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSavingForm ? 'Saving to Firestore...' : editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark-gray/60">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      <div className="clip-angled-lg overflow-hidden border border-brand-black/5 bg-brand-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="border-b border-brand-black/5 bg-brand-light-gray text-[10px] uppercase text-brand-dark-gray">
                <th className="w-16 p-3 text-center">Image</th>
                <th className="p-3">Product Title</th>
                <th className="p-3">Collection</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Price</th>
                <th className="w-28 p-3">Stock</th>
                <th className="w-24 p-3 text-center">Status</th>
                <th className="w-32 p-3 text-center">Flags</th>
                <th className="w-28 p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-xs font-semibold text-brand-dark-gray/50">No products found.</td>
                </tr>
              ) : filteredProducts.map((product) => {
                const isDeleting = deletingId === product.id;
                return (
                  <tr key={product.id} className={`hover:bg-brand-light-gray/40 ${isDeleting ? 'pointer-events-none opacity-40' : ''}`}>
                    <td className="p-3">
                      <div className="relative mx-auto h-10 w-10 overflow-hidden border border-brand-black/5 bg-brand-light-gray">
                        {product.images[0]?.url && <CatalogImage src={product.images[0].url} alt={product.name} sizes="40px" />}
                      </div>
                    </td>
                    <td className="max-w-[180px] p-3 font-bold text-brand-black"><span className="line-clamp-1">{product.name}</span></td>
                    <td className="whitespace-nowrap p-3 text-brand-dark-gray">{product.categoryName}</td>
                    <td className="p-3 text-brand-dark-gray">{product.vendor || 'TecticalHub'}</td>
                    <td className="p-3 font-extrabold text-brand-black">Rs. {product.price.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Package className="h-3.5 w-3.5 text-brand-dark-gray" />
                        <span className={product.stock < 10 ? 'font-extrabold text-red-500' : 'text-brand-black'}>{product.stock}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button type="button" onClick={() => handleStatusChange(product.id, product.status)} className={`clip-angled-sm border px-2 py-1 text-[9px] font-black uppercase ${product.status === 'PUBLISHED' ? 'border-success/20 bg-success/10 text-success' : 'border-brand-black/10 bg-brand-light-gray text-brand-dark-gray'}`}>
                        {product.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-center gap-1">
                        {(['isFeatured', 'isNewArrival', 'isBestSeller'] as const).map((flag) => {
                          const labels = { isFeatured: 'F', isNewArrival: 'N', isBestSeller: 'B' };
                          const active = product[flag];
                          return (
                            <button key={flag} type="button" title={flag} onClick={() => handleToggleFlag(product.id, flag, active)} className={`clip-angled-sm border px-1.5 py-0.5 text-[9px] font-black uppercase transition-colors ${active ? 'border-brand-black bg-brand-black text-brand-accent' : 'border-brand-black/10 bg-brand-light-gray text-brand-dark-gray hover:border-brand-black'}`}>
                              {labels[flag]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => openEditForm(product)} className="clip-angled-sm flex items-center gap-1 border border-brand-black/5 bg-brand-light-gray p-1.5 text-brand-dark-gray hover:border-brand-black hover:text-brand-black" title={`Edit ${product.name}`} aria-label={`Edit ${product.name}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(product.id, product.name)} disabled={isDeleting} className="clip-angled-sm border border-red-100 bg-red-50 p-1.5 text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-brand-white disabled:opacity-60" title={`Archive ${product.name}`} aria-label={`Archive ${product.name}`}>
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
