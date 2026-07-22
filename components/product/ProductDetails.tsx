'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { Heart, ShoppingCart, Truck, RotateCcw, Star, Plus, Minus } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ProductDto, ProductVariantDto } from '@/lib/catalog-types';
import CatalogImage from '@/components/ui/CatalogImage';

interface ProductDetailsProps {
  product: ProductDto;
  relatedProducts: ProductDto[];
}

export default function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist, addToCart } = useStore();
  const addToast = useToastStore((state) => state.addToast);

  // States
  const [selectedImage, setSelectedImage] = useState(product.images[0]?.url || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'shipping' | 'reviews'>('specs');

  // Select variant logic
  // Since variants are named like "Forest Green / 2-4 Persons" or just "Stealth Black",
  // we can parse options from variant names or let the user click the variant directly.
  // Clicking the variant directly is extremely clear!
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto>(product.variants[0]);

  const isLiked = isInWishlist(product.slug);

  const handleWishlistToggle = () => {
    toggleWishlist(product.slug);
    if (!isLiked) {
      addToast(`Added "${product.name}" to wishlist.`, 'success');
    } else {
      addToast(`Removed "${product.name}" from wishlist.`, 'info');
    }
  };

  const currentPrice = selectedVariant?.price || product.price;
  const currentComparePrice = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const hasDiscount = currentComparePrice && currentComparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0;

  const currentStock = selectedVariant?.stock !== undefined ? selectedVariant.stock : product.stock;

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      addToast('Sorry, this variant is out of stock.', 'error');
      return;
    }

    const cartItem: CartItemState = {
      productId: product.id,
      inventoryId: selectedVariant.inventoryId,
      variantSku: selectedVariant?.sku,
      name: product.name + (selectedVariant && selectedVariant.name !== 'Standard' ? ` (${selectedVariant.name})` : ''),
      price: currentPrice,
      image: product.images[0]?.url || '',
      quantity,
      vendor: product.vendor
    };

    if (!addToCart(cartItem)) {
      addToast('Checkout supports up to five different product variants per order.', 'error');
      return;
    }
    addToast(`Added ${quantity}x "${product.name}" to cart.`, 'success');
  };

  const handleBuyNow = () => {
    if (currentStock <= 0) {
      addToast('Sorry, this variant is out of stock.', 'error');
      return;
    }

    const cartItem: CartItemState = {
      productId: product.id,
      inventoryId: selectedVariant.inventoryId,
      variantSku: selectedVariant?.sku,
      name: product.name + (selectedVariant && selectedVariant.name !== 'Standard' ? ` (${selectedVariant.name})` : ''),
      price: currentPrice,
      image: product.images[0]?.url || '',
      quantity,
      vendor: product.vendor
    };

    if (!addToCart(cartItem)) {
      addToast('Checkout supports up to five different product variants per order.', 'error');
      return;
    }
    router.push('/checkout');
  };

  const specs = [
    { key: 'Vendor', value: product.vendor || 'Not specified' },
    { key: 'Category', value: product.categoryName || 'Not specified' },
    { key: 'Variant', value: selectedVariant?.name || 'Standard' },
    { key: 'SKU', value: selectedVariant?.sku || 'Not specified' },
  ];

  return (
    <div className="space-y-16">
      
      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {/* Main image — square, stays inside viewport */}
          <div className="bg-brand-white border border-brand-black/5 relative overflow-hidden clip-angled-lg w-full"
               style={{ aspectRatio: '1 / 1' }}>
            <CatalogImage
              src={selectedImage}
              alt={product.name}
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Thumbnails — horizontal scroll, never causes page overflow */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                 style={{ scrollbarWidth: 'thin' }}>
              {product.images.map((img) => (
                <button
                  key={img.url}
                  onClick={() => setSelectedImage(img.url)}
                  aria-label={`View image ${product.images.indexOf(img) + 1}`}
                  className={`relative w-[72px] h-[72px] flex-shrink-0 bg-brand-white border clip-angled-sm overflow-hidden transition-standard ${
                    selectedImage === img.url
                      ? 'border-brand-accent scale-95 shadow-sm'
                      : 'border-brand-black/5 hover:border-brand-black/25'
                  }`}
                >
                  <CatalogImage src={img.url} alt={`${product.name} thumbnail`} sizes="72px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Details Config (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-brand-dark-gray/60">
              {product.vendor || 'TecticalHub'}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-brand-black leading-tight">
              {product.name}
            </h1>
          </div>

          <hr className="border-brand-black/5" />

          {/* Pricing Box */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-brand-black">
                Rs. {currentPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm sm:text-base font-bold text-brand-dark-gray/50 line-through">
                  Rs. {currentComparePrice.toLocaleString()}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="inline-block bg-red-500 text-brand-white text-[9px] font-black uppercase px-2 py-0.5 clip-angled-sm">
                SAVE {discountPercent}%
              </span>
            )}
          </div>

          <p className="text-xs text-brand-dark-gray leading-relaxed font-semibold">
            {product.shortDescription || 'Crafted with premium materials matching official military specifications.'}
          </p>

          <hr className="border-brand-black/5" />

          {/* Options & Variants Selector */}
          {product.variants.length > 0 && product.variants[0].name !== 'Standard' && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-black">
                Select Model Option
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2.5 text-xs font-bold uppercase transition-all clip-angled border ${
                      selectedVariant.sku === v.sku
                        ? 'bg-brand-black text-brand-white border-brand-black shadow-sm'
                        : 'bg-brand-white text-brand-black border-brand-black/10 hover:border-brand-black'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability status */}
          <div className="flex items-center gap-2">
            {currentStock > 0 ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="text-xs font-bold text-success uppercase">
                  {currentStock <= 5 ? `HURRY! ONLY ${currentStock} LEFT IN STOCK` : 'IN STOCK & READY TO SHIP'}
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-bold text-red-500 uppercase">OUT OF STOCK</span>
              </>
            )}
          </div>

          {/* Quantity and Actions Bar */}
          <div className="space-y-3 pt-2">
            {/* Row: quantity + Add to Cart + Wishlist — wraps on very narrow screens */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-brand-black/15 bg-brand-white clip-angled shrink-0">
                <button
                  disabled={quantity <= 1 || currentStock <= 0}
                  onClick={() => setQuantity(prev => prev - 1)}
                  aria-label="Decrease quantity"
                  className="flex h-[44px] w-[44px] items-center justify-center text-brand-dark-gray hover:text-brand-black disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-extrabold w-8 text-center select-none">{quantity}</span>
                <button
                  disabled={quantity >= Math.min(currentStock, 20) || currentStock <= 0}
                  onClick={() => setQuantity(prev => prev + 1)}
                  aria-label="Increase quantity"
                  className="flex h-[44px] w-[44px] items-center justify-center text-brand-dark-gray hover:text-brand-black disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart — grows to fill remaining space */}
              <button
                disabled={currentStock <= 0}
                onClick={handleAddToCart}
                className="flex-1 min-w-[140px] bg-brand-black text-brand-white text-xs font-bold uppercase py-3.5 px-4 flex items-center justify-center gap-2 hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled border border-brand-black disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="truncate">Add to Cart</span>
              </button>

              {/* Wishlist — 44×44 square */}
              <button
                onClick={handleWishlistToggle}
                aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center border transition-all clip-angled focus:outline-none ${
                  isLiked
                    ? 'bg-brand-black border-brand-black text-brand-white'
                    : 'bg-brand-white border-brand-black/10 text-brand-dark-gray hover:border-brand-black hover:text-brand-black'
                }`}
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Buy Now (full width on its own row) */}
            <button
              disabled={currentStock <= 0}
              onClick={handleBuyNow}
              className="w-full bg-brand-accent text-brand-black hover:bg-brand-accent-hover text-xs font-extrabold uppercase py-4 px-6 transition-colors clip-angled-lg border border-brand-accent disabled:opacity-50 disabled:pointer-events-none"
            >
              Buy It Now (COD)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 text-[10px] font-bold text-brand-dark-gray uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4.5 h-4.5 text-brand-accent" />
              <span>Shipping calculated at checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4.5 h-4.5 text-brand-accent" />
              <span>See current return policy</span>
            </div>
          </div>
        </div>

      </div>

      {/* Specifications / Policies / Reviews Tabs */}
      <section className="space-y-6">
        <div className="flex border-b border-brand-black/5">
          {([
            { id: 'specs', label: 'Specifications' },
            { id: 'shipping', label: 'Shipping & Returns' },
            { id: 'reviews', label: 'Reviews' }
          ] satisfies Array<{ id: 'specs' | 'shipping' | 'reviews'; label: string }>).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 px-6 text-xs font-black uppercase tracking-wider relative transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-black border-b-2 border-brand-accent'
                  : 'text-brand-dark-gray/60 hover:text-brand-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-brand-white border border-brand-black/5 p-6 md:p-8 clip-angled">
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <p className="whitespace-pre-line text-xs text-brand-dark-gray leading-relaxed font-semibold">
                {product.description}
              </p>
              <div className="max-w-2xl border border-brand-black/5 divide-y divide-brand-black/5 text-xs">
                {specs.map((spec) => (
                  <div key={spec.key} className="grid grid-cols-3 p-3">
                    <span className="font-extrabold text-brand-dark-gray uppercase">{spec.key}</span>
                    <span className="col-span-2 font-semibold text-brand-black">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs font-semibold text-brand-dark-gray leading-relaxed">
              <h4 className="font-black text-brand-black uppercase">Standard Shipping Across Pakistan</h4>
              <p>Shipping cost and eligibility are calculated from the current store rules at checkout. Delivery timing is confirmed while your order is processed.</p>
              <h4 className="font-black text-brand-black uppercase">Cash on Delivery (COD) Available</h4>
              <p>Payment methods currently offered for this order are shown during checkout.</p>
              <h4 className="font-black text-brand-black uppercase">Returns</h4>
              <p>Review the published Returns & Refund Policy for current eligibility, timing, and item-condition requirements.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="py-8 text-center space-y-2">
              <Star className="w-8 h-8 text-brand-dark-gray/30 mx-auto" />
              <p className="text-xs font-bold uppercase text-brand-black">No verified reviews yet</p>
              <p className="text-xs text-brand-dark-gray">Verified buyer reviews will appear here after fulfillment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-widest border-l-4 border-brand-accent pl-3 text-brand-black">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
