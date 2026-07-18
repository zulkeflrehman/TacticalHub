'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { Heart, ShoppingCart } from 'lucide-react';

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
    variants: { sku: string; name: string; price: number; compareAtPrice: number | null; stock: number }[];
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);
  const [hovered, setHovered] = useState(false);

  const isLiked = isInWishlist(product.slug);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.slug);
    if (!isLiked) {
      addToast(`Added "${product.name}" to wishlist.`, 'success');
    } else {
      addToast(`Removed "${product.name}" from wishlist.`, 'info');
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultVariant = product.variants[0];
    const cartItem: CartItemState = {
      productId: product.slug,
      variantSku: defaultVariant?.sku,
      name: product.name,
      price: defaultVariant?.price || product.price,
      image: product.images[0]?.url || '',
      quantity: 1,
      vendor: product.vendor
    };

    addToCart(cartItem);
    addToast(`Added 1x "${product.name}" to cart.`, 'success');
  };

  // Pricing calculations
  const displayPrice = product.price;
  const originalPrice = product.compareAtPrice;
  const hasDiscount = originalPrice && originalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const primaryImage = product.images[0]?.url || '';
  const hoverImage = product.images[1]?.url || primaryImage;

  return (
    <div 
      className="group bg-brand-white border border-brand-black/5 hover:border-brand-black/25 overflow-hidden transition-standard relative flex flex-col h-full cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge Tags */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
        {hasDiscount && (
          <span className="bg-red-500 text-brand-white text-[9px] font-black uppercase px-2 py-0.5 clip-angled-sm select-none">
            {discountPercent}% OFF
          </span>
        )}
        {product.isNewArrival && (
          <span className="bg-brand-black text-brand-white text-[9px] font-black uppercase px-2 py-0.5 clip-angled-sm select-none border border-brand-accent/20">
            NEW
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-brand-accent text-brand-black text-[9px] font-black uppercase px-2 py-0.5 clip-angled-sm select-none">
            HOT
          </span>
        )}
      </div>

      {/* Wishlist Heart Action */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full border shadow-sm transition-all focus:outline-none ${
          isLiked
            ? 'bg-brand-black border-brand-black text-brand-accent'
            : 'bg-brand-white border-brand-black/5 text-brand-dark-gray hover:text-brand-black'
        }`}
      >
        <Heart className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
      </button>

      {/* Product Image Area */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-square w-full bg-brand-light-gray overflow-hidden">
        <img
          src={hovered ? hoverImage : primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-gray/60 mb-0.5">
            {product.vendor || 'TecticalHub'}
          </div>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-brand-black leading-snug line-clamp-2 hover:underline">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Prices Row */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-sm sm:text-base font-extrabold text-brand-black">
              Rs. {displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[11px] font-bold text-brand-dark-gray/50 line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleQuickAdd}
            className="w-full bg-brand-black text-brand-white text-xs font-bold uppercase py-2.5 px-4 flex items-center justify-center gap-1.5 hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled border border-brand-black"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
