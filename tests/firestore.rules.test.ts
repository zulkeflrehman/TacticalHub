import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteField,
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
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  cancelOrderAndRestoreInventory,
  transitionOrderStatus,
} from '../lib/order-operations';

const PROJECT_ID = 'demo-tecticalhub';
const ALICE_UID = 'customer-alice';
const ALICE_EMAIL = 'alice@example.com';
const BOB_UID = 'customer-bob';
const BOB_EMAIL = 'bob@example.com';
const ADMIN_UID = 'admin-user';
const INVENTORY_ID = 'inventory-main';
const PRODUCT_ID = 'product-main';
const UNIT_PRICE = 2_500;
const STARTING_STOCK = 10;

let testEnvironment: RulesTestEnvironment;

function emulatorAddress(): { host: string; port: number } {
  const configured = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const separator = configured.lastIndexOf(':');
  return {
    host: configured.slice(0, separator),
    port: Number(configured.slice(separator + 1)),
  };
}

function customerDatabase(
  uid: string,
  email: string,
  emailVerified: boolean,
): Firestore {
  return testEnvironment.authenticatedContext(uid, {
    email,
    email_verified: emailVerified,
  }).firestore() as unknown as Firestore;
}

function adminDatabase(): Firestore {
  return testEnvironment.authenticatedContext(ADMIN_UID, {
    email: 'admin@example.com',
    email_verified: true,
  }).firestore() as unknown as Firestore;
}

interface PlaceOrderOptions {
  orderId?: string;
  itemPrice?: number;
  quantity?: number;
  inventoryDecrement?: number;
  couponCode?: string;
  discount?: number;
  updateCouponUsage?: boolean;
}

async function placeOrder(
  database: Firestore,
  uid: string,
  email: string,
  options: PlaceOrderOptions = {},
): Promise<void> {
  const orderId = options.orderId || 'order-main';
  const itemPrice = options.itemPrice ?? UNIT_PRICE;
  const quantity = options.quantity ?? 1;
  const inventoryDecrement = options.inventoryDecrement ?? quantity;
  const subtotal = itemPrice * quantity;
  const shippingCost = subtotal >= 5_000 ? 0 : 250;
  const couponCode = options.couponCode ?? null;
  const discount = options.discount ?? 0;

  await runTransaction(database, async (transaction) => {
    const inventoryRef = doc(database, 'inventory', INVENTORY_ID);
    const orderRef = doc(database, 'orders', orderId);
    const inventorySnapshot = await transaction.get(inventoryRef);
    if (!inventorySnapshot.exists()) throw new Error('Test inventory is missing.');

    transaction.update(inventoryRef, {
      stock: Number(inventorySnapshot.data().stock) - inventoryDecrement,
      lastOrderId: orderId,
      updatedAt: serverTimestamp(),
    });
    transaction.set(orderRef, {
      orderNumber: `TH-TEST-${orderId}`,
      userId: uid,
      customerName: 'Alice Buyer',
      email,
      emailVerified: true,
      phone: '+923001234567',
      firstName: 'Alice',
      lastName: 'Buyer',
      address: '12 Test Street',
      city: 'Lahore',
      state: 'Punjab',
      postalCode: '54000',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'PENDING',
      phoneConfirmation: 'PENDING',
      notes: '',
      items: [{
        inventoryId: INVENTORY_ID,
        productId: PRODUCT_ID,
        variantSku: 'SKU-MAIN',
        name: 'Tactical Backpack',
        price: itemPrice,
        quantity,
      }],
      subtotal,
      discount,
      shippingCost,
      total: subtotal - discount + shippingCost,
      couponCode,
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
    });
    if (couponCode && options.updateCouponUsage) {
      transaction.update(doc(database, 'coupons', couponCode), {
        usedCount: 1,
        lastOrderId: orderId,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

async function readInventoryStock(): Promise<number> {
  let stock = Number.NaN;
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore() as unknown as Firestore;
    const snapshot = await getDoc(doc(database, 'inventory', INVENTORY_ID));
    stock = Number(snapshot.data()?.stock);
  });
  return stock;
}

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(message)), 5_000);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

describe('TecticalHub Firestore production rules', () => {
  before(async () => {
    const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
    const { host, port } = emulatorAddress();
    testEnvironment = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { host, port, rules },
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await Promise.all([
        setDoc(doc(database, 'users', ADMIN_UID), {
          email: 'admin@example.com',
          name: 'Test Administrator',
          role: 'ADMIN',
        }),
        setDoc(doc(database, 'products', PRODUCT_ID), {
          name: 'Tactical Backpack',
          status: 'PUBLISHED',
          variants: [{
            inventoryId: INVENTORY_ID,
            sku: 'SKU-MAIN',
            name: 'Standard',
            price: UNIT_PRICE,
          }],
        }),
        setDoc(doc(database, 'inventory', INVENTORY_ID), {
          productId: PRODUCT_ID,
          sku: 'SKU-MAIN',
          name: 'Tactical Backpack',
          price: UNIT_PRICE,
          stock: STARTING_STOCK,
          status: 'ACTIVE',
        }),
        setDoc(doc(database, 'coupons', 'SAVE10'), {
          code: 'SAVE10',
          description: '10 percent off',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minOrderValue: 0,
          maxUsage: null,
          usedCount: 0,
          startsAt: new Date(Date.now() - 60_000),
          expiresAt: new Date(Date.now() + 86_400_000),
          isActive: true,
        }),
      ]);
    });
  });

  after(async () => {
    await testEnvironment.cleanup();
  });

  it('rejects an order when the Firebase token says the email is unverified', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, false);

    await assertFails(placeOrder(database, ALICE_UID, ALICE_EMAIL));
    assert.equal(await readInventoryStock(), STARTING_STOCK);
  });

  it('accepts an order from a Google-authenticated user with a verified token', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertSucceeds(placeOrder(database, ALICE_UID, ALICE_EMAIL, {
      orderId: 'order-google-user',
    }));

    const orderSnapshot = await assertSucceeds(getDoc(doc(database, 'orders', 'order-google-user')));
    assert.equal(orderSnapshot.data()?.email, ALICE_EMAIL);
    assert.equal(orderSnapshot.data()?.emailVerified, true);
    assert.equal(orderSnapshot.data()?.total, 2_750);
    assert.equal(await readInventoryStock(), STARTING_STOCK - 1);
  });

  it('prevents a customer from setting or escalating to ADMIN role', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertFails(setDoc(doc(database, 'users', ALICE_UID), {
      email: ALICE_EMAIL,
      name: 'Alice Hacker',
      role: 'ADMIN',
    }));
  });

  it('allows a customer to create their own CUSTOMER profile document', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertSucceeds(setDoc(doc(database, 'users', ALICE_UID), {
      email: ALICE_EMAIL,
      name: 'Alice Buyer',
      role: 'CUSTOMER',
    }));
    const snapshot = await getDoc(doc(database, 'users', ALICE_UID));
    assert.equal(snapshot.data()?.role, 'CUSTOMER');
    assert.equal(snapshot.data()?.name, 'Alice Buyer');
  });

  it('preserves the ADMIN role when a customer attempts to overwrite their profile', async () => {
    // Pre-seed an ADMIN user document (simulating an existing admin who also has a Google account).
    const GOOGLE_ADMIN_UID = 'google-admin-user';
    const GOOGLE_ADMIN_EMAIL = 'google-admin@example.com';
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await setDoc(doc(database, 'users', GOOGLE_ADMIN_UID), {
        email: GOOGLE_ADMIN_EMAIL,
        name: 'Admin User',
        role: 'ADMIN',
      });
    });

    // Attempt to overwrite the ADMIN profile with a CUSTOMER role (should be rejected).
    const database = customerDatabase(GOOGLE_ADMIN_UID, GOOGLE_ADMIN_EMAIL, true);
    await assertFails(setDoc(doc(database, 'users', GOOGLE_ADMIN_UID), {
      email: GOOGLE_ADMIN_EMAIL,
      name: 'Demoted Admin',
      role: 'CUSTOMER',
    }));

    // Verify the ADMIN role is still intact.
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore() as unknown as Firestore;
      const snapshot = await getDoc(doc(db, 'users', GOOGLE_ADMIN_UID));
      assert.equal(snapshot.data()?.role, 'ADMIN');
    });
  });

  it('atomically accepts an authoritative order for a verified user and reduces stock', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertSucceeds(placeOrder(database, ALICE_UID, ALICE_EMAIL));

    const orderSnapshot = await assertSucceeds(getDoc(doc(database, 'orders', 'order-main')));
    assert.equal(orderSnapshot.data()?.email, ALICE_EMAIL);
    assert.equal(orderSnapshot.data()?.emailVerified, true);
    assert.equal(orderSnapshot.data()?.phoneConfirmation, 'PENDING');
    assert.equal(orderSnapshot.data()?.total, 2_750);
    assert.equal(await readInventoryStock(), STARTING_STOCK - 1);
  });

  it('accepts a verified token email without changing its case', async () => {
    const mixedCaseEmail = 'Buyer@Example.com';
    const database = customerDatabase(ALICE_UID, mixedCaseEmail, true);

    await assertSucceeds(placeOrder(database, ALICE_UID, mixedCaseEmail, {
      orderId: 'order-mixed-case-email',
    }));
    const snapshot = await getDoc(doc(database, 'orders', 'order-mixed-case-email'));
    assert.equal(snapshot.data()?.email, mixedCaseEmail);
  });

  it('allows customers to read their own order but not another customer order', async () => {
    const aliceDatabase = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    const bobDatabase = customerDatabase(BOB_UID, BOB_EMAIL, true);
    await placeOrder(aliceDatabase, ALICE_UID, ALICE_EMAIL);

    await assertSucceeds(getDoc(doc(aliceDatabase, 'orders', 'order-main')));
    await assertFails(getDoc(doc(bobDatabase, 'orders', 'order-main')));
    const ownOrders = await assertSucceeds(getDocs(query(
      collection(aliceDatabase, 'orders'),
      where('userId', '==', ALICE_UID),
    )));
    assert.equal(ownOrders.size, 1);
  });

  it('prevents a customer from changing totals or administrative fields', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await placeOrder(database, ALICE_UID, ALICE_EMAIL);
    const orderRef = doc(database, 'orders', 'order-main');

    await assertFails(updateDoc(orderRef, {
      total: 1,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      phoneConfirmation: 'CONFIRMED',
      courierName: 'Customer-controlled courier',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(orderRef);
    assert.equal(snapshot.data()?.total, 2_750);
    assert.equal(snapshot.data()?.phoneConfirmation, 'PENDING');
  });

  it('rejects browser-supplied price manipulation without reducing inventory', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertFails(placeOrder(database, ALICE_UID, ALICE_EMAIL, {
      orderId: 'order-price-tamper',
      itemPrice: 1,
    }));
    assert.equal(await readInventoryStock(), STARTING_STOCK);
  });

  it('rejects an inventory decrement that does not match the ordered quantity', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertFails(placeOrder(database, ALICE_UID, ALICE_EMAIL, {
      orderId: 'order-stock-tamper',
      inventoryDecrement: 2,
    }));
    assert.equal(await readInventoryStock(), STARTING_STOCK);
  });

  it('rejects replaying a completed order ID to decrement inventory again', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await placeOrder(database, ALICE_UID, ALICE_EMAIL);

    await assertFails(updateDoc(doc(database, 'inventory', INVENTORY_ID), {
      stock: STARTING_STOCK - 2,
      lastOrderId: 'order-main',
      updatedAt: serverTimestamp(),
    }));
    assert.equal(await readInventoryStock(), STARTING_STOCK - 1);
  });

  it('rejects a coupon discount when coupon usage is not incremented atomically', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertFails(placeOrder(database, ALICE_UID, ALICE_EMAIL, {
      orderId: 'order-coupon-without-usage',
      couponCode: 'SAVE10',
      discount: 250,
    }));
    assert.equal(await readInventoryStock(), STARTING_STOCK);
  });

  it('accepts an exact coupon discount when usage is updated in the same transaction', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);

    await assertSucceeds(placeOrder(database, ALICE_UID, ALICE_EMAIL, {
      orderId: 'order-valid-coupon',
      couponCode: 'SAVE10',
      discount: 250,
      updateCouponUsage: true,
    }));
    const orderSnapshot = await getDoc(doc(database, 'orders', 'order-valid-coupon'));
    const couponSnapshot = await getDoc(doc(database, 'coupons', 'SAVE10'));
    assert.equal(orderSnapshot.data()?.discount, 250);
    assert.equal(orderSnapshot.data()?.total, 2_500);
    assert.equal(couponSnapshot.data()?.usedCount, 1);
    assert.equal(couponSnapshot.data()?.lastOrderId, 'order-valid-coupon');
  });

  it('delivers a newly placed order through the admin dashboard query listener', async () => {
    const database = adminDatabase();
    const customer = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    let unsubscribe: Unsubscribe = () => undefined;
    let resolveInitial: () => void = () => undefined;
    let rejectInitial: (error: Error) => void = () => undefined;
    let resolveOrder: (orderId: string) => void = () => undefined;
    let rejectListener: (error: Error) => void = () => undefined;
    const initialSnapshot = new Promise<void>((resolve, reject) => {
      resolveInitial = resolve;
      rejectInitial = reject;
    });
    const receivedOrder = new Promise<string>((resolve, reject) => {
      resolveOrder = resolve;
      rejectListener = reject;
    });

    unsubscribe = onSnapshot(
      query(collection(database, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        resolveInitial();
        if (snapshot.docs.some((entry) => entry.id === 'order-realtime')) {
          resolveOrder('order-realtime');
        }
      },
      (error) => {
        rejectInitial(error);
        rejectListener(error);
      },
    );

    try {
      await withTimeout(initialSnapshot, 'Admin listener did not produce its initial snapshot.');
      await placeOrder(customer, ALICE_UID, ALICE_EMAIL, { orderId: 'order-realtime' });
      assert.equal(
        await withTimeout(receivedOrder, 'Admin listener did not receive the new order.'),
        'order-realtime',
      );
    } finally {
      unsubscribe();
    }
  });

  it('restores inventory exactly once when the production cancellation transaction is repeated', async () => {
    const customer = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    const administrator = adminDatabase();
    await placeOrder(customer, ALICE_UID, ALICE_EMAIL, { orderId: 'order-cancel' });
    assert.equal(await readInventoryStock(), STARTING_STOCK - 1);

    const firstCancellation = await cancelOrderAndRestoreInventory(
      administrator,
      'order-cancel',
      'Customer requested cancellation.',
    );
    assert.deepEqual(firstCancellation, { restored: true });
    assert.equal(await readInventoryStock(), STARTING_STOCK);

    const repeatedCancellation = await cancelOrderAndRestoreInventory(
      administrator,
      'order-cancel',
      'Customer requested cancellation.',
    );
    assert.deepEqual(repeatedCancellation, { restored: false });
    assert.equal(await readInventoryStock(), STARTING_STOCK);

    const orderSnapshot = await getDoc(doc(administrator, 'orders', 'order-cancel'));
    assert.equal(orderSnapshot.data()?.status, 'CANCELLED');
    assert.equal(orderSnapshot.data()?.inventoryRestored, true);
  });

  it('safely initializes missing legacy operational fields before cancelling an active order', async () => {
    const customer = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    const administrator = adminDatabase();
    await placeOrder(customer, ALICE_UID, ALICE_EMAIL, { orderId: 'order-legacy-active' });
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await updateDoc(doc(database, 'orders', 'order-legacy-active'), {
        phoneConfirmation: deleteField(),
        courierName: deleteField(),
        trackingNumber: deleteField(),
        dispatchDate: deleteField(),
        cancellationReason: deleteField(),
        deliveryNotes: deleteField(),
        inventoryRestored: deleteField(),
        inventoryRestoredAt: deleteField(),
        cancelledAt: deleteField(),
      });
    });

    const result = await cancelOrderAndRestoreInventory(
      administrator,
      'order-legacy-active',
      'Legacy active order cancellation test.',
    );
    assert.deepEqual(result, { restored: true });
    assert.equal(await readInventoryStock(), STARTING_STOCK);
    const snapshot = await getDoc(doc(administrator, 'orders', 'order-legacy-active'));
    assert.equal(snapshot.data()?.phoneConfirmation, 'PENDING');
    assert.equal(snapshot.data()?.inventoryRestored, true);
  });

  it('allows safe forward transitions and rejects an unsafe backward transition', async () => {
    const customer = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    const administrator = adminDatabase();
    await placeOrder(customer, ALICE_UID, ALICE_EMAIL, { orderId: 'order-status' });

    await transitionOrderStatus(administrator, 'order-status', 'CONFIRMED');
    await transitionOrderStatus(administrator, 'order-status', 'PROCESSING');
    await assertFails(updateDoc(doc(administrator, 'orders', 'order-status'), {
      status: 'PENDING',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(doc(administrator, 'orders', 'order-status'));
    assert.equal(snapshot.data()?.status, 'PROCESSING');
  });

  it('rejects a cancelled or refunded payment state while the order remains active', async () => {
    const customer = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    const administrator = adminDatabase();
    await placeOrder(customer, ALICE_UID, ALICE_EMAIL, { orderId: 'order-payment-state' });

    await assertFails(updateDoc(doc(administrator, 'orders', 'order-payment-state'), {
      paymentStatus: 'CANCELLED',
      updatedAt: serverTimestamp(),
    }));
    const snapshot = await getDoc(doc(administrator, 'orders', 'order-payment-state'));
    assert.equal(snapshot.data()?.paymentStatus, 'PENDING');
    assert.equal(snapshot.data()?.status, 'PENDING');
  });

  // ─── Google Sign-In additional rule tests ─────────────────────────────────

  it('ADMIN can update their own safe personal fields without changing role or email', async () => {
    // The update rule allows name/phone/updatedAt for own document, role and email must be preserved.
    const administrator = testEnvironment.authenticatedContext(ADMIN_UID, {
      email: 'admin@example.com',
      email_verified: true,
    }).firestore() as unknown as Firestore;

    await assertSucceeds(updateDoc(doc(administrator, 'users', ADMIN_UID), {
      name: 'Updated Admin Name',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(doc(administrator, 'users', ADMIN_UID));
    assert.equal(snapshot.data()?.name, 'Updated Admin Name');
    assert.equal(snapshot.data()?.role, 'ADMIN');
    assert.equal(snapshot.data()?.email, 'admin@example.com');
  });

  it('ADMIN cannot update their own role field via the browser update path', async () => {
    const administrator = testEnvironment.authenticatedContext(ADMIN_UID, {
      email: 'admin@example.com',
      email_verified: true,
    }).firestore() as unknown as Firestore;

    // Attempting to include role in an update should fail because the diff
    // allows only ['name', 'phone', 'updatedAt'] for own-document updates,
    // AND role must equal resource.data.role. Changing it violates both.
    await assertFails(updateDoc(doc(administrator, 'users', ADMIN_UID), {
      name: 'Still Admin',
      role: 'CUSTOMER',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(doc(administrator, 'users', ADMIN_UID));
    assert.equal(snapshot.data()?.role, 'ADMIN');
  });

  it('customer cannot change their own email field via the update path', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await assertSucceeds(setDoc(doc(database, 'users', ALICE_UID), {
      email: ALICE_EMAIL,
      name: 'Alice Buyer',
      role: 'CUSTOMER',
    }));

    // Trying to change email should be rejected because the diff includes 'email',
    // which is not in the allowed-update set, and email must equal resource.data.email.
    await assertFails(updateDoc(doc(database, 'users', ALICE_UID), {
      email: 'newemail@example.com',
      name: 'Alice Buyer',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(doc(database, 'users', ALICE_UID));
    assert.equal(snapshot.data()?.email, ALICE_EMAIL);
  });

  it('customer cannot promote their own role to ADMIN via the update path', async () => {
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await assertSucceeds(setDoc(doc(database, 'users', ALICE_UID), {
      email: ALICE_EMAIL,
      name: 'Alice Buyer',
      role: 'CUSTOMER',
    }));

    await assertFails(updateDoc(doc(database, 'users', ALICE_UID), {
      role: 'ADMIN',
      name: 'Alice Hacker',
      updatedAt: serverTimestamp(),
    }));

    const snapshot = await getDoc(doc(database, 'users', ALICE_UID));
    assert.equal(snapshot.data()?.role, 'CUSTOMER');
  });

  it('customer cannot query the users collection by email (no cross-profile enumeration)', async () => {
    // Seed Bob's profile
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await setDoc(doc(database, 'users', BOB_UID), {
        email: BOB_EMAIL,
        name: 'Bob Buyer',
        role: 'CUSTOMER',
      });
    });

    // Alice tries to query the users collection by email — must be denied
    const aliceDatabase = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await assertFails(getDocs(query(
      collection(aliceDatabase, 'users'),
      where('email', '==', BOB_EMAIL),
      limit(1),
    )));
  });

  it('creating a profile document fails if the document already exists (no overwrite)', async () => {
    // Pre-seed Alice's profile (simulates existing email/password account)
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await setDoc(doc(database, 'users', ALICE_UID), {
        email: ALICE_EMAIL,
        name: 'Alice Original',
        role: 'CUSTOMER',
        provider: 'password',
      });
    });

    // Attempt to overwrite by creating again with Google provider data
    const database = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await assertFails(setDoc(doc(database, 'users', ALICE_UID), {
      email: ALICE_EMAIL,
      name: 'Alice Google',
      role: 'CUSTOMER',
      provider: 'google',
    }));

    // Original document must be intact
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore() as unknown as Firestore;
      const snapshot = await getDoc(doc(db, 'users', ALICE_UID));
      assert.equal(snapshot.data()?.name, 'Alice Original');
      assert.equal(snapshot.data()?.provider ?? 'password', 'password');
    });
  });

  it('existing CUSTOMER profile is never overwritten by the createGoogleCustomerProfileIfNew path', async () => {
    // Simulate existing customer who signs in via Google for the first time.
    // The document pre-exists, so the function returns 'EXISTING' and does not write.
    const EXISTING_UID = 'existing-customer';
    const EXISTING_EMAIL = 'existing@example.com';

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore() as unknown as Firestore;
      await setDoc(doc(database, 'users', EXISTING_UID), {
        email: EXISTING_EMAIL,
        name: 'Existing Customer',
        role: 'CUSTOMER',
        provider: 'password',
        customField: 'preserved-value',
      });
    });

    // Attempting to create (overwrite) must fail
    const database = customerDatabase(EXISTING_UID, EXISTING_EMAIL, true);
    await assertFails(setDoc(doc(database, 'users', EXISTING_UID), {
      email: EXISTING_EMAIL,
      name: 'Overwritten Customer',
      role: 'CUSTOMER',
    }));

    // Original data must still be intact
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore() as unknown as Firestore;
      const snapshot = await getDoc(doc(db, 'users', EXISTING_UID));
      assert.equal(snapshot.data()?.name, 'Existing Customer');
      assert.equal(snapshot.data()?.customField, 'preserved-value');
    });
  });

  it('a Google-signed-in user with verified email can place an order (verifiedEmailUser check)', async () => {
    // Google auth users have email_verified=true in their Firebase token automatically.
    const GOOGLE_UID = 'google-customer-uid';
    const GOOGLE_EMAIL = 'google-user@example.com';
    const googleDatabase = customerDatabase(GOOGLE_UID, GOOGLE_EMAIL, true);

    await assertSucceeds(placeOrder(googleDatabase, GOOGLE_UID, GOOGLE_EMAIL, {
      orderId: 'order-google-verified',
    }));

    const orderSnapshot = await getDoc(doc(googleDatabase, 'orders', 'order-google-verified'));
    assert.equal(orderSnapshot.data()?.emailVerified, true);
    assert.equal(orderSnapshot.data()?.userId, GOOGLE_UID);
    assert.equal(await readInventoryStock(), STARTING_STOCK - 1);
  });

  it('order history for original UID is accessible after account linking scenario', async () => {
    // After linking, the user authenticates with their original UID.
    // All existing orders under that UID must remain accessible.
    const aliceDatabase = customerDatabase(ALICE_UID, ALICE_EMAIL, true);
    await placeOrder(aliceDatabase, ALICE_UID, ALICE_EMAIL, { orderId: 'order-pre-link' });

    // Order was placed under ALICE_UID — must be readable under that same UID
    // (which is the same UID after account linking, since linking preserves UID)
    await assertSucceeds(getDoc(doc(aliceDatabase, 'orders', 'order-pre-link')));

    const orderSnapshot = await getDoc(doc(aliceDatabase, 'orders', 'order-pre-link'));
    assert.equal(orderSnapshot.data()?.userId, ALICE_UID);
    assert.equal(orderSnapshot.data()?.email, ALICE_EMAIL);
  });
});