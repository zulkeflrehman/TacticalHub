export interface ProductImageDto {
  url: string;
  isPrimary?: boolean;
}

export interface ProductVariantDto {
  inventoryId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  vendor: string;
  categoryName: string;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

export interface ContentPageDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}

export interface StoreUserDto {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface OrderItemDto {
  inventoryId: string;
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'COD';
  paymentStatus: string;
  status: string;
  notes: string;
  items: OrderItemDto[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponCode: string | null;
  createdAt: Date;
}

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'NEW' | 'RESOLVED';
  createdAt: Date;
}

export interface NewsletterSubscriberDto {
  id: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}
