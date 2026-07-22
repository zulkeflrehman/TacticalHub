import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adminProductFormToProduct,
  createEmptyAdminProductForm,
  productToAdminProductForm,
} from '../lib/admin-product-form';
import { MAX_PRODUCT_DESCRIPTION_LENGTH } from '../lib/catalog-types';
import type { ProductDto } from '../lib/catalog-types';

const existingProduct: ProductDto = {
  id: 'firestore-document-id',
  name: 'Existing Field Pack',
  slug: 'existing-field-pack',
  description: 'Original first line\nOriginal second line',
  shortDescription: 'Original summary',
  price: 5_000,
  compareAtPrice: 6_000,
  vendor: 'Original Vendor',
  categoryName: 'Travel & Camping',
  images: [
    { url: 'https://example.com/primary.jpg', isPrimary: true },
    { url: 'https://example.com/alternate.jpg' },
  ],
  variants: [
    {
      inventoryId: 'inventory-black',
      sku: 'PACK-BLACK',
      name: 'Black',
      price: 5_000,
      compareAtPrice: 6_000,
      stock: 4,
    },
    {
      inventoryId: 'inventory-green',
      sku: 'PACK-GREEN',
      name: 'Green',
      price: 5_250,
      compareAtPrice: null,
      stock: 7,
    },
  ],
  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
  stock: 11,
  status: 'PUBLISHED',
};

describe('admin product form mapping', () => {
  it('creates a product with a multiline description and multiple images', () => {
    const form = createEmptyAdminProductForm('Camping Tents');
    form.name = 'Rapid Shelter';
    form.description = 'Fast setup.\nWater-resistant outer layer.\nIncludes carry bag.';
    form.imageUrls = 'https://example.com/one.jpg\nhttps://example.com/two.jpg\nhttps://example.com/one.jpg';
    form.price = 12_000;
    form.compareAtPrice = 14_000;
    form.variants[0].price = 12_000;
    form.variants[0].compareAtPrice = 14_000;
    form.variants[0].stock = 8;

    const product = adminProductFormToProduct(form);

    assert.equal(product.id, 'rapid-shelter');
    assert.equal(product.description, form.description);
    assert.deepEqual(product.images, [
      { url: 'https://example.com/one.jpg', isPrimary: true },
      { url: 'https://example.com/two.jpg', isPrimary: false },
    ]);
    assert.equal(product.stock, 8);
  });

  it('loads every existing field and updates the original Firestore document ID', () => {
    const form = productToAdminProductForm(existingProduct);

    assert.equal(form.description, existingProduct.description);
    assert.equal(form.imageUrls, 'https://example.com/primary.jpg\nhttps://example.com/alternate.jpg');
    assert.deepEqual(form.variants.map((variant) => variant.inventoryId), ['inventory-black', 'inventory-green']);

    form.name = 'Updated Field Pack';
    form.slug = 'updated-field-pack';
    form.description = 'Updated first line\nUpdated second line';
    form.categoryName = 'Premium Items';
    form.vendor = 'Updated Vendor';
    form.price = 5_500;
    form.compareAtPrice = '';
    form.imageUrls = 'https://example.com/replacement.jpg\nhttps://example.com/detail.jpg';
    form.variants[0] = { ...form.variants[0], price: 5_500, stock: 10 };
    form.variants[1] = { ...form.variants[1], name: 'Olive', price: 5_750, stock: 3 };
    form.isFeatured = true;
    form.status = 'DRAFT';

    const updated = adminProductFormToProduct(form);

    assert.equal(updated.id, existingProduct.id, 'editing must retain the Firestore document ID');
    assert.equal(updated.slug, 'updated-field-pack');
    assert.equal(updated.description, form.description);
    assert.equal(updated.categoryName, 'Premium Items');
    assert.equal(updated.vendor, 'Updated Vendor');
    assert.equal(updated.images.length, 2);
    assert.equal(updated.variants[0].inventoryId, 'inventory-black');
    assert.equal(updated.variants[1].name, 'Olive');
    assert.equal(updated.stock, 13);
    assert.equal(updated.isFeatured, true);
    assert.equal(updated.status, 'DRAFT');
  });

  it('rejects descriptions longer than 3000 characters', () => {
    const form = productToAdminProductForm(existingProduct);
    form.description = 'x'.repeat(MAX_PRODUCT_DESCRIPTION_LENGTH + 1);

    assert.throws(
      () => adminProductFormToProduct(form),
      /cannot exceed 3000 characters/i,
    );
  });
});
