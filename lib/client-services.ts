'use client';

import { getIdToken, reload, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
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
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { clientDb } from './firebase-client';
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from './catalog-types';
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
import {
  isOrderStatus,
  isPaymentStatus,
  isPhoneConfirmationStatus,
  normalizePakistaniMobile,
  type OrderStatus,
  type PaymentStatus,
  type PhoneConfirmationStatus,
} from './order-policy';
import {
  saveOrderOperations,
  transitionOrderStatus as transitionOrderStatusTransaction,
  type OrderOperationsUpdate,
} from './order-operations';

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

function nullableDateValue(value: unknown): Date | null {
  if (value == null) return null;
  const parsed = dateValue(value);
  return parsed.getTime() === 0 ? null : parsed;
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

export async function createCustomerProfile(user: User, name: string, phone = ''): Promise<void> {
  await setDoc(doc(clientDb, 'users', user.uid), {
    email: String(user.email || '').trim(),
    name: name.trim(),
    ...(phone.trim() ? { phone: phone.trim() } : {}),
    role: 'CUSTOMER',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Safe profile creation for Google Sign-In users.
 *
 * Rules:
 * - If the users/{uid} document already exists, the function is a no-op.
 * - ADMIN role is never set or overwritten — only 'CUSTOMER' is written for new documents.
 * - Preserves all existing fields (does not merge/overwrite existing profiles).
 * - No read-then-write race: the Firestore rule enforces !exists() atomically on the server.
 *
 * Returns the role that will be active after the call:
 * - 'EXISTING' when the document already existed (no write attempted)
 * - 'CUSTOMER' when a new document was created
 */
export async function createGoogleCustomerProfileIfNew(
  user: User,
  displayName: string,
): Promise<'EXISTING' | 'CUSTOMER'> {
  const ref = doc(clientDb, 'users', user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    // Document already present — preserve it unchanged (including any ADMIN role).
    return 'EXISTING';
  }
  // The Firestore rule enforces !exists() on the server, so even if two concurrent
  // calls reach this point the second write will be rejected by the rules.
  await setDoc(ref, {
    email: String(user.email || '').trim(),
    name: displayName.trim() || String(user.displayName || '').trim() || String(user.email || '').trim(),
    role: 'CUSTOMER',
    provider: 'google',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return 'CUSTOMER';
}

function orderFromDocument(id: string, data: DocumentData): OrderDto {
  const firstName = String(data.firstName || '');
  const lastName = String(data.lastName || '');
  return {
    id,
    orderNumber: String(data.orderNumber || id),
    userId: String(data.userId || ''),
    customerName: String(data.customerName || `${firstName} ${lastName}`.trim()),
    email: String(data.email || ''),
    emailVerified: data.emailVerified === true,
    phone: String(data.phone || ''),
    firstName,
    lastName,
    address: String(data.address || ''),
    city: String(data.city || ''),
    state: String(data.state || ''),
    postalCode: String(data.postalCode || ''),
    paymentMethod: 'COD',
    paymentStatus: isPaymentStatus(data.paymentStatus) ? data.paymentStatus : 'PENDING',
    status: isOrderStatus(data.status) ? data.status : 'PENDING',
    phoneConfirmation: isPhoneConfirmationStatus(data.phoneConfirmation) ? data.phoneConfirmation : 'PENDING',
    notes: String(data.notes || ''),
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: numberValue(data.subtotal),
    discount: numberValue(data.discount),
    shippingCost: numberValue(data.shippingCost),
    total: numberValue(data.total),
    couponCode: data.couponCode ? String(data.couponCode) : null,
    courierName: String(data.courierName || ''),
    trackingNumber: String(data.trackingNumber || ''),
    dispatchDate: nullableDateValue(data.dispatchDate),
    cancellationReason: String(data.cancellationReason || ''),
    deliveryNotes: String(data.deliveryNotes || ''),
    inventoryRestored: data.inventoryRestored === true,
    inventoryRestoredAt: nullableDateValue(data.inventoryRestoredAt),
    cancelledAt: nullableDateValue(data.cancelledAt),
    createdAt: dateValue(data.createdAt),
    updatedAt: dateValue(data.updatedAt || data.createdAt),
  };
}

export async function listUserOrders(userId: string): Promise<OrderDto[]> {
  const snapshot = await getDocs(query(collection(clientDb, 'orders'), where('userId', '==', userId)));
  return snapshot.docs
    .map((entry) => orderFromDocument(entry.id, entry.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAllOrders(): Promise<OrderDto[]> {
  const snapshot = await getDocs(query(collection(clientDb, 'orders'), orderBy('createdAt', 'desc'), limit(100)));
  return snapshot.docs
    .map((entry) => orderFromDocument(entry.id, entry.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function subscribeAllOrders(
  onOrders: (orders: OrderDto[], newOrderIds: string[]) => void,
  onError: (error: Error) => void,
  database: Firestore = clientDb,
): Unsubscribe {
  let receivedInitialSnapshot = false;
  return onSnapshot(
    query(collection(database, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
    (snapshot) => {
      const newOrderIds = receivedInitialSnapshot
        ? snapshot.docChanges().filter((change) => change.type === 'added').map((change) => change.doc.id)
        : [];
      receivedInitialSnapshot = true;
      onOrders(snapshot.docs.map((entry) => orderFromDocument(entry.id, entry.data())), newOrderIds);
    },
    (error) => onError(error),
  );
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
  await reload(user);
  await getIdToken(user, true);
  if (!user.emailVerified || !user.email) {
    throw new Error('Verify your email address before placing an order.');
  }
  const verifiedEmail = user.email.trim();
  const normalizedPhone = normalizePakistaniMobile(details.phone);
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

    const inventoryRecords = inventorySnapshots.map((snapshot) => {
      if (!snapshot.exists()) throw new Error('One cart variant is no longer available.');
      return snapshot.data();
    });
    const productIds = [...new Set(inventoryRecords.map((inventory) => String(inventory.productId || '')))];
    if (productIds.some((productId) => !productId)) throw new Error('A cart item has an invalid product reference.');
    const productSnapshots: DocumentSnapshot<DocumentData>[] = [];
    for (const productId of productIds) {
      productSnapshots.push(await transaction.get(doc(clientDb, 'products', productId)));
    }
    const products = new Map(productSnapshots.map((snapshot) => {
      if (!snapshot.exists()) throw new Error('One cart product is no longer available.');
      return [snapshot.id, snapshot.data()] as const;
    }));

    const cleanCoupon = couponCode?.trim().toUpperCase() || null;
    const couponRef = cleanCoupon ? doc(clientDb, 'coupons', cleanCoupon) : null;
    const couponSnapshot = couponRef ? await transaction.get(couponRef) : null;

    const items: OrderItemDto[] = inventorySnapshots.map((snapshot, index) => {
      const inventory = inventoryRecords[index];
      const requested = cart[index];
      const quantity = Math.trunc(requested.quantity);
      const productId = String(inventory.productId || '');
      const product = products.get(productId);
      const variants = Array.isArray(product?.variants) ? product.variants as DocumentData[] : [];
      const productVariant = variants.find((variant) => String(variant.inventoryId || '') === snapshot.id);
      if (!product || product.status !== 'PUBLISHED' || !productVariant) {
        throw new Error(`${String(inventory.name || requested.name)} is no longer published.`);
      }
      if (String(productVariant.sku || '') !== String(inventory.sku || '')
        || numberValue(productVariant.price) !== numberValue(inventory.price)) {
        throw new Error(`${String(inventory.name || requested.name)} pricing is being updated. Refresh and try again.`);
      }
      if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) throw new Error('A cart quantity is invalid.');
      if (inventory.status !== 'ACTIVE' || numberValue(inventory.stock) < quantity) {
        throw new Error(`${String(inventory.name || requested.name)} does not have enough stock.`);
      }
      return {
        inventoryId: snapshot.id,
        productId,
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
    const firstName = details.firstName.trim();
    const lastName = details.lastName.trim();
    const orderData = {
      orderNumber,
      userId: user.uid,
      customerName: `${firstName} ${lastName}`.trim(),
      email: verifiedEmail,
      emailVerified: true,
      phone: normalizedPhone,
      firstName,
      lastName,
      address: details.address.trim(),
      city: details.city.trim(),
      state: details.state.trim(),
      postalCode: details.postalCode.trim(),
      paymentMethod: 'COD' as const,
      paymentStatus: 'PENDING' as const,
      status: 'PENDING' as const,
      phoneConfirmation: 'PENDING' as const,
      notes: details.notes?.trim() || '',
      items,
      subtotal,
      discount,
      shippingCost,
      total,
      couponCode: cleanCoupon,
      courierName: '',
      trackingNumber: '',
      dispatchDate: null,
      cancellationReason: '',
      deliveryNotes: '',
      inventoryRestored: false,
      inventoryRestoredAt: null,
      cancelledAt: null,
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

    return { ...orderData, id: orderRef.id, createdAt: new Date(), updatedAt: new Date() };
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
  if (product.description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    throw new Error(`Product description cannot exceed ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters.`);
  }
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

export async function saveAdminOrderOperations(id: string, changes: OrderOperationsUpdate): Promise<void> {
  await saveOrderOperations(clientDb, id, changes);
}

export async function transitionAdminOrderStatus(
  id: string,
  status: OrderStatus,
  cancellationReason = '',
): Promise<{ restored: boolean }> {
  return transitionOrderStatusTransaction(clientDb, id, status, cancellationReason);
}

export type { OrderStatus, PaymentStatus, PhoneConfirmationStatus };
