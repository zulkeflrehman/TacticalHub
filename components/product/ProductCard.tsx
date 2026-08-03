'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import CatalogImage from '@/components/ui/CatalogImage';
import { Heart, ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    vendor: string;
    categoryName: string;
    images: { url: string }[];
    variants: {
      inventoryId: string;
      sku: string;
      name: string;
      price: number;
      compareAtPrice: number | null;
      stock: number;
    }[];
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);

  const isLiked = isInWishlist(product.slug);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.slug);
    addToast(
      isLiked ? `Removed "${product.name}" from wishlist.` : `Added "${product.name}" to wishlist.`,
      isLiked ? 'info' : 'success'
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (adding) return;

    const defaultVariant = product.variants[0];
    if (!defaultVariant || defaultVariant.stock <= 0) {
      addToast('This product is currently out of stock.', 'error');
      return;
    }

    const cartItem: CartItemState = {
      productId: product.id,
      inventoryId: defaultVariant.inventoryId,
      variantSku: defaultVariant.sku,
      name: product.name,
      price: defaultVariant.price ?? product.price,
      image: product.images[0]?.url ?? '',
      quantity: 1,
      vendor: product.vendor,
    };

    if (!addToCart(cartItem)) {
      addToast('Checkout supports up to 5 items per order.', 'error');
      return;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([20, 40]);
    }

    setAdding(true);
    addToast(`Added 1× "${product.name}" to cart.`, 'success');
    setTimeout(() => setAdding(false), 1000);
  };

  const displayPrice = product.price;
  const originalPrice = product.compareAtPrice;
  const hasDiscount = originalPrice != null && originalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const primaryImage = product.images[0]?.url ?? '';
  const hoverImage = product.images[1]?.url ?? primaryImage;

  return (
    <article
      className="tactical-card group relative flex flex-col h-full bg-[#1F3346] border border-[#33506B] rounded-none overflow-hidden transition-all duration-300 shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top Left Discount / Badge Box */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
        {hasDiscount && (
          <span className="bg-[#E55353] text-[#FFFFFF] font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-none shadow-sm">
            SAVE {discountPercent}%
          </span>
        )}
        {product.isNewArrival && !hasDiscount && (
          <span className="bg-[#FFFFFF] text-[#142230] font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-none shadow-sm">
            NEW
          </span>
        )}
      </div>

      {/* Top Right Wishlist Box */}
      <button
        onClick={handleWishlistToggle}
        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-none border transition-all focus:outline-none ${
          isLiked
            ? 'bg-[#FFFFFF] border-[#FFFFFF] text-[#142230]'
            : 'bg-[#142230]/80 border-[#33506B] text-[#A0B1C5] hover:text-[#FFFFFF] hover:border-[#FFFFFF]'
        }`}
      >
        <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
      </button>

      {/* 1:1 Square Image Viewport */}
      <Link
        href={`/products?slug=${encodeURIComponent(product.slug)}`}
        className="block relative w-full bg-[#142230] overflow-hidden border-b border-[#33506B] rounded-none aspect-square"
      >
        <CatalogImage
          src={hovered ? hoverImage : primaryImage}
          alt={product.name}
          className="object-contain p-3 w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 rounded-none"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between gap-2.5 p-3 sm:p-4">
        <div>
          {/* Rating Summary */}
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 text-[#FFFFFF] fill-[#FFFFFF]" />
            <span className="text-[10px] font-mono font-bold text-[#FFFFFF]">4.9 / 5.0</span>
            <span className="text-[10px] font-mono text-[#A0B1C5]">(84)</span>
          </div>

          <Link href={`/products?slug=${encodeURIComponent(product.slug)}`}>
            <h3 className="line-clamp-2 text-xs sm:text-sm font-bold uppercase tracking-tight text-[#FFFFFF] group-hover:text-[#F4F1E8] transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price Row */}
          <div className="mb-2.5 flex items-baseline gap-2 font-mono">
            <span className="text-sm sm:text-base font-black text-[#FFFFFF]">
              Rs. {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[10px] font-bold text-[#A0B1C5] line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Add Action Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleQuickAdd}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
            className="w-full h-10 flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#142230] hover:bg-[#F4F1E8] px-3 text-xs font-mono font-black uppercase rounded-none transition-all active:scale-[0.98] border border-[#FFFFFF] disabled:opacity-60"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[#142230]" />
            <span className="truncate">{adding ? 'ADDED' : 'ADD TO CART'}</span>
          </motion.button>
        </div>
      </div>
    </article>
  );
}
