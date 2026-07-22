import { MAX_PRODUCT_DESCRIPTION_LENGTH } from './catalog-types';
import type { ProductDto } from './catalog-types';

export type ProductNumberInput = number | '';

export interface AdminProductVariantForm {
  inventoryId: string;
  sku: string;
  name: string;
  price: ProductNumberInput;
  compareAtPrice: ProductNumberInput;
  stock: ProductNumberInput;
}

export interface AdminProductFormValues {
  documentId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  vendor: string;
  categoryName: string;
  imageUrls: string;
  price: ProductNumberInput;
  compareAtPrice: ProductNumberInput;
  variants: AdminProductVariantForm[];
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  status: 'DRAFT' | 'PUBLISHED';
}

export function slugifyProductName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function createEmptyAdminProductForm(categoryName = ''): AdminProductFormValues {
  return {
    documentId: '',
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    vendor: 'TecticalHub',
    categoryName,
    imageUrls: '',
    price: '',
    compareAtPrice: '',
    variants: [{
      inventoryId: '',
      sku: '',
      name: 'Standard',
      price: '',
      compareAtPrice: '',
      stock: '',
    }],
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    status: 'DRAFT',
  };
}

export function productToAdminProductForm(product: ProductDto): AdminProductFormValues {
  const variants = product.variants.length > 0
    ? product.variants
    : [{
        inventoryId: '',
        sku: '',
        name: 'Standard',
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
      }];

  return {
    documentId: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    vendor: product.vendor,
    categoryName: product.categoryName,
    imageUrls: product.images.map((image) => image.url).join('\n'),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? '',
    variants: variants.map((variant) => ({
      inventoryId: variant.inventoryId,
      sku: variant.sku,
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice ?? '',
      stock: variant.stock,
    })),
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    status: product.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  };
}

function requiredNumber(value: ProductNumberInput, field: string, minimum: number): number {
  if (value === '' || !Number.isFinite(value) || Number(value) < minimum) {
    throw new Error(`${field} must be ${minimum === 0 ? 'zero or greater' : `at least ${minimum}`}.`);
  }
  return Number(value);
}

function optionalPrice(value: ProductNumberInput, field: string): number | null {
  if (value === '') return null;
  return requiredNumber(value, field, 0) || null;
}

function imageUrlsFromText(value: string): string[] {
  return Array.from(new Set(value
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)));
}

export function adminProductFormToProduct(form: AdminProductFormValues): ProductDto {
  const name = form.name.trim();
  if (!name) throw new Error('Product name is required.');
  if (!form.categoryName) throw new Error('Category is required.');
  if (form.description.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    throw new Error(`Product description cannot exceed ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters.`);
  }

  const slug = slugifyProductName(form.slug || name);
  if (!slug) throw new Error('A valid product slug is required.');
  const documentId = form.documentId || slug;
  const price = requiredNumber(form.price, 'Base price', 1);
  const compareAtPrice = optionalPrice(form.compareAtPrice, 'Compare price');
  const imageUrls = imageUrlsFromText(form.imageUrls);
  if (imageUrls.length === 0) throw new Error('At least one product image URL is required.');
  if (form.variants.length === 0) throw new Error('At least one product variant is required.');

  const variants = form.variants.map((variant, index) => {
    const variantNumber = index + 1;
    const sku = variant.sku.trim() || `TH-${slug.slice(0, 20).toUpperCase()}-${variantNumber}`;
    const variantName = variant.name.trim() || 'Standard';
    const stock = requiredNumber(variant.stock, `Variant ${variantNumber} stock`, 0);
    if (!Number.isInteger(stock)) throw new Error(`Variant ${variantNumber} stock must be a whole number.`);

    return {
      inventoryId: variant.inventoryId,
      sku,
      name: variantName,
      price: requiredNumber(variant.price, `Variant ${variantNumber} price`, 1),
      compareAtPrice: optionalPrice(variant.compareAtPrice, `Variant ${variantNumber} compare price`),
      stock,
    };
  });

  return {
    id: documentId,
    name,
    slug,
    description: form.description,
    shortDescription: form.shortDescription.trim() || name,
    price,
    compareAtPrice,
    vendor: form.vendor.trim() || 'TecticalHub',
    categoryName: form.categoryName,
    images: imageUrls.map((url, index) => ({ url, isPrimary: index === 0 })),
    variants,
    isFeatured: form.isFeatured,
    isNewArrival: form.isNewArrival,
    isBestSeller: form.isBestSeller,
    stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
    status: form.status,
  };
}
