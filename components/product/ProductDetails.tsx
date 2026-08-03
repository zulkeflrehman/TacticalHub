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
import { Heart, Share2, Star, ShieldAlert } from 'lucide-react';

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
      addToast(`Added 1× "${product.name}" to cart.`, 'success');
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
      {/* Sticky Header on Scroll */}
      <PDPStickyHeader
        productName={product.name}
        price={currentPrice}
        onAddToCart={handleQuickAdd}
      />

      {/* Multimedia Gallery */}
      <MultimediaGallery productName={product.name} images={product.images} />

      {/* Main Details */}
      <div className="max-w-4xl mx-auto space-y-5 px-2 sm:px-4">
        {/* Category Tag, Rating & Stock Badge */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#FFFFFF] uppercase tracking-wider bg-[#1F3346] border border-[#33506B] px-2.5 py-1 rounded-none">
                {product.categoryName || 'MIL-SPEC GEAR'}
              </span>
              <div className="flex items-center gap-1 bg-[#1F3346] border border-[#33506B] px-2 py-1 rounded-none">
                <Star className="w-3 h-3 text-[#FFFFFF] fill-[#FFFFFF]" />
                <span className="text-[10px] font-mono font-bold text-[#FFFFFF]">4.9 / 5.0</span>
                <span className="text-[10px] font-mono text-[#A0B1C5]">(84)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 bg-[#1F3346] border border-[#33506B] text-[#A0B1C5] hover:text-[#FFFFFF] rounded-none transition-colors"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-2 border rounded-none transition-colors ${
                  isLiked
                    ? 'bg-[#FFFFFF] border-[#FFFFFF] text-[#142230]'
                    : 'bg-[#1F3346] border-[#33506B] text-[#A0B1C5] hover:text-[#FFFFFF]'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase text-[#FFFFFF] tracking-tight leading-tight">
            {product.name}
          </h1>

          {/* Stock Indicator Banner */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F3346] border border-[#E55353]/60 text-[#E55353] text-[10px] font-mono font-bold uppercase rounded-none">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>LIMITED STOCK - 4 UNITS REMAINING</span>
          </div>

          <p
            data-testid="product-description"
            className="text-xs sm:text-sm text-[#A0B1C5] font-sans leading-relaxed pt-1"
          >
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Pricing & Variant Box */}
        <div className="tactical-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1F3346] border border-[#33506B] rounded-none">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-[#FFFFFF]">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm font-bold text-[#A0B1C5] line-through">
                  Rs. {currentComparePrice.toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="inline-block bg-[#E55353] text-[#FFFFFF] text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-none">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          {/* Square Option Variants */}
          {product.variants.length > 1 && (
            <div className="space-y-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-mono font-bold text-[#A0B1C5] uppercase block">
                SELECT SPECIFICATION:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.sku}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`px-3 py-2 font-mono text-xs font-bold uppercase border rounded-none transition-all active:scale-[0.98] ${
                      selectedVariantIndex === idx
                        ? 'bg-[#FFFFFF] text-[#142230] border-[#FFFFFF]'
                        : 'bg-[#142230] text-[#FFFFFF] border-[#33506B] hover:border-[#FFFFFF]'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specification Sheet */}
        <EditorialSpecSheet product={product} />

        {/* Accordions */}
        <ProductAccordions product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-4 border-t border-[#33506B]">
            <FluidCarousel
              title="RECOMMENDED TACTICAL GEAR"
              products={relatedProducts}
            />
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA Bar */}
      <StickyAddToCartSheet
        product={product}
        selectedVariantIndex={selectedVariantIndex}
      />
    </div>
  );
}
