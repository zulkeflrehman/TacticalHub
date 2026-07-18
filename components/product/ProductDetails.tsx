'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, CartItemState } from '@/lib/store';
import { useToastStore } from '@/lib/toast-store';
import { Heart, ShoppingCart, ShieldAlert, Truck, RotateCcw, Star, Plus, Minus } from 'lucide-react';
import ProductCard from './ProductCard';

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVariant {
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  vendor: string;
  categoryName: string;
  images: ProductImage[];
  variants: ProductVariant[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  stock: number;
}

interface ProductDetailsProps {
  product: Product;
  relatedProducts: any[];
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);

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
      productId: product.slug,
      variantSku: selectedVariant?.sku,
      name: product.name + (selectedVariant && selectedVariant.name !== 'Standard' ? ` (${selectedVariant.name})` : ''),
      price: currentPrice,
      image: product.images[0]?.url || '',
      quantity,
      vendor: product.vendor
    };

    addToCart(cartItem);
    addToast(`Added ${quantity}x "${product.name}" to cart.`, 'success');
  };

  const handleBuyNow = () => {
    if (currentStock <= 0) {
      addToast('Sorry, this variant is out of stock.', 'error');
      return;
    }

    const cartItem: CartItemState = {
      productId: product.slug,
      variantSku: selectedVariant?.sku,
      name: product.name + (selectedVariant && selectedVariant.name !== 'Standard' ? ` (${selectedVariant.name})` : ''),
      price: currentPrice,
      image: product.images[0]?.url || '',
      quantity,
      vendor: product.vendor
    };

    addToCart(cartItem);
    router.push('/checkout');
  };

  // Mock Specs Table
  const specs = useMemo(() => {
    const defaultSpecs = [
      { key: 'Vendor', value: product.vendor || 'TecticalHub' },
      { key: 'Category', value: product.categoryName },
      { key: 'Country of Origin', value: 'Imported LOT' },
      { key: 'Build Quality', value: 'Military Grade Specifications' }
    ];

    if (product.categoryName === 'Camping Tents') {
      return [
        ...defaultSpecs,
        { key: 'Material', value: 'Double Layer PU 3000mm Waterproof Oxford Cloth' },
        { key: 'Pole Material', value: '7.9mm High-Strength Fiberglass Automatic Rods' },
        { key: 'Seams', value: 'Double Stitching, Heat-Sealed Waterproof Taped Seams' },
        { key: 'Ventilation', value: 'Mesh Windows with High-Density Anti-Mosquito Nets' }
      ];
    }
    if (product.categoryName === 'Knives & Tasers') {
      return [
        ...defaultSpecs,
        { key: 'Self-Defense Output', value: 'Heavy Duty Volt Discharge' },
        { key: 'Material', value: 'Aviation Alloy Aluminum Shell / Reinforced ABS' },
        { key: 'Flashlight Output', value: '180 Lumen Super Beam' },
        { key: 'Safety Lock', value: 'Rear Dual Safety Switch Guard' }
      ];
    }
    return defaultSpecs;
  }, [product]);

  return (
    <div className="space-y-16">
      
      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-brand-white border border-brand-black/5 aspect-square relative overflow-hidden clip-angled-lg">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails Row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img) => (
                <button
                  key={img.url}
                  onClick={() => setSelectedImage(img.url)}
                  className={`w-20 h-20 bg-brand-white border flex-shrink-0 clip-angled-sm overflow-hidden transition-standard ${
                    selectedImage === img.url
                      ? 'border-brand-accent scale-95 shadow-sm'
                      : 'border-brand-black/5 hover:border-brand-black/25'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
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
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark-gray">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-brand-black font-extrabold">5.0</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">12 Customer Reviews</span>
            </div>
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
                        ? 'bg-brand-black text-brand-accent border-brand-black shadow-sm'
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
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border border-brand-black/15 bg-brand-white clip-angled">
                <button
                  disabled={quantity <= 1 || currentStock <= 0}
                  onClick={() => setQuantity(prev => prev - 1)}
                  className="px-3 py-3 text-brand-dark-gray hover:text-brand-black disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-extrabold w-8 text-center select-none">{quantity}</span>
                <button
                  disabled={quantity >= currentStock || currentStock <= 0}
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3 py-3 text-brand-dark-gray hover:text-brand-black disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                disabled={currentStock <= 0}
                onClick={handleAddToCart}
                className="flex-1 bg-brand-black text-brand-white text-xs font-bold uppercase py-3.5 px-6 flex items-center justify-center gap-2 hover:bg-brand-accent hover:text-brand-black transition-colors clip-angled border border-brand-black disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Wishlist toggle */}
              <button
                onClick={handleWishlistToggle}
                className={`p-3.5 border transition-all clip-angled focus:outline-none ${
                  isLiked
                    ? 'bg-brand-black border-brand-black text-brand-accent'
                    : 'bg-brand-white border-brand-black/10 text-brand-dark-gray hover:border-brand-black hover:text-brand-black'
                }`}
              >
                <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Buy Now (Direct Checkout) */}
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
              <span>Flat Shipping Rs. 250</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4.5 h-4.5 text-brand-accent" />
              <span>7 Days Return Guarantee</span>
            </div>
          </div>
        </div>

      </div>

      {/* Specifications / Policies / Reviews Tabs */}
      <section className="space-y-6">
        <div className="flex border-b border-brand-black/5">
          {[
            { id: 'specs', label: 'Specifications' },
            { id: 'shipping', label: 'Shipping & Returns' },
            { id: 'reviews', label: 'Reviews (12)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
              <p className="text-xs text-brand-dark-gray leading-relaxed font-semibold">
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
              <p>We deliver all orders using trusted courier partners nationwide. Orders take between 3-5 business days to reach major cities, and up to 7 days for remote locations.</p>
              <h4 className="font-black text-brand-black uppercase">Cash on Delivery (COD) Available</h4>
              <p>Pay only when the package arrives at your doorstep. Please make sure the exact cash amount is ready upon delivery.</p>
              <h4 className="font-black text-brand-black uppercase">7-Day Free Returns</h4>
              <p>If you are not satisfied with your purchase, you can return it within 7 days of delivery for a full refund or exchange. Items must be unused, in their original packaging with all tags attached.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="text-center bg-brand-light-gray p-4 clip-angled w-32 border border-brand-black/5">
                  <span className="text-2xl font-black block">5.0</span>
                  <div className="flex text-amber-500 justify-center my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-brand-dark-gray">12 reviews</span>
                </div>
                <div className="text-xs font-semibold text-brand-dark-gray">
                  <p className="font-bold text-brand-black">100% of customers recommend this product.</p>
                  <p className="mt-1">All reviews are verified and submitted by confirmed buyers of this item.</p>
                </div>
              </div>

              <div className="divide-y divide-brand-black/5">
                {[
                  { name: 'Kamil Khan', date: 'June 12, 2026', title: 'Solid Build Quality', rating: 5, body: 'Extremely durable. Sourced exactly as described. Used it in heavy rains during a camping trip in Babusar and it held up beautifully.' },
                  { name: 'Zeeshan A.', date: 'May 28, 2026', title: 'Highly Recommend', rating: 5, body: 'Delivery was quick, got it in Lahore in 2 days. The material feels military-grade and the quick setup mechanism is superb.' }
                ].map((rev, idx) => (
                  <div key={idx} className="py-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold">{rev.name}</span>
                      <span className="text-brand-dark-gray/50">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-500 my-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <h5 className="text-xs font-bold text-brand-black">{rev.title}</h5>
                    <p className="text-xs text-brand-dark-gray/80 leading-relaxed font-medium">{rev.body}</p>
                  </div>
                ))}
              </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
