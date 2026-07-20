import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemState {
  productId: string;
  inventoryId: string;
  variantSku?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  vendor: string;
}

interface CartStore {
  cart: CartItemState[];
  wishlist: string[]; // array of productIds or slugs
  isOpen: boolean; // mini-cart drawer open status
  
  // Actions
  setCart: (cart: CartItemState[]) => void;
  addToCart: (item: CartItemState) => boolean;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  toggleMiniCart: (open?: boolean) => void;
  
  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Server Integration Sync
  syncCartWithServer: () => Promise<void>;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      isOpen: false,

      setCart: (cart) => set({ cart }),

      addToCart: (item) => {
        const state = get();
        const existingIndex = state.cart.findIndex(
          (i) => i.productId === item.productId && i.variantSku === item.variantSku
        );

        if (existingIndex > -1) {
          set({
            cart: state.cart.map((entry, index) => index === existingIndex
              ? { ...entry, quantity: Math.min(20, entry.quantity + item.quantity) }
              : entry),
            isOpen: true,
          });
          return true;
        }

        if (state.cart.length >= 5) return false;
        set({ cart: [...state.cart, item], isOpen: true });
        return true;
      },

      removeFromCart: (productId, variantSku) => set((state) => ({
        cart: state.cart.filter(
          (i) => !(i.productId === productId && i.variantSku === variantSku)
        )
      })),

      updateQuantity: (productId, quantity, variantSku) => set((state) => {
        if (quantity <= 0) {
          return {
            cart: state.cart.filter(
              (i) => !(i.productId === productId && i.variantSku === variantSku)
            )
          };
        }

        return {
          cart: state.cart.map((i) =>
            i.productId === productId && i.variantSku === variantSku
              ? { ...i, quantity: Math.min(20, quantity) }
              : i
          )
        };
      }),

      clearCart: () => set({ cart: [] }),

      toggleMiniCart: (open) => set((state) => ({ 
        isOpen: open !== undefined ? open : !state.isOpen 
      })),

      toggleWishlist: (productId) => set((state) => {
        const exists = state.wishlist.includes(productId);
        if (exists) {
          return { wishlist: state.wishlist.filter((id) => id !== productId) };
        }
        return { wishlist: [...state.wishlist, productId] };
      }),

      isInWishlist: (productId) => {
        return get().wishlist.includes(productId);
      },

      clearWishlist: () => set({ wishlist: [] }),

      syncCartWithServer: async () => {
        const localItems = get().cart;
        if (localItems.length === 0) return;

        try {
          // Cart state is intentionally local on the Spark plan. Checkout reads
          // current inventory and prices inside a Firestore transaction.
          set({ cart: localItems.filter((item) => Boolean(item.inventoryId)).slice(0, 5) });
        } catch (err) {
          console.warn("Failed to normalize the local cart:", err);
        }
      }
    }),
    {
      name: 'tecticalhub-cart-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }), // persist cart and wishlist
    }
  )
);
