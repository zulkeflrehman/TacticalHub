import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItemState {
  productId: string;
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
  addToCart: (item: CartItemState) => void;
  removeFromCart: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  clearCart: () => void;
  toggleMiniCart: (open?: boolean) => void;
  
  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Server Integration Sync
  syncCartWithServer: (userId: string) => Promise<void>;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      isOpen: false,

      setCart: (cart) => set({ cart }),

      addToCart: (item) => set((state) => {
        const existingIndex = state.cart.findIndex(
          (i) => i.productId === item.productId && i.variantSku === item.variantSku
        );

        if (existingIndex > -1) {
          const newCart = [...state.cart];
          newCart[existingIndex].quantity += item.quantity;
          return { cart: newCart, isOpen: true };
        }

        return { cart: [...state.cart, item], isOpen: true };
      }),

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
              ? { ...i, quantity }
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

      syncCartWithServer: async (userId) => {
        const localItems = get().cart;
        if (localItems.length === 0) return;

        try {
          const res = await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              items: localItems.map(i => ({
                productId: i.productId,
                variantSku: i.variantSku,
                quantity: i.quantity
              }))
            })
          });

          if (res.ok) {
            const data = await res.json();
            // If the server returns a merged cart, map it back to local state
            if (data?.cart?.items) {
              const serverCartMapped: CartItemState[] = data.cart.items.map((item: any) => ({
                productId: item.productId,
                variantSku: item.variant?.sku,
                name: item.product.name,
                price: item.variant?.price || item.product.price,
                image: item.product.images[0]?.url || '',
                quantity: item.quantity,
                vendor: item.product.vendor || ''
              }));
              set({ cart: serverCartMapped });
            }
          }
        } catch (err) {
          console.warn("Failed to sync cart with server:", err);
        }
      }
    }),
    {
      name: 'tecticalhub-cart-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }), // persist cart and wishlist
    }
  )
);
