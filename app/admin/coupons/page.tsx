'use client';

import { useEffect, useState } from 'react';
import CouponManager, { type Coupon } from '@/components/admin/CouponManager';
import { listCoupons } from '@/lib/client-services';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  useEffect(() => { listCoupons().then((items) => setCoupons(items.map((coupon) => ({ ...coupon, expiresAt: coupon.expiresAt.toLocaleDateString() })))); }, []);
  return <div className="space-y-8"><div><h1 className="text-2xl sm:text-3xl font-black uppercase">Discount Coupons</h1><p className="text-xs text-brand-dark-gray font-semibold uppercase">Store Campaigns & Checkout Deductions</p></div>{coupons ? <CouponManager initialCoupons={coupons}/> : <p className="text-xs font-bold uppercase">Loading coupons...</p>}</div>;
}
