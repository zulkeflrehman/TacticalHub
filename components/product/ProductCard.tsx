'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import CatalogImage from '@/components/ui/CatalogImage';
import { Heart, ShoppingBag } from 'lucide-react';

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
      addToast('Checkout supports up to five different product variants per order.', 'error');
      return;
    }

    // Haptic response
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([20, 40]);
    }

    setAdding(true);
    addToast(`Added 1× "${product.name}" to gear bag.`, 'success');
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
      className="bento-card group relative flex flex-col h-full overflow-hidden transition-all duration-300 shadow-xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Editorial Badge Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
        {hasDiscount && (
          <span className="bg-[#DC2626] text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md">
            -{discountPercent}%
          </span>
        )}
        {product.isNewArrival && (
          <span className="bg-[#2F4F2F]/80 backdrop-blur-md text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-white/10">
            NEW RECON
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-[#FF6600] text-black font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
            TOP GEAR
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all focus:outline-none ${
          isLiked
            ? 'bg-[#FF6600] border-[#FF6600] text-black'
            : 'bg-black/60 border-white/10 text-neutral-400 hover:text-white hover:border-[#FF6600]'
        }`}
      >
        <Heart className="h-3.5 w-3.5" fill={isLiked ? 'currentColor' : 'none'} />
      </button>

      {/* Macro Image Viewport */}
      <Link
        href={`/products?slug=${encodeURIComponent(product.slug)}`}
        className="block relative w-full bg-[#070707] overflow-hidden border-b border-white/10"
        style={{ aspectRatio: '1 / 1' }}
      >
        <CatalogImage
          src={hovered ? hoverImage : primaryImage}
          alt={product.name}
          className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Bento Card Body */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#B8EC44] block truncate mb-1">
            {product.categoryName || product.vendor}
          </span>
          <Link href={`/products?slug=${encodeURIComponent(product.slug)}`}>
            <h3 className="line-clamp-2 text-xs sm:text-sm font-black uppercase tracking-tight text-white group-hover:text-[#FF6600] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price */}
          <div className="mb-3 flex items-baseline gap-2 font-mono">
            <span className="text-sm sm:text-base font-black text-white">
              Rs. {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[10px] font-bold text-neutral-400 line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Add Action Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickAdd}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6600] text-black hover:bg-[#E05800] py-2.5 px-3 text-[11px] font-mono font-black uppercase rounded-xl transition-all tactile-press shadow-[0_0_12px_rgba(255,102,0,0.3)] disabled:opacity-60"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{adding ? 'ADDED TO GEAR' : 'ADD TO GEAR'}</span>
          </motion.button>
        </div>
      </div>
    </article>
  );
}
