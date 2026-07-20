'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, X, Check, Globe } from 'lucide-react';
import { listContentPages, saveContentPage } from '@/lib/client-services';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}

export default function AdminContentPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '', isPublished: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listContentPages()
      .then((items) => { if (active) setPages(items); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load content pages.');
      });
    return () => { active = false; };
  }, []);

  const handleSaveEdit = async () => {
    if (!editingPage) return;
    setSaving(true);
    setError('');
    try {
      const saved = await saveContentPage(editingPage);
      setPages(prev => prev.map(p => p.id === editingPage.id ? saved : p));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save this page.');
      return;
    } finally {
      setSaving(false);
    }
    setEditingPage(null);
  };

  const handleAddPage = async () => {
    if (!newPage.title.trim() || !newPage.slug.trim() || !newPage.content.trim()) {
      setError('Title, slug, and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveContentPage({ ...newPage, id: newPage.slug });
      setPages(prev => [...prev, saved]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create this page.');
      return;
    } finally {
      setSaving(false);
    }
    setShowAddForm(false);
    setNewPage({ title: '', slug: '', content: '', isPublished: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-brand-black">Content Pages</h1>
          <p className="text-[11px] text-brand-dark-gray font-semibold mt-0.5">
            Edit storefront informational pages (About, FAQ, Policies)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-2.5 px-5 transition-colors clip-angled"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Add Page Form */}
      {showAddForm && (
        <div className="bg-brand-white border border-brand-black/5 p-6 clip-angled space-y-4">
          <div className="flex items-center justify-between border-b border-brand-black/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider">New Content Page</h3>
            <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Page Title</label>
              <input type="text" value={newPage.title} onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">URL Slug</label>
              <input type="text" value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Page Content</label>
            <textarea rows={6} value={newPage.content} onChange={e => setNewPage(p => ({ ...p, content: e.target.value }))} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-brand-dark-gray">
            <input type="checkbox" checked={newPage.isPublished} onChange={e => setNewPage(p => ({ ...p, isPublished: e.target.checked }))} />
            Publish immediately (leave unchecked until content review is complete)
          </label>
          <button onClick={handleAddPage} disabled={saving} className="flex items-center gap-2 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-2.5 px-5 transition-colors clip-angled disabled:opacity-50">
            <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Create Page'}
          </button>
        </div>
      )}

      {/* Edit Page Modal */}
      {editingPage && (
        <div className="bg-brand-white border border-brand-accent/30 p-6 clip-angled space-y-4">
          <div className="flex items-center justify-between border-b border-brand-black/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-black">Editing: {editingPage.title}</h3>
            <button onClick={() => setEditingPage(null)}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Title</label>
              <input type="text" value={editingPage.title} onChange={e => setEditingPage(p => p ? { ...p, title: e.target.value } : p)} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Slug</label>
              <input type="text" value={editingPage.slug} disabled className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold font-mono disabled:opacity-60" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Page Content</label>
            <textarea rows={12} value={editingPage.content} onChange={e => setEditingPage(p => p ? { ...p, content: e.target.value } : p)} className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-black" />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-brand-dark-gray">
            <input type="checkbox" checked={editingPage.isPublished} onChange={e => setEditingPage(p => p ? { ...p, isPublished: e.target.checked } : p)} />
            Published on storefront
          </label>
          <div className="flex gap-3">
            <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-2 bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-bold uppercase py-2.5 px-5 transition-colors clip-angled disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditingPage(null)} className="text-xs font-bold uppercase py-2.5 px-5 border border-brand-black/10 hover:border-brand-black text-brand-dark-gray hover:text-brand-black transition-colors clip-angled">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="bg-brand-white border border-brand-black/5 clip-angled overflow-hidden">
        <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-brand-dark-gray bg-brand-light-gray px-6 py-3 border-b border-brand-black/5">
          <div className="col-span-4">Page Title</div>
          <div className="col-span-4">URL</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-brand-black/5">
          {pages.map(page => (
            <div key={page.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-brand-light-gray/50 transition-colors">
              <div className="col-span-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-dark-gray/40 shrink-0" />
                <span className="text-xs font-bold text-brand-black">{page.title}</span>
              </div>
              <div className="col-span-4">
                <a href={`/pages?slug=${encodeURIComponent(page.slug)}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-brand-dark-gray hover:text-brand-accent transition-colors flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  /pages?slug={page.slug}
                </a>
              </div>
              <div className="col-span-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 ${page.isPublished ? 'bg-brand-accent/20 text-brand-black' : 'bg-red-100 text-red-600'}`}>
                  {page.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => setEditingPage(page)}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-dark-gray hover:text-brand-black transition-colors py-1 px-2 hover:bg-brand-light-gray"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
