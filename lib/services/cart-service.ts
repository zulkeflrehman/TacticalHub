import { adminDb } from '../firebase-admin';
import { ProductService } from './product-service';

export interface CartItemDto {
  productId: string;
  variantSku?: string;
  quantity: number;
}

export class CartService {
  static async getCart(userId: string) {
    try {
      const doc = await adminDb.collection('carts').doc(userId).get();
      if (!doc.exists) {
        return { id: userId, userId, items: [] };
      }

      const data = doc.data();
      const rawItems: CartItemDto[] = data?.items || [];
      const populatedItems: any[] = [];

      for (const item of rawItems) {
        const product = await ProductService.getProductBySlug(item.productId);
        if (product) {
          const variant = item.variantSku
            ? product.variants.find(v => v.sku === item.variantSku) || null
            : null;

          populatedItems.push({
            id: `${item.productId}_split_${item.variantSku || 'std'}`, // Safe ID pattern
            productId: item.productId,
            quantity: item.quantity,
            product: {
              name: product.name,
              price: product.price,
              vendor: product.vendor,
              images: product.images
            },
            variant: variant ? {
              sku: variant.sku,
              price: variant.price
            } : null
          });
        }
      }

      return {
        id: userId,
        userId,
        items: populatedItems
      };
    } catch (err) {
      console.warn("Firestore connection failed in getCart, returning null cart.", err);
      return null;
    }
  }

  static async getOrCreateCart(userId: string) {
    try {
      const cartRef = adminDb.collection('carts').doc(userId);
      const doc = await cartRef.get();
      if (!doc.exists) {
        const newCart = {
          userId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await cartRef.set(newCart);
        return { id: userId, ...newCart };
      }
      return { id: userId, ...doc.data() };
    } catch (err) {
      console.warn("Firestore connection failed in getOrCreateCart.", err);
      return null;
    }
  }

  static async addItem(userId: string, productId: string, variantSku?: string, quantity: number = 1) {
    try {
      const cartRef = adminDb.collection('carts').doc(userId);
      const doc = await cartRef.get();
      
      let items: CartItemDto[] = [];
      if (doc.exists) {
        items = doc.data()?.items || [];
      } else {
        await this.getOrCreateCart(userId);
      }

      // Check if item already exists in the cart array
      const existingIdx = items.findIndex(
        i => i.productId === productId && (variantSku ? i.variantSku === variantSku : !i.variantSku)
      );

      if (existingIdx > -1) {
        items[existingIdx].quantity += quantity;
      } else {
        items.push({
          productId,
          variantSku: variantSku || undefined,
          quantity
        });
      }

      await cartRef.set({
        items,
        updatedAt: new Date()
      }, { merge: true });

      return true;
    } catch (err) {
      console.warn("Firestore connection failed in addItem.", err);
      return null;
    }
  }

  static async updateQuantity(userId: string, itemId: string, quantity: number) {
    try {
      const cartRef = adminDb.collection('carts').doc(userId);
      const doc = await cartRef.get();
      if (!doc.exists) return null;

      const items: CartItemDto[] = doc.data()?.items || [];
      
      // Parse itemId (formatted as productId_split_variantSku)
      const parts = itemId.split('_split_');
      const productId = parts[0];
      const variantSku = parts[1] === 'std' ? undefined : parts[1];

      const itemIdx = items.findIndex(
        i => i.productId === productId && (variantSku ? i.variantSku === variantSku : !i.variantSku)
      );

      if (itemIdx > -1) {
        if (quantity <= 0) {
          items.splice(itemIdx, 1);
        } else {
          items[itemIdx].quantity = quantity;
        }

        await cartRef.set({
          items,
          updatedAt: new Date()
        }, { merge: true });
        
        return true;
      }
      return null;
    } catch (err) {
      console.warn("Firestore connection failed in updateQuantity.", err);
      return null;
    }
  }

  static async removeItem(userId: string, itemId: string) {
    return this.updateQuantity(userId, itemId, 0);
  }

  static async clearCart(userId: string) {
    try {
      const cartRef = adminDb.collection('carts').doc(userId);
      await cartRef.set({
        items: [],
        updatedAt: new Date()
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn("Firestore connection failed in clearCart.", err);
      return false;
    }
  }

  static async mergeCarts(userId: string, guestItems: CartItemDto[]) {
    try {
      const cartRef = adminDb.collection('carts').doc(userId);
      const doc = await cartRef.get();
      
      let items: CartItemDto[] = [];
      if (doc.exists) {
        items = doc.data()?.items || [];
      } else {
        await this.getOrCreateCart(userId);
      }

      for (const item of guestItems) {
        const existingIdx = items.findIndex(
          i => i.productId === item.productId && (item.variantSku ? i.variantSku === item.variantSku : !i.variantSku)
        );

        if (existingIdx > -1) {
          // Merge by taking the larger quantity or adding them
          items[existingIdx].quantity = Math.max(items[existingIdx].quantity, item.quantity);
        } else {
          items.push({
            productId: item.productId,
            variantSku: item.variantSku || undefined,
            quantity: item.quantity
          });
        }
      }

      await cartRef.set({
        items,
        updatedAt: new Date()
      }, { merge: true });

      return await this.getCart(userId);
    } catch (err) {
      console.warn("Firestore connection failed in mergeCarts.", err);
      return null;
    }
  }
}
