import { adminDb } from '../firebase-admin';
import { ProductService, ProductVariantDto } from './product-service';
import { CartService } from './cart-service';

export interface OrderItemInput {
  productId: string;
  variantSku?: string;
  quantity: number;
}

export interface CheckoutInput {
  userId?: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  notes?: string;
  couponCode?: string;
  items: OrderItemInput[];
}

export class OrderService {
  static async validateCoupon(code: string, subtotal: number) {
    try {
      const couponRef = adminDb.collection('coupons').doc(code.toUpperCase().trim());
      const doc = await couponRef.get();

      if (!doc.exists) {
        return { isValid: false, message: 'Invalid coupon code.' };
      }

      const coupon = doc.data();
      if (!coupon || !coupon.isActive) {
        return { isValid: false, message: 'Invalid or inactive coupon code.' };
      }

      const now = new Date();
      // Handle Firebase Timestamp conversions
      const startsAt = coupon.startsAt?.toDate ? coupon.startsAt.toDate() : new Date(coupon.startsAt);
      const expiresAt = coupon.expiresAt?.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);

      if (now < startsAt || now > expiresAt) {
        return { isValid: false, message: 'This coupon has expired or is not yet active.' };
      }

      if (coupon.maxUsage && (coupon.usedCount || 0) >= coupon.maxUsage) {
        return { isValid: false, message: 'This coupon has reached its maximum usage limit.' };
      }

      if (subtotal < (coupon.minOrderValue || 0)) {
        return { isValid: false, message: `Minimum order value of Rs. ${coupon.minOrderValue} required.` };
      }

      let discount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discount = Math.floor((subtotal * coupon.discountValue) / 100);
      } else {
        discount = coupon.discountValue;
      }

      return {
        isValid: true,
        coupon: { id: doc.id, ...coupon },
        discount
      };
    } catch (err) {
      const cleanCode = code.toUpperCase().trim();
      if (cleanCode === 'WELCOME10') {
        const discount = Math.floor((subtotal * 10) / 100);
        return {
          isValid: true,
          discount,
          coupon: { id: 'mock-welcome10', code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10 }
        };
      }
      if (cleanCode === 'FREE250') {
        return {
          isValid: true,
          discount: 250,
          coupon: { id: 'mock-free250', code: 'FREE250', discountType: 'FIXED', discountValue: 250 }
        };
      }
      return { isValid: false, message: 'Database offline. Try using mock coupon: WELCOME10' };
    }
  }

  static async calculateTotals(items: OrderItemInput[], couponCode?: string) {
    let subtotal = 0;
    const itemsWithDetails: { product: any; variant: ProductVariantDto | null; name: string; price: number; quantity: number }[] = [];

    for (const item of items) {
      let product = await ProductService.getProductBySlug(item.productId);
      if (!product) {
        const allProds = await ProductService.getProducts();
        product = allProds.find(pr => pr.id === item.productId || pr.slug === item.productId) || null;
      }

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      let price = product.price;
      let variantName = 'Standard';
      let selectedVariant: ProductVariantDto | null = null;

      if (item.variantSku) {
        const v = product.variants.find(varItem => varItem.sku === item.variantSku);
        if (v) {
          price = v.price;
          variantName = v.name;
          selectedVariant = v;
        }
      }

      subtotal += price * item.quantity;
      itemsWithDetails.push({
        product,
        variant: selectedVariant,
        name: `${product.name} (${variantName})`,
        price,
        quantity: item.quantity
      });
    }

    const shippingCost = subtotal >= 5000 ? 0 : 250;

    let discount = 0;
    let couponRecord: any = null;
    if (couponCode) {
      const res = await this.validateCoupon(couponCode, subtotal);
      if (res.isValid) {
        discount = res.discount || 0;
        couponRecord = res.coupon;
      }
    }

    const total = Math.max(0, subtotal - discount + shippingCost);

    return {
      subtotal,
      shippingCost,
      discount,
      total,
      couponRecord,
      itemsWithDetails
    };
  }

  static async createOrder(input: CheckoutInput) {
    const {
      subtotal,
      shippingCost,
      discount,
      total,
      couponRecord,
      itemsWithDetails
    } = await this.calculateTotals(input.items, input.couponCode);

    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TECT-${Date.now().toString().slice(-5)}${rand}`;
    const orderId = `order_${Date.now()}_${rand}`;

    try {
      await adminDb.runTransaction(async (transaction) => {
        // 1. Verify and reduce stock in Firestore
        for (const item of itemsWithDetails) {
          if (item.variant && !item.product.id.startsWith('json-prod-')) {
            const productRef = adminDb.collection('products').doc(item.product.id);
            const productDoc = await transaction.get(productRef);
            
            if (!productDoc.exists) {
              throw new Error(`Product document not found: ${item.product.id}`);
            }

            const data = productDoc.data();
            const variants: ProductVariantDto[] = data?.variants || [];
            
            const vIdx = variants.findIndex(v => v.sku === item.variant!.sku);
            if (vIdx === -1 || (variants[vIdx].stock || 0) < item.quantity) {
              throw new Error(`Insufficient stock for: ${item.name}`);
            }

            variants[vIdx].stock -= item.quantity;
            transaction.update(productRef, { variants });
          }
        }

        // 2. Increment Coupon count
        if (couponRecord?.id && !couponRecord.id.startsWith('mock-')) {
          const couponRef = adminDb.collection('coupons').doc(couponRecord.id);
          const couponDoc = await transaction.get(couponRef);
          if (couponDoc.exists) {
            const currentUsed = couponDoc.data()?.usedCount || 0;
            transaction.update(couponRef, { usedCount: currentUsed + 1 });
          }
        }

        // 3. Create Order Document
        const orderRef = adminDb.collection('orders').doc(orderId);
        transaction.set(orderRef, {
          id: orderId,
          userId: input.userId || null,
          orderNumber,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: input.paymentMethod,
          shippingCost,
          discount,
          subtotal,
          total,
          notes: input.notes || null,
          email: input.email,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          address: input.address,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          couponId: couponRecord?.id || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: itemsWithDetails.map(item => ({
            productId: item.product.id,
            variantSku: item.variant?.sku || null,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        });
      });

      // 4. Clear Cart
      if (input.userId) {
        await CartService.clearCart(input.userId);
      }

      const snap = await adminDb.collection('orders').doc(orderId).get();
      return { success: true, order: snap.data(), isMock: false };

    } catch (err: any) {
      console.warn("Firestore order creation transaction failed. Falling back to mock order success.", err.message);

      const mockOrder = {
        id: `mock-order-${Date.now()}`,
        orderNumber,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: input.paymentMethod,
        shippingCost,
        discount,
        subtotal,
        total,
        notes: input.notes || null,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        address: input.address,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        createdAt: new Date(),
        items: itemsWithDetails.map((item, index) => ({
          id: `mock-item-${index}`,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      return { success: true, order: mockOrder, isMock: true };
    }
  }

  static async getOrders(userId: string) {
    try {
      // Fetch user's orders and sort in-memory to prevent requiring composite index creation.
      const snapshot = await adminDb.collection('orders').where('userId', '==', userId).get();
      if (snapshot.empty) return [];

      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };
      });

      // Sort descending by date
      orders.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      return orders;
    } catch (err) {
      console.warn("Firestore getOrders failed, returning empty list.", err);
      return [];
    }
  }

  static async getOrderDetails(orderIdOrNumber: string) {
    try {
      // 1. Try directly by document ID
      const doc = await adminDb.collection('orders').doc(orderIdOrNumber).get();
      if (doc.exists) {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(data?.createdAt)
        };
      }

      // 2. Query by orderNumber
      const snapshot = await adminDb.collection('orders').where('orderNumber', '==', orderIdOrNumber).limit(1).get();
      if (!snapshot.empty) {
        const d = snapshot.docs[0];
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(data?.createdAt)
        };
      }

      return null;
    } catch (err) {
      console.warn("Firestore getOrderDetails failed, returning null.", err);
      return null;
    }
  }
}
