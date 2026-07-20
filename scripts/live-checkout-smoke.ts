import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

type FirestoreValue = Record<string, unknown>;

function encode(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  if (typeof value === 'object') return { mapValue: { fields: fields(value as Record<string, unknown>) } };
  throw new Error(`Unsupported test value: ${typeof value}`);
}

function fields(value: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encode(entry)]));
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tecticalhub';
const token = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
if (!token) throw new Error('GOOGLE_OAUTH_ACCESS_TOKEN is required.');
const root = `projects/${projectId}/databases/(default)/documents`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Goog-User-Project': projectId };

async function adminCommit(writes: Array<Record<string, unknown>>) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST', headers, body: JSON.stringify({ writes }),
  });
  if (!response.ok) throw new Error(`Admin smoke-test commit failed (${response.status}): ${await response.text()}`);
}

async function updateAuthUser(localId: string, update: Record<string, unknown>): Promise<void> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ localId, ...update }),
  });
  if (!response.ok) throw new Error(`Admin Auth smoke-test update failed (${response.status}): ${await response.text()}`);
}

async function deleteAuthUser(localId: string): Promise<void> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ localId }),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Admin Auth smoke-test cleanup failed (${response.status}): ${await response.text()}`);
  }
}

const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
const inventoryId = `smoke-inventory-${suffix}`;
const couponCode = `SMOKE${suffix.toUpperCase()}`;
const email = `tecticalhub-smoke-${suffix}@example.com`;
const password = `Smoke-${suffix}-Aa9!`;
let uid = '';
let orderId = '';
let authUserDeleted = false;

async function main() {
 try {
  await adminCommit([
    { update: { name: `${root}/products/smoke-product-${suffix}`, fields: fields({ name: 'Checkout security test item', status: 'PUBLISHED', variants: [{ inventoryId, sku: `SMOKE-${suffix}`, name: 'Standard', price: 1000 }] }) } },
    { update: { name: `${root}/inventory/${inventoryId}`, fields: fields({ productId: `smoke-product-${suffix}`, sku: `SMOKE-${suffix}`, name: 'Checkout security test item', price: 1000, stock: 2, status: 'ACTIVE', updatedAt: new Date() }) } },
    { update: { name: `${root}/coupons/${couponCode}`, fields: fields({ code: couponCode, discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 0, maxUsage: 2, usedCount: 0, isActive: true, startsAt: new Date(Date.now() - 60_000), expiresAt: new Date(Date.now() + 3_600_000), updatedAt: new Date() }) } },
  ]);

  const { createUserWithEmailAndPassword, deleteUser, getIdToken, reload, signInWithEmailAndPassword, signOut } = await import('firebase/auth');
  const { doc, setDoc } = await import('firebase/firestore');
  const { auth, clientDb } = await import('../lib/firebase-client');
  const { createCustomerProfile, listUserOrders, placeCodOrder } = await import('../lib/client-services');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  uid = credential.user.uid;
  await createCustomerProfile(credential.user, 'Checkout Smoke Test', '03001234567');
  await updateAuthUser(uid, { emailVerified: true });
  await reload(credential.user);
  await getIdToken(credential.user, true);
  if (!credential.user.emailVerified) throw new Error('The smoke-test user did not receive a verified Firebase token.');
  const order = await placeCodOrder(credential.user, [{
    productId: `smoke-product-${suffix}`, inventoryId, variantSku: `SMOKE-${suffix}`,
    name: 'Ignored client name', price: 1, image: '', quantity: 1, vendor: 'Test',
  }], {
    email, phone: '03001234567', firstName: 'Checkout', lastName: 'Tester',
    address: '10 Test Street', city: 'Lahore', state: 'Punjab', postalCode: '54000', notes: '',
  }, couponCode);
  orderId = order.id;
  if (order.subtotal !== 1000 || order.discount !== 100 || order.shippingCost !== 250 || order.total !== 1150) {
    throw new Error(`Unexpected authoritative totals: ${JSON.stringify({ subtotal: order.subtotal, discount: order.discount, shipping: order.shippingCost, total: order.total })}`);
  }
  const orders = await listUserOrders(uid);
  if (!orders.some((entry) => entry.id === orderId)) throw new Error('The customer could not read the order created for their account.');

  await signOut(auth);
  let denied = false;
  try {
    await setDoc(doc(clientDb, 'inventory', inventoryId), { stock: 999 }, { merge: true });
  } catch {
    denied = true;
  }
  if (!denied) throw new Error('Unauthenticated inventory tampering was not denied.');
  const cleanupCredential = await signInWithEmailAndPassword(auth, email, password);
  await deleteUser(cleanupCredential.user);
  authUserDeleted = true;
  console.log('Live checkout/rules smoke test passed.');
 } finally {
  const deletes = [
    orderId ? { delete: `${root}/orders/${orderId}` } : null,
    uid ? { delete: `${root}/users/${uid}` } : null,
    { delete: `${root}/products/smoke-product-${suffix}` },
    { delete: `${root}/inventory/${inventoryId}` },
    { delete: `${root}/coupons/${couponCode}` },
  ].filter(Boolean) as Array<Record<string, unknown>>;
  await adminCommit(deletes).catch((error) => console.error('Smoke-test cleanup failed:', error));
  if (uid && !authUserDeleted) await deleteAuthUser(uid).catch((error) => console.error('Smoke-test Auth cleanup failed:', error));
 }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
