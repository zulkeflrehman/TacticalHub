'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import CatalogImage from '@/components/ui/CatalogImage';
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
      isLiked
        ? `Removed "${product.name}" from wishlist.`
        : `Added "${product.name}" to wishlist.`,
      isLiked ? 'info' : 'success',
    );
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Debounce rapid taps
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
      addToast(
        'Checkout supports up to five different product variants per order.',
        'error',
      );
      return;
    }

    setAdding(true);
    addToast(`Added 1× "${product.name}" to cart.`, 'success');
    setTimeout(() => setAdding(false), 1200);
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
      className="group relative flex flex-col h-full bg-brand-white border border-brand-black/5 hover:border-brand-black/25 overflow-hidden transition-standard"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge row */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        {hasDiscount && (
          <span className="bg-red-500 text-brand-white text-[9px] font-black uppercase px-1.5 py-0.5 clip-angled-sm select-none">
            {discountPercent}% OFF
          </span>
        )}
        {product.isNewArrival && (
          <span className="bg-brand-black text-brand-white text-[9px] font-black uppercase px-1.5 py-0.5 clip-angled-sm select-none border border-brand-accent/20">
            NEW
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-brand-accent text-brand-black text-[9px] font-black uppercase px-1.5 py-0.5 clip-angled-sm select-none">
            HOT
          </span>
        )}
      </div>

      {/* Wishlist button */}
      <button
        onClick={handleWishlistToggle}
        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute top-2 right-2 z-10 flex h-[36px] w-[36px] items-center justify-center rounded-full border shadow-sm transition-all focus:outline-none ${
          isLiked
            ? 'bg-brand-black border-brand-black text-brand-accent'
            : 'bg-brand-white border-brand-black/10 text-brand-dark-gray hover:text-brand-black'
        }`}
      >
        <Heart className="h-3.5 w-3.5" fill={isLiked ? 'currentColor' : 'none'} />
      </button>

      {/* Image — fixed aspect ratio, object-contain keeps full product visible */}
      <Link
        href={`/products?slug=${encodeURIComponent(product.slug)}`}
        className="block relative w-full bg-brand-light-gray overflow-hidden"
        style={{ aspectRatio: '1 / 1' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <CatalogImage
          src={hovered ? hoverImage : primaryImage}
          alt={product.name}
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Card body */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark-gray/60 mb-0.5 truncate">
            {product.vendor || 'TecticalHub'}
          </p>
          <Link href={`/products?slug=${encodeURIComponent(product.slug)}`}>
            <h3 className="line-clamp-2 text-xs font-bold leading-snug text-brand-black hover:underline sm:text-sm">
              {product.name}
            </h3>
          </Link>
        </div>

        <div>
          {/* Price row */}
          <div className="mb-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-sm font-extrabold text-brand-black sm:text-base">
              Rs.&nbsp;{displayPrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[11px] font-bold text-brand-dark-gray/50 line-through">
                Rs.&nbsp;{originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
            className="flex w-full items-center justify-center gap-1.5 border border-brand-black bg-brand-black py-2.5 px-3 text-[11px] font-bold uppercase text-brand-white transition-colors hover:bg-brand-accent hover:text-brand-black clip-angled disabled:opacity-60"
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{adding ? 'Added!' : 'Quick Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
