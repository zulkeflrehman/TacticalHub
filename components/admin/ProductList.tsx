'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';
import { archiveProduct, inventoryIdFor, saveProduct } from '@/lib/client-services';
import type { ProductDto, ProductVariantDto } from '@/lib/catalog-types';
import CatalogImage from '@/components/ui/CatalogImage';
import { 
  Plus, Search, Edit, Trash2, Check, X, 
  Package, Loader2
} from 'lucide-react';

export type AdminProductVariant = ProductVariantDto;
export type AdminProduct = ProductDto;

interface ProductListProps {
  initialProducts: AdminProduct[];
  categories: string[];
}

export default function ProductList({ initialProducts, categories }: ProductListProps) {
  const addToast = useToastStore((state) => state.addToast);

  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New product form modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0] || '');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newComparePrice, setNewComparePrice] = useState<number | ''>('');
  const [newStock, setNewStock] = useState<number | ''>('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newPublishNow, setNewPublishNow] = useState(false);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.vendor && p.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStart = (p: AdminProduct) => {
    setEditingId(p.id);
    setEditPrice(p.price);
    setEditStock(p.stock);
  };

  const handleEditSave = async (id: string) => {
    setSavingId(id);
    try {
      const current = products.find((product) => product.id === id);
      if (!current) throw new Error('Product not found.');
      const updatedVariants = current.variants.map((variant, index) => ({ ...variant, price: editPrice, stock: index === 0 ? editStock : 0 }));
      const updated = await saveProduct({ ...current, price: editPrice, stock: editStock, variants: updatedVariants });
      setProducts(prev => prev.map(p => p.id === id ? updated : p));
      addToast('Product updated successfully.', 'success');
      setEditingId(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to save product.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}" and remove it from the storefront?`)) return;

    setDeletingId(id);
    try {
      const current = products.find((product) => product.id === id);
      if (!current) throw new Error('Product not found.');
      await archiveProduct(current);
      setProducts(prev => prev.filter(p => p.id !== id));
      addToast(`"${name}" archived successfully.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to archive product.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCategory || !newPrice || newStock === '' || !newImageUrl) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const sku = `TH-${slug.slice(0, 20).toUpperCase()}-STD`;
      const product = await saveProduct({
        id: slug, slug, name: newName.trim(), vendor: newVendor.trim() || 'TecticalHub', categoryName: newCategory,
        description: `${newName.trim()} from TecticalHub.`, shortDescription: newName.trim(), price: Number(newPrice),
        compareAtPrice: newComparePrice ? Number(newComparePrice) : null,
        images: [{ url: newImageUrl.trim(), isPrimary: true }],
        variants: [{ inventoryId: inventoryIdFor(slug, sku), sku, name: 'Standard', price: Number(newPrice), compareAtPrice: newComparePrice ? Number(newComparePrice) : null, stock: Number(newStock) }],
        stock: Number(newStock), isFeatured: false, isNewArrival: false, isBestSeller: false,
        status: newPublishNow ? 'PUBLISHED' : 'DRAFT',
      });
      setProducts(prev => [product, ...prev]);
      addToast(`"${newName}" created and saved to Firestore!`, 'success');
      setNewName(''); setNewVendor(''); setNewPrice(''); setNewComparePrice(''); setNewStock(''); setNewImageUrl(''); setNewPublishNow(false); setShowAddForm(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create product.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFlag = async (id: string, flag: 'isFeatured' | 'isNewArrival' | 'isBestSeller', current: boolean) => {
    try {
      const product = products.find((entry) => entry.id === id);
      if (!product) throw new Error('Product not found.');
      await saveProduct({ ...product, [flag]: !current });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [flag]: !current } : p));
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
      await saveProduct({ ...product, status });
      setProducts((currentProducts) => currentProducts.map((product) =>
        product.id === id ? { ...product, status } : product,
      ));
      addToast(status === 'PUBLISHED' ? 'Product published.' : 'Product moved to draft.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to change product status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-white border border-brand-black/10 py-2 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-black clip-angled-sm"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-dark-gray/50" />
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          disabled={categories.length === 0}
          title={categories.length === 0 ? 'Create a category before adding products.' : 'Add a product'}
          className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-2.5 px-6 flex items-center gap-1.5 transition-colors clip-angled border border-brand-black w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={() => !isCreating && setShowAddForm(false)} />
          <div className="bg-brand-white border border-brand-black/10 p-6 md:p-8 max-w-md w-full relative z-10 clip-angled-lg space-y-6">
            <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">Create New Product</h3>
              <button onClick={() => setShowAddForm(false)} disabled={isCreating} className="text-brand-dark-gray hover:text-brand-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-brand-dark-gray">
                <input
                  type="checkbox"
                  checked={newPublishNow}
                  onChange={(event) => setNewPublishNow(event.target.checked)}
                />
                Publish immediately (leave unchecked until catalog review is complete)
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Vendor / Brand</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={e => setNewVendor(e.target.value)}
                    placeholder="TecticalHub"
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Compare Price</label>
                  <input
                    type="number"
                    min="0"
                    value={newComparePrice}
                    onChange={e => setNewComparePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Optional"
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Initial Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStock}
                  onChange={e => setNewStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Primary Image URL *</label>
                <input
                  type="url"
                  required
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  placeholder="https://cdn.example.com/product.jpg"
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2 text-xs font-semibold focus:outline-none focus:border-brand-black"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-3.5 transition-colors clip-angled border border-brand-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving to Firestore...</>
                ) : (
                  <><Plus className="w-4 h-4" /> {newPublishNow ? 'Publish Product' : 'Create Draft'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Count */}
      <p className="text-[10px] font-bold uppercase text-brand-dark-gray/60 tracking-widest">
        Showing {filteredProducts.length} of {products.length} products
      </p>

      {/* Main Table */}
      <div className="bg-brand-white border border-brand-black/5 clip-angled-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="bg-brand-light-gray text-brand-dark-gray uppercase text-[10px] border-b border-brand-black/5">
                <th className="p-3 w-16 text-center">Image</th>
                <th className="p-3">Product Title</th>
                <th className="p-3">Collection</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Price</th>
                <th className="p-3 w-28">Stock</th>
                <th className="p-3 w-24 text-center">Status</th>
                <th className="p-3 w-32 text-center">Flags</th>
                <th className="p-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-brand-dark-gray/50 text-xs font-semibold">
                    No products found.
                  </td>
                </tr>
              ) : filteredProducts.map(p => {
                const isEditing = editingId === p.id;
                const isSaving = savingId === p.id;
                const isDeleting = deletingId === p.id;

                return (
                  <tr key={p.id} className={`hover:bg-brand-light-gray/40 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
                    {/* Thumbnail */}
                    <td className="p-3">
                      <div className="w-10 h-10 bg-brand-light-gray border border-brand-black/5 mx-auto relative overflow-hidden">
                        {p.images[0]?.url && (
                          <CatalogImage src={p.images[0].url} alt={p.name} sizes="40px" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="p-3 font-bold text-brand-black max-w-[180px]">
                      <span className="line-clamp-1">{p.name}</span>
                    </td>

                    {/* Collection */}
                    <td className="p-3 text-brand-dark-gray whitespace-nowrap">{p.categoryName}</td>

                    {/* Vendor */}
                    <td className="p-3 text-brand-dark-gray">{p.vendor || 'TecticalHub'}</td>

                    {/* Price */}
                    <td className="p-3 font-extrabold text-brand-black">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(Number(e.target.value))}
                          className="w-24 bg-brand-light-gray border border-brand-black/10 px-1.5 py-1 focus:outline-none"
                        />
                      ) : (
                        `Rs. ${p.price.toLocaleString()}`
                      )}
                    </td>

                    {/* Stock */}
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={e => setEditStock(Number(e.target.value))}
                          className="w-16 bg-brand-light-gray border border-brand-black/10 px-1.5 py-1 focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 font-bold">
                          <Package className="w-3.5 h-3.5 text-brand-dark-gray" />
                          <span className={p.stock < 10 ? 'text-red-500 font-extrabold' : 'text-brand-black'}>
                            {p.stock}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleStatusChange(p.id, p.status)}
                        className={`px-2 py-1 text-[9px] font-black uppercase border clip-angled-sm ${
                          p.status === 'PUBLISHED'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-brand-light-gray text-brand-dark-gray border-brand-black/10'
                        }`}
                      >
                        {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    {/* Flags */}
                    <td className="p-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {(['isFeatured', 'isNewArrival', 'isBestSeller'] as const).map(flag => {
                          const labels: Record<string, string> = { isFeatured: 'F', isNewArrival: 'N', isBestSeller: 'B' };
                          const active = p[flag] ?? false;
                          return (
                            <button
                              key={flag}
                              title={flag}
                              onClick={() => handleToggleFlag(p.id, flag, active)}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase clip-angled-sm transition-colors ${
                                active
                                  ? 'bg-brand-black text-brand-accent border border-brand-black'
                                  : 'bg-brand-light-gray text-brand-dark-gray border border-brand-black/10 hover:border-brand-black'
                              }`}
                            >
                              {labels[flag]}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditSave(p.id)}
                              disabled={isSaving}
                              className="p-1.5 bg-brand-black text-brand-accent hover:bg-brand-accent hover:text-brand-black border border-brand-black clip-angled-sm disabled:opacity-60"
                              title="Save"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={isSaving}
                              className="p-1.5 bg-brand-white border border-brand-black/15 text-brand-dark-gray hover:border-brand-black hover:text-brand-black clip-angled-sm"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditStart(p)}
                              className="p-1.5 bg-brand-light-gray text-brand-dark-gray border border-brand-black/5 hover:border-brand-black hover:text-brand-black clip-angled-sm"
                              title="Edit price/stock"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              disabled={isDeleting}
                              className="p-1.5 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-brand-white hover:border-red-500 clip-angled-sm disabled:opacity-60"
                              title="Delete"
                            >
                              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
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
