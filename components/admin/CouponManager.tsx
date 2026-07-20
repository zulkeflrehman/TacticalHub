'use client';

import { useState } from 'react';
import { useToastStore } from '@/lib/toast-store';
import { Plus, ToggleLeft, ToggleRight, X, Loader2, Trash2 } from 'lucide-react';
import { removeCoupon, saveCoupon } from '@/lib/client-services';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxUsage: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
}

interface CouponManagerProps {
  initialCoupons: Coupon[];
}

export default function CouponManager({ initialCoupons }: CouponManagerProps) {
  const addToast = useToastStore((state) => state.addToast);

  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // New coupon modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [newValue, setNewValue] = useState<number | ''>('');
  const [newMinOrder, setNewMinOrder] = useState<number | ''>('');

  const handleToggleActive = async (id: string, code: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const coupon = coupons.find((entry) => entry.id === id);
      if (!coupon) throw new Error('Coupon not found.');
      await saveCoupon({ ...coupon, startsAt: new Date(0), expiresAt: new Date(coupon.expiresAt), isActive: !currentStatus });
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c));
      addToast(`Coupon "${code}" ${!currentStatus ? 'activated' : 'deactivated'}.`, 'info');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to update coupon.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Archive coupon "${code}"?`)) return;
    setDeletingId(id);
    try {
      await removeCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      addToast(`Coupon "${code}" deleted.`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to delete coupon.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue) {
      addToast('Please enter coupon code and discount value.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const code = newCode.toUpperCase().trim();
      const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await saveCoupon({ id: code, code, discountType: newType, discountValue: Number(newValue), minOrderValue: Number(newMinOrder) || 0, maxUsage: 100, usedCount: 0, isActive: true, startsAt: new Date(), expiresAt: expires });
      const created: Coupon = { id: code, code, discountType: newType, discountValue: Number(newValue), minOrderValue: Number(newMinOrder) || 0, maxUsage: 100, usedCount: 0, isActive: true, expiresAt: expires.toLocaleDateString() };
      setCoupons(prev => [created, ...prev]);
      addToast(`Coupon "${code}" created and saved!`, 'success');
      setNewCode(''); setNewValue(''); setNewMinOrder(''); setShowAddForm(false);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create coupon.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper controls toolbar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-brand-black text-brand-white hover:bg-brand-accent hover:text-brand-black text-xs font-extrabold uppercase py-2.5 px-6 flex items-center gap-1.5 transition-colors clip-angled border border-brand-black w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Add Coupon Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="bg-brand-white border border-brand-black/10 p-6 md:p-8 max-w-md w-full relative z-10 clip-angled-lg space-y-6">
            <div className="flex justify-between items-center border-b border-brand-black/5 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black">Create Discount Coupon</h3>
              <button onClick={() => setShowAddForm(false)} className="text-brand-dark-gray hover:text-brand-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Discount Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={e => setNewValue(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-dark-gray block">Minimum Order Value (PKR)</label>
                <input
                  type="number"
                  value={newMinOrder}
                  onChange={e => setNewMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-brand-light-gray border border-brand-black/10 p-2.5 text-xs font-semibold focus:outline-none"
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
                  'Create Discount Code'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Datatable */}
      <div className="bg-brand-white border border-brand-black/5 clip-angled-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="bg-brand-light-gray text-brand-dark-gray uppercase text-[10px] border-b border-brand-black/5">
                <th className="p-3">Coupon Code</th>
                <th className="p-3">Discount Details</th>
                <th className="p-3">Min Order Limit</th>
                <th className="p-3">Usage Count</th>
                <th className="p-3 text-center">Active Status</th>
                <th className="p-3">Expiration Date</th>
                <th className="p-3 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-black/5">
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-brand-dark-gray/50 text-xs font-semibold">No coupons found.</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className={`hover:bg-brand-light-gray/40 ${deletingId === c.id ? 'opacity-40 pointer-events-none' : ''}`}>
                  <td className="p-3 font-bold text-brand-black">
                    <span className="bg-brand-black text-brand-accent px-2 py-0.5 font-black uppercase tracking-widest clip-angled-sm">
                      {c.code}
                    </span>
                  </td>
                  <td className="p-3 text-brand-black font-extrabold">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Off` : `Rs. ${c.discountValue.toLocaleString()} Off`}
                  </td>
                  <td className="p-3 text-brand-dark-gray">Rs. {c.minOrderValue.toLocaleString()}</td>
                  <td className="p-3 text-brand-dark-gray">{c.usedCount} checkouts</td>
                  
                  {/* Status Toggle */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleActive(c.id, c.code, c.isActive)}
                      disabled={togglingId === c.id}
                      className={`focus:outline-none disabled:opacity-60 ${c.isActive ? 'text-success' : 'text-brand-dark-gray/40'}`}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {togglingId === c.id ? (
                        <Loader2 className="w-6 h-6 mx-auto animate-spin text-brand-dark-gray" />
                      ) : c.isActive ? (
                        <ToggleRight className="w-8 h-8 stroke-[1.5]" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 stroke-[1.5]" />
                      )}
                    </button>
                  </td>

                  <td className="p-3 text-brand-dark-gray whitespace-nowrap">{c.expiresAt}</td>

                  {/* Delete */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      disabled={deletingId === c.id}
                      className="p-1.5 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-brand-white clip-angled-sm disabled:opacity-60"
                      title="Delete coupon"
                    >
                      {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
