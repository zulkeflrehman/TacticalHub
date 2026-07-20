'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2, X, Check, ImageIcon } from 'lucide-react';
import CatalogImage from '@/components/ui/CatalogImage';
import { listCategories, removeCategory, saveCategory } from '@/lib/client-services';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', image: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      setCategories(await listCategories());
    } catch {
      setError('Network error while loading categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchCategories(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      setError('Name and slug are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveCategory({ id: editingId || formData.slug, name: formData.name, slug: formData.slug, description: formData.description || null, image: formData.image || null });
      await fetchCategories();
      resetForm();
    } catch {
      setError('Network error. No changes were saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products using it must be reassigned separately.')) return;
    try {
      await removeCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Network error. The category was not deleted.');
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image || '' });
    setShowAddForm(true);
    setError('');
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', image: '' });
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-brand-black">Categories</h1>
          <p className="text-[11px] text-brand-dark-gray font-semibold mt-0.5">
            Manage product collections and navigation categories
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="flex items-center gap-2 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-2.5 px-5 transition-colors clip-angled"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled space-y-4">
          <div className="flex items-center justify-between border-b border-brand-black/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-black">
              {editingId ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={resetForm} className="text-brand-dark-gray hover:text-brand-black transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold p-2.5 clip-angled-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Camping Tents"
                className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">URL Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                disabled={Boolean(editingId)}
                placeholder="e.g. camping-tents"
                className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this category..."
              className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-dark-gray block">
              Category Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={e => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="https://cdn.example.com/category-banner.jpg"
              className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-2.5 px-5 transition-colors clip-angled disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
            <button
              onClick={resetForm}
              className="text-xs font-bold uppercase py-2.5 px-5 border border-brand-black/10 hover:border-brand-black text-brand-dark-gray hover:text-brand-black transition-colors clip-angled"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-brand-light-gray animate-pulse clip-angled" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-brand-white border border-brand-black/5 py-16 text-center clip-angled">
          <Tag className="w-12 h-12 text-brand-dark-gray/30 mx-auto mb-4 stroke-[1.5]" />
          <p className="text-xs font-bold uppercase tracking-wider">No categories yet</p>
          <p className="text-[10px] text-brand-dark-gray mt-1">Add your first product category above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-brand-white border border-brand-black/5 p-5 clip-angled group relative hover:border-brand-black/20 transition-colors">
              {/* Category Image Preview */}
              <div className="w-full h-16 bg-brand-light-gray mb-4 flex items-center justify-center overflow-hidden">
                {cat.image ? (
                  <CatalogImage src={cat.image} alt={cat.name} sizes="320px" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-brand-dark-gray/20 stroke-[1.5]" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-brand-black uppercase tracking-tight truncate">{cat.name}</h3>
                <p className="text-[10px] font-mono text-brand-dark-gray/60">/{cat.slug}</p>
                {cat.description && (
                  <p className="text-[10px] text-brand-dark-gray font-semibold leading-relaxed line-clamp-2">{cat.description}</p>
                )}
                <div className="pt-1">
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-brand-accent/10 text-brand-black px-2 py-0.5">
                    {cat._count?.products ?? 0} Products
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black transition-colors"
                  title="Edit category"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="text-[10px] font-semibold text-brand-dark-gray/60 text-right">
        {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
      </div>
    </div>
  );
}
