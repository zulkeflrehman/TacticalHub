import { adminDb } from '@/lib/firebase-admin';
import CouponManager from '@/components/admin/CouponManager';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  let coupons: any[] = [];

  try {
    const snapshot = await adminDb.collection('coupons').get();
    const dbCoupons = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
      };
    });

    // Sort by createdAt descending in memory
    dbCoupons.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    coupons = dbCoupons.map((c: any) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue || 0,
      maxUsage: c.maxUsage || null,
      usedCount: c.usedCount || 0,
      isActive: c.isActive,
      expiresAt: new Date(c.expiresAt).toLocaleDateString()
    }));
  } catch (err) {
    console.warn("Firestore connection failed in AdminCouponsPage. Serving mock coupons list.", err);

    // Serve mock coupons
    coupons = [
      {
        id: '1',
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 0,
        maxUsage: null,
        usedCount: 42,
        isActive: true,
        expiresAt: '2026-12-31'
      },
      {
        id: '2',
        code: 'FREE250',
        discountType: 'FIXED',
        discountValue: 250,
        minOrderValue: 2500,
        maxUsage: 200,
        usedCount: 88,
        isActive: true,
        expiresAt: '2026-10-31'
      }
    ];
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-black">
          Discount Coupons
        </h1>
        <p className="text-xs text-brand-dark-gray font-semibold uppercase tracking-wider mt-1">
          Store Campaigns, Voucher Rules & Checkouts Deductions
        </p>
      </div>

      <CouponManager initialCoupons={coupons} />
    </div>
  );
}
