'use client';

import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { clientDb } from './firebase-client';
import type {
  CategoryDto,
  ContactMessageDto,
  ContentPageDto,
  NewsletterSubscriberDto,
  OrderDto,
  OrderItemDto,
  ProductDto,
  ProductVariantDto,
  StoreUserDto,
} from './catalog-types';
import type { CartItemState } from './store';
import {
  calculateCouponDiscount,
  calculateShippingCost,
  FREE_SHIPPING_THRESHOLD_PKR,
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  SHIPPING_COST_PKR,
} from './checkout-policy';

export { FREE_SHIPPING_THRESHOLD_PKR, MAX_ITEM_QUANTITY, MAX_ORDER_LINES, SHIPPING_COST_PKR };

let publishedProductsPromise: Promise<ProductDto[]> | null = null;
let categoriesPromise: Promise<CategoryDto[]> | null = null;

function resetCatalogCache(): void {
  publishedProductsPromise = null;
}

function resetCategoryCache(): void {
  categoriesPromise = null;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(String(value || 0));
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function productFromDocument(id: string, data: DocumentData, inventory?: Map<string, DocumentData>): ProductDto {
  const variants = (Array.isArray(data.variants) ? data.variants : []).map((variant: DocumentData) => ({
    inventoryId: String(variant.inventoryId || ''),
    sku: String(variant.sku || ''),
    name: String(variant.name || 'Standard'),
    price: numberValue(variant.price),
    compareAtPrice: variant.compareAtPrice == null ? null : numberValue(variant.compareAtPrice),
    stock: Math.max(0, numberValue(inventory?.get(String(variant.inventoryId || ''))?.stock ?? variant.stock)),
  } satisfies ProductVariantDto));

  return {
    id,
    name: String(data.name || ''),
    slug: String(data.slug || id),
    description: String(data.description || ''),
    shortDescription: String(data.shortDescription || ''),
    price: numberValue(data.price),
    compareAtPrice: data.compareAtPrice == null ? null : numberValue(data.compareAtPrice),
    vendor: String(data.vendor || 'TecticalHub'),
    categoryName: String(data.categoryName || ''),
    images: Array.isArray(data.images) ? data.images : [],
    variants,
    isFeatured: Boolean(data.isFeatured),
    isNewArrival: Boolean(data.isNewArrival),
    isBestSeller: Boolean(data.isBestSeller),
    stock: variants.reduce((total, variant) => total + variant.stock, 0),
    status: data.status === 'PUBLISHED' || data.status === 'ARCHIVED' ? data.status : 'DRAFT',
  };
}

export async function listPublishedProducts(): Promise<ProductDto[]> {
  if (!publishedProductsPromise) {
    publishedProductsPromise = Promise.all([
      getDocs(query(collection(clientDb, 'products'), where('status', '==', 'PUBLISHED'))),
      getDocs(collection(clientDb, 'inventory')),
    ]).then(([snapshot, inventorySnapshot]) => {
      const inventory = new Map(inventorySnapshot.docs.map((entry) => [entry.id, entry.data()]));
      return snapshot.docs.map((entry) => productFromDocument(entry.id, entry.data(), inventory));
    }).catch((error) => {
      resetCatalogCache();
      throw error;
    });
  }
  return publishedProductsPromise;
}

export async function listAllProducts(): Promise<ProductDto[]> {
  const [snapshot, inventorySnapshot] = await Promise.all([
    getDocs(collection(clientDb, 'products')),
    getDocs(collection(clientDb, 'inventory')),
  ]);
  const inventory = new Map(inventorySnapshot.docs.map((entry) => [entry.id, entry.data()]));
  return snapshot.docs
    .map((entry) => productFromDocument(entry.id, entry.data(), inventory))
    .filter((product) => product.status !== 'ARCHIVED');
}

export async function listCategories(): Promise<CategoryDto[]> {
  if (!categoriesPromise) {
    categoriesPromise = getDocs(collection(clientDb, 'categories')).then((snapshot) => snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: String(data.name || ''),
        slug: String(data.slug || entry.id),
        description: data.description == null ? null : String(data.description),
        image: data.image == null ? null : String(data.image),
      };
    }).sort((a, b) => a.name.localeCompare(b.name))).catch((error) => {
      resetCategoryCache();
      throw error;
    });
  }
  return categoriesPromise;
}

export async function getContentPage(slug: string): Promise<ContentPageDto | null> {
  const snapshot = await getDocs(query(
    collection(clientDb, 'contentPages'),
    where('slug', '==', slug),
    where('isPublished', '==', true),
    limit(1),
  ));
  if (snapshot.empty) return null;
  const entry = snapshot.docs[0];
  const data = entry.data();
  return {
    id: entry.id,
    title: String(data.title || ''),
    slug: String(data.slug || entry.id),
    content: String(data.content || ''),
    isPublished: true,
  };
}

export async function getUserProfile(user: User): Promise<StoreUserDto | null> {
  const snapshot = await getDoc(doc(clientDb, 'users', user.uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: user.uid,
    email: String(data.email || user.email || ''),
    name: String(data.name || user.displayName || ''),
    phone: data.phone ? String(data.phone) : undefined,
    role: data.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
  };
}

export async function createCustomerProfile(user: User, name: string, phone: string): Promise<void> {
  await setDoc(doc(clientDb, 'users', user.uid), {
    email: String(user.email || '').toLowerCase(),
    name: name.trim(),
    phone: phone.trim(),
    role: 'CUSTOMER',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function orderFromDocument(id: string, data: DocumentData): OrderDto {
  return {
    id,
    orderNumber: String(data.orderNumber || id),
    userId: String(data.userId || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    firstName: String(data.firstName || ''),
    lastName: String(data.lastName || ''),
    address: String(data.address || ''),
    city: String(data.city || ''),
    state: String(data.state || ''),
    postalCode: String(data.postalCode || ''),
    paymentMethod: 'COD',
    paymentStatus: String(data.paymentStatus || 'PENDING'),
    status: String(data.status || 'PENDING'),
    notes: String(data.notes || ''),
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: numberValue(data.subtotal),
    discount: numberValue(data.discount),
    shippingCost: numberValue(data.shippingCost),
    total: numberValue(data.total),
    couponCode: data.couponCode ? String(data.couponCode) : null,
    createdAt: dateValue(data.createdAt),
  };
}

export async function listUserOrders(userId: string): Promise<OrderDto[]> {
  const snapshot = await getDocs(query(collection(clientDb, 'orders'), where('userId', '==', userId)));
  return snapshot.docs
    .map((entry) => orderFromDocument(entry.id, entry.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAllOrders(): Promise<OrderDto[]> {
  const snapshot = await getDocs(collection(clientDb, 'orders'));
  return snapshot.docs
    .map((entry) => orderFromDocument(entry.id, entry.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export interface CouponQuote {
  code: string;
  discount: number;
}

function assertActiveCoupon(data: DocumentData, subtotal: number): void {
  const now = Date.now();
  if (!data.isActive) throw new Error('This coupon is inactive.');
  if (numberValue(data.minOrderValue) > subtotal) throw new Error('The order does not meet this coupon minimum.');
  if (data.startsAt && dateValue(data.startsAt).getTime() > now) throw new Error('This coupon is not active yet.');
  if (data.expiresAt && dateValue(data.expiresAt).getTime() <= now) throw new Error('This coupon has expired.');
  if (data.maxUsage != null && numberValue(data.usedCount) >= numberValue(data.maxUsage)) {
    throw new Error('This coupon has reached its usage limit.');
  }
}

export async function quoteCoupon(code: string, subtotal: number): Promise<CouponQuote> {
  const cleanCode = code.trim().toUpperCase();
  const snapshot = await getDoc(doc(clientDb, 'coupons', cleanCode));
  if (!snapshot.exists()) throw new Error('Invalid coupon code.');
  assertActiveCoupon(snapshot.data(), subtotal);
  return { code: cleanCode, discount: calculateCouponDiscount(subtotal, snapshot.data().discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE', numberValue(snapshot.data().discountValue)) };
}

export interface CheckoutDetails {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
}

export async function placeCodOrder(
  user: User,
  cart: CartItemState[],
  details: CheckoutDetails,
  couponCode?: string,
): Promise<OrderDto> {
  if (cart.length < 1 || cart.length > MAX_ORDER_LINES) {
    throw new Error(`Checkout supports 1 to ${MAX_ORDER_LINES} different items per order.`);
  }
  if (new Set(cart.map((item) => item.inventoryId)).size !== cart.length) {
    throw new Error('Duplicate cart variants must be combined before checkout.');
  }
  const orderRef = doc(collection(clientDb, 'orders'));
  const orderNumber = `TH-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${orderRef.id.slice(0, 8).toUpperCase()}`;

  const result = await runTransaction(clientDb, async (transaction) => {
    const inventoryRefs = cart.map((item) => doc(clientDb, 'inventory', item.inventoryId));
    const inventorySnapshots: DocumentSnapshot<DocumentData>[] = [];
    for (const inventoryRef of inventoryRefs) inventorySnapshots.push(await transaction.get(inventoryRef));

    const cleanCoupon = couponCode?.trim().toUpperCase() || null;
    const couponRef = cleanCoupon ? doc(clientDb, 'coupons', cleanCoupon) : null;
    const couponSnapshot = couponRef ? await transaction.get(couponRef) : null;

    const items: OrderItemDto[] = inventorySnapshots.map((snapshot, index) => {
      if (!snapshot.exists()) throw new Error('One cart variant is no longer available.');
      const inventory = snapshot.data();
      const requested = cart[index];
      const quantity = Math.trunc(requested.quantity);
      if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) throw new Error('A cart quantity is invalid.');
      if (inventory.status !== 'ACTIVE' || numberValue(inventory.stock) < quantity) {
        throw new Error(`${String(inventory.name || requested.name)} does not have enough stock.`);
      }
      return {
        inventoryId: snapshot.id,
        productId: String(inventory.productId || ''),
        variantSku: String(inventory.sku || ''),
        name: String(inventory.name || ''),
        price: numberValue(inventory.price),
        quantity,
      };
    });

    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    let discount = 0;
    if (cleanCoupon) {
      if (!couponSnapshot?.exists()) throw new Error('Invalid coupon code.');
      const coupon = couponSnapshot.data();
      assertActiveCoupon(coupon, subtotal);
      discount = calculateCouponDiscount(subtotal, coupon.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE', numberValue(coupon.discountValue));
      transaction.update(couponRef!, {
        usedCount: numberValue(coupon.usedCount) + 1,
        lastOrderId: orderRef.id,
        updatedAt: serverTimestamp(),
      });
    }
    const shippingCost = calculateShippingCost(subtotal);
    const total = subtotal - discount + shippingCost;
    const orderData = {
      orderNumber,
      userId: user.uid,
      email: details.email.trim().toLowerCase(),
      phone: details.phone.trim(),
      firstName: details.firstName.trim(),
      lastName: details.lastName.trim(),
      address: details.address.trim(),
      city: details.city.trim(),
      state: details.state.trim(),
      postalCode: details.postalCode.trim(),
      paymentMethod: 'COD' as const,
      paymentStatus: 'PENDING',
      status: 'PENDING',
      notes: details.notes?.trim() || '',
      items,
      inventoryIds: items.map((item) => item.inventoryId),
      subtotal,
      discount,
      shippingCost,
      total,
      couponCode: cleanCoupon,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(orderRef, orderData);
    inventorySnapshots.forEach((snapshot, index) => {
      const inventory = snapshot.data()!;
      transaction.update(snapshot.ref, {
        stock: numberValue(inventory.stock) - items[index].quantity,
        lastOrderId: orderRef.id,
        updatedAt: serverTimestamp(),
      });
    });

    return { ...orderData, id: orderRef.id, createdAt: new Date() };
  });

  return result as OrderDto;
}

export async function submitContactMessage(data: Record<string, string>): Promise<void> {
  const messageRef = doc(collection(clientDb, 'contactMessages'));
  await setDoc(messageRef, { ...data, status: 'NEW', createdAt: serverTimestamp() });
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await setDoc(doc(clientDb, 'newsletterSubscribers', normalized), {
    email: normalized,
    status: 'ACTIVE',
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function listContactMessages(): Promise<ContactMessageDto[]> {
  const snapshot = await getDocs(collection(clientDb, 'contactMessages'));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      name: String(data.name || ''),
      email: String(data.email || ''),
      phone: String(data.phone || ''),
      subject: String(data.subject || ''),
      message: String(data.message || ''),
      status: (data.status === 'RESOLVED' ? 'RESOLVED' : 'NEW') as ContactMessageDto['status'],
      createdAt: dateValue(data.createdAt),
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function resolveContactMessage(id: string): Promise<void> {
  await updateDoc(doc(clientDb, 'contactMessages', id), {
    status: 'RESOLVED',
    updatedAt: serverTimestamp(),
  });
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriberDto[]> {
  const snapshot = await getDocs(collection(clientDb, 'newsletterSubscribers'));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id,
      email: String(data.email || entry.id),
      status: (data.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as NewsletterSubscriberDto['status'],
      createdAt: dateValue(data.createdAt),
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function saveCategory(category: CategoryDto): Promise<void> {
  await setDoc(doc(clientDb, 'categories', category.id || category.slug), {
    name: category.name.trim(),
    slug: category.slug.trim(),
    description: category.description || null,
    image: category.image || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  resetCategoryCache();
}

export async function removeCategory(id: string): Promise<void> {
  await deleteDoc(doc(clientDb, 'categories', id));
  resetCategoryCache();
}

export async function listContentPages(): Promise<ContentPageDto[]> {
  const snapshot = await getDocs(collection(clientDb, 'contentPages'));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as ContentPageDto));
}

export async function saveContentPage(page: ContentPageDto): Promise<ContentPageDto> {
  const id = page.id || page.slug;
  await setDoc(doc(clientDb, 'contentPages', id), {
    title: page.title.trim(), slug: page.slug.trim(), content: page.content.trim(),
    isPublished: page.isPublished, updatedAt: serverTimestamp(),
  }, { merge: true });
  return { ...page, id };
}

export interface CouponDto {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxUsage: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date;
}

export async function listCoupons(): Promise<CouponDto[]> {
  const snapshot = await getDocs(collection(clientDb, 'coupons'));
  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      id: entry.id, code: String(data.code || entry.id),
      discountType: data.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      discountValue: numberValue(data.discountValue), minOrderValue: numberValue(data.minOrderValue),
      maxUsage: data.maxUsage == null ? null : numberValue(data.maxUsage), usedCount: numberValue(data.usedCount),
      isActive: Boolean(data.isActive), startsAt: dateValue(data.startsAt), expiresAt: dateValue(data.expiresAt),
    };
  });
}

export async function saveCoupon(coupon: CouponDto): Promise<void> {
  const code = coupon.code.trim().toUpperCase();
  await setDoc(doc(clientDb, 'coupons', code), {
    code, discountType: coupon.discountType, discountValue: coupon.discountValue,
    minOrderValue: coupon.minOrderValue, maxUsage: coupon.maxUsage, usedCount: coupon.usedCount,
    isActive: coupon.isActive, startsAt: Timestamp.fromDate(coupon.startsAt),
    expiresAt: Timestamp.fromDate(coupon.expiresAt), updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeCoupon(id: string): Promise<void> {
  await deleteDoc(doc(clientDb, 'coupons', id));
}

export function inventoryIdFor(productId: string, sku: string): string {
  return `${productId}--${sku}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 500);
}

export async function saveProduct(product: ProductDto): Promise<ProductDto> {
  const productId = product.id || product.slug;
  const variants = product.variants.map((variant) => ({
    ...variant,
    inventoryId: variant.inventoryId || inventoryIdFor(productId, variant.sku),
    stock: Math.max(0, Math.trunc(variant.stock)),
  }));
  const batch = writeBatch(clientDb);
  const storedProduct: Partial<ProductDto> = { ...product };
  delete storedProduct.id;
  delete storedProduct.stock;
  batch.set(doc(clientDb, 'products', productId), {
    ...storedProduct,
    variants,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  variants.forEach((variant) => {
    batch.set(doc(clientDb, 'inventory', variant.inventoryId), {
      productId,
      sku: variant.sku,
      name: `${product.name}${variant.name === 'Standard' ? '' : ` (${variant.name})`}`,
      price: variant.price,
      stock: variant.stock,
      status: product.status === 'PUBLISHED' ? 'ACTIVE' : 'INACTIVE',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
  resetCatalogCache();
  return { ...product, id: productId, variants, stock: variants.reduce((sum, variant) => sum + variant.stock, 0) };
}

export async function archiveProduct(product: ProductDto): Promise<void> {
  const batch = writeBatch(clientDb);
  batch.update(doc(clientDb, 'products', product.id), { status: 'ARCHIVED', updatedAt: serverTimestamp() });
  product.variants.forEach((variant) => batch.update(doc(clientDb, 'inventory', variant.inventoryId), {
    status: 'INACTIVE', updatedAt: serverTimestamp(),
  }));
  await batch.commit();
  resetCatalogCache();
}

export async function updateOrder(id: string, changes: { status?: string; paymentStatus?: string }): Promise<void> {
  await updateDoc(doc(clientDb, 'orders', id), { ...changes, updatedAt: serverTimestamp() });
}
