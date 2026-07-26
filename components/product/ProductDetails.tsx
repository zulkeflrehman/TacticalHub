'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import MultimediaGallery from './MultimediaGallery';
import EditorialSpecSheet from './EditorialSpecSheet';
import PDPStickyHeader from './PDPStickyHeader';
import StickyAddToCartSheet from './StickyAddToCartSheet';
import ProductAccordions from './ProductAccordions';
import FluidCarousel from '@/components/home/FluidCarousel';
import type { ProductDto, ProductVariantDto } from '@/lib/catalog-types';
import { Heart, Share2 } from 'lucide-react';

interface ProductDetailsProps {
  product: ProductDto;
  relatedProducts: ProductDto[];
}

export default function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const selectedVariant: ProductVariantDto = product.variants[selectedVariantIndex] || product.variants[0];

  const isLiked = isInWishlist(product.slug);

  const handleWishlistToggle = () => {
    toggleWishlist(product.slug);
    addToast(
      isLiked ? `Removed "${product.name}" from wishlist.` : `Added "${product.name}" to wishlist.`,
      isLiked ? 'info' : 'success'
    );
  };

  const handleQuickAdd = () => {
    const item = {
      productId: product.id,
      inventoryId: selectedVariant.inventoryId,
      variantSku: selectedVariant.sku,
      name: product.name,
      price: selectedVariant.price || product.price,
      image: product.images[0]?.url || '',
      quantity: 1,
      vendor: product.vendor,
    };
    if (addToCart(item)) {
      addToast(`Added 1× "${product.name}" to gear bag.`, 'success');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Product link copied to clipboard.', 'success');
    }
  };

  const currentPrice = selectedVariant?.price || product.price;
  const currentComparePrice = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const hasDiscount = currentComparePrice && currentComparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-28">
      {/* Compact Sticky Top Header on Scroll */}
      <PDPStickyHeader
        productName={product.name}
        price={currentPrice}
        onAddToCart={handleQuickAdd}
      />

      {/* Full-Screen Swipeable Multimedia Gallery with Double-Tap Zoom */}
      <MultimediaGallery productName={product.name} images={product.images} />

      {/* Main Editorial Details */}
      <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
        {/* Title & Metadata */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#B8EC44] uppercase tracking-widest bg-[#B8EC44]/10 border border-[#B8EC44]/30 px-3 py-1 rounded-full">
              {product.categoryName || 'MILITARY SPEC'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 bg-[#141414] border border-white/10 text-neutral-400 hover:text-white rounded-full transition-colors"
                aria-label="Share asset"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-2.5 border rounded-full transition-colors ${
                  isLiked
                    ? 'bg-[#FF6600] border-[#FF6600] text-black'
                    : 'bg-[#141414] border-white/10 text-neutral-400 hover:text-white'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase text-white tracking-tight leading-none">
            {product.name}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Pricing Box */}
        <div className="bento-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-white">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm font-bold text-neutral-500 line-through">
                  Rs. {currentComparePrice.toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="inline-block bg-[#EF4444] text-white text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 1 && (
            <div className="space-y-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">
                SELECT VARIANT SPEC:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.sku}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border rounded-xl transition-all ${
                      selectedVariantIndex === idx
                        ? 'bg-[#FF6600] text-black border-[#FF6600] shadow-[0_0_10px_rgba(255,102,0,0.4)]'
                        : 'bg-[#141414] text-neutral-300 border-white/10 hover:border-neutral-500'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editorial Specification Sheet Grid */}
        <EditorialSpecSheet product={product} />

        {/* Accordions */}
        <ProductAccordions product={product} />

        {/* Dynamic Recommendations */}
        {relatedProducts.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <FluidCarousel
              title="EDITORIAL RECOMMENDATIONS"
              products={relatedProducts}
            />
          </div>
        )}
      </div>

      {/* Floating Glassmorphism Sticky Bottom Sheet */}
      <StickyAddToCartSheet
        product={product}
        selectedVariantIndex={selectedVariantIndex}
      />
    </div>
  );
}
