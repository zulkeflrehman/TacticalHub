import { db } from '../db';
import { adminDb } from '../firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export interface ProductImageDto {
  url: string;
  isPrimary: boolean;
}

export interface ProductVariantDto {
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
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
}

// Memory cache for JSON parsed fallback
let jsonProductsCache: ProductDto[] = [];

function loadProductsFromJSON(): ProductDto[] {
  if (jsonProductsCache.length > 0) return jsonProductsCache;

  try {
    const jsonPath = path.resolve(process.cwd(), 'Product_details.json');
    if (!fs.existsSync(jsonPath)) {
      console.warn(`JSON fallback warning: File not found at ${jsonPath}`);
      return [];
    }

    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const grouped: { [slug: string]: any[] } = {};

    rawData.forEach((item: any) => {
      const url = item["Product URL"] || "";
      const pathParts = url.split('/');
      const slug = (pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || "")
        .toLowerCase()
        .trim();
      
      if (!slug) return;
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push(item);
    });

    const products: ProductDto[] = Object.entries(grouped).map(([slug, records], idx) => {
      // Find best record
      let best = records[0];
      for (const r of records) {
        if (r["Vendor"] && !best["Vendor"]) best = r;
        const p = parseInt(r["Price (PKR)"] || '0', 10);
        const cp = parseInt(r["Compare At Price (PKR)"] || '0', 10);
        if (cp > p) best = r;
      }

      const name = best["Product Name"].trim();
      const vendor = best["Vendor"].trim() || "TecticalHub";
      const rawCollection = best["Collection Name"].trim().toUpperCase();
      let categoryName = "Travel & Camping";
      if (rawCollection === 'CAMPING TENTS') categoryName = "Camping Tents";
      else if (rawCollection === 'KNIVES & TASERS') categoryName = "Knives & Tasers";
      else if (rawCollection === 'PREMIUM ITEM\'S' || rawCollection === 'PREMIUM ITEMS') categoryName = "Premium Items";
      else if (best["Collection Name"]) categoryName = best["Collection Name"].trim();

      const price = parseInt(best["Price (PKR)"] || '0', 10);
      let compareAtPrice = parseInt(best["Compare At Price (PKR)"] || '0', 10);
      if (compareAtPrice <= price) compareAtPrice = 0;

      const rawImages = best["Product Image"]
        .split('\n')
        .map((img: string) => img.trim())
        .filter(Boolean)
        .map((img: string) => {
          try {
            const url = new URL(img);
            url.search = '';
            return url.toString();
          } catch {
            return img;
          }
        });

      const images: ProductImageDto[] = rawImages.map((url: string, index: number) => ({
        url,
        isPrimary: index === 0
      }));

      // Generate realistic variants
      let variants: ProductVariantDto[] = [];
      let totalStock = 0;
      if (categoryName === 'Camping Tents') {
        const colors = ['Forest Green', 'Tactical Black'];
        const sizes = ['2-4 Persons', '5-6 Persons'];
        colors.forEach(c => {
          sizes.forEach(s => {
            const vStock = Math.floor((idx + 3) * 3) % 20 + 5;
            totalStock += vStock;
            variants.push({
              sku: `TECT-${slug.substring(0, 10)}-${c.substring(0, 3).toUpperCase()}-${s.replace(/\s/g, '').substring(0, 3).toUpperCase()}`,
              name: `${c} / ${s}`,
              price,
              compareAtPrice: compareAtPrice > 0 ? compareAtPrice : null,
              stock: vStock
            });
          });
        });
      } else if (categoryName === 'Travel & Camping') {
        const colors = ['Olive Drab', 'Stealth Black'];
        colors.forEach(c => {
          const vStock = Math.floor((idx + 5) * 2) % 25 + 5;
          totalStock += vStock;
          variants.push({
            sku: `TECT-${slug.substring(0, 10)}-${c.substring(0, 3).toUpperCase()}`,
            name: c,
            price,
            compareAtPrice: compareAtPrice > 0 ? compareAtPrice : null,
            stock: vStock
          });
        });
      } else if (categoryName === 'Knives & Tasers') {
        const types = ['Standard', 'Heavy Duty'];
        types.forEach(t => {
          const vStock = Math.floor((idx + 2) * 4) % 15 + 5;
          totalStock += vStock;
          variants.push({
            sku: `TECT-${slug.substring(0, 10)}-${t.substring(0, 3).toUpperCase()}`,
            name: t,
            price,
            compareAtPrice: compareAtPrice > 0 ? compareAtPrice : null,
            stock: vStock
          });
        });
      } else {
        const vStock = 15;
        totalStock = vStock;
        variants.push({
          sku: `TECT-${slug.substring(0, 12)}-STD`,
          name: 'Standard',
          price,
          compareAtPrice: compareAtPrice > 0 ? compareAtPrice : null,
          stock: vStock
        });
      }

      // Consistent determinism for featured and bestseller
      const isFeatured = (idx % 5 === 0);
      const isNewArrival = (idx % 4 === 0);
      const isBestSeller = (idx % 3 === 0);

      return {
        id: `json-prod-${idx + 1}`,
        name,
        slug,
        description: `${name}. Designed for tactical response, extreme camping conditions, and robust outdoor environments. Crafted with high-grade durable components.`,
        shortDescription: `Premium ${name} by ${vendor}.`,
        price,
        compareAtPrice: compareAtPrice > 0 ? compareAtPrice : null,
        vendor,
        categoryName,
        images,
        variants,
        isFeatured,
        isNewArrival,
        isBestSeller,
        stock: totalStock
      };
    });

    jsonProductsCache = products;
    return products;
  } catch (err) {
    console.error("Error building fallbacks from JSON:", err);
    return [];
  }
}

export class ProductService {
  static async getCategories(): Promise<CategoryDto[]> {
    try {
      const snapshot = await adminDb.collection('categories').orderBy('name', 'asc').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || null,
            image: data.image || null
          };
        });
      }
    } catch (err) {
      console.warn("Firestore connection failed in getCategories, falling back to JSON categories.", err);
    }

    // JSON Fallback
    const products = loadProductsFromJSON();
    const categoriesMap = new Map<string, CategoryDto>();
    products.forEach(p => {
      const slug = p.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (!categoriesMap.has(slug)) {
        categoriesMap.set(slug, {
          id: `json-cat-${slug}`,
          name: p.categoryName,
          slug,
          description: `Selection of ${p.categoryName}`,
          image: p.images[0]?.url || null
        });
      }
    });
    return Array.from(categoriesMap.values());
  }

  static async getProducts(filters?: {
    categorySlug?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string; // price-asc, price-desc, name-asc, name-desc, latest
  }): Promise<ProductDto[]> {
    let products: ProductDto[] = [];
    try {
      // Fetch all published products from Firestore and filter in-memory.
      // This completely avoids having to build composite indexes in the user's Firebase console.
      const snapshot = await adminDb.collection('products').where('status', '==', 'PUBLISHED').get();
      if (!snapshot.empty) {
        products = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            shortDescription: data.shortDescription || '',
            price: data.price || 0,
            compareAtPrice: data.compareAtPrice || null,
            vendor: data.vendor || '',
            categoryName: data.categoryName || '',
            images: data.images || [],
            variants: data.variants || [],
            isFeatured: data.isFeatured || false,
            isNewArrival: data.isNewArrival || false,
            isBestSeller: data.isBestSeller || false,
            stock: (data.variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
          };
        });
      }
    } catch (err) {
      console.warn("Firestore connection failed in getProducts, falling back to JSON products.", err);
      // JSON Fallback
      products = loadProductsFromJSON();
    }

    // Apply memory filters (works for both Firestore and JSON fallback)
    if (filters?.categorySlug) {
      products = products.filter(p => p.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') === filters.categorySlug);
    }
    if (filters?.isFeatured !== undefined) {
      products = products.filter(p => p.isFeatured === filters.isFeatured);
    }
    if (filters?.isNewArrival !== undefined) {
      products = products.filter(p => p.isNewArrival === filters.isNewArrival);
    }
    if (filters?.isBestSeller !== undefined) {
      products = products.filter(p => p.isBestSeller === filters.isBestSeller);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }
    if (filters?.minPrice !== undefined) {
      products = products.filter(p => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      products = products.filter(p => p.price <= filters.maxPrice!);
    }

    // Sorting
    if (filters?.sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (filters?.sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (filters?.sort === 'name-asc') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters?.sort === 'name-desc') {
      products.sort((a, b) => b.name.localeCompare(a.name));
    }

    return products;
  }

  static async getProductBySlug(slug: string): Promise<ProductDto | null> {
    try {
      const snapshot = await adminDb.collection('products').where('slug', '==', slug).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          shortDescription: data.shortDescription || '',
          price: data.price || 0,
          compareAtPrice: data.compareAtPrice || null,
          vendor: data.vendor || '',
          categoryName: data.categoryName || '',
          images: data.images || [],
          variants: data.variants || [],
          isFeatured: data.isFeatured || false,
          isNewArrival: data.isNewArrival || false,
          isBestSeller: data.isBestSeller || false,
          stock: (data.variants || []).reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
        };
      }
    } catch (err) {
      console.warn("Firestore connection failed in getProductBySlug, falling back to JSON.", err);
    }

    // JSON Fallback
    const products = loadProductsFromJSON();
    return products.find(p => p.slug === slug) || null;
  }

  static async getFeaturedProducts(): Promise<ProductDto[]> {
    return this.getProducts({ isFeatured: true });
  }

  static async getNewArrivals(): Promise<ProductDto[]> {
    return this.getProducts({ isNewArrival: true });
  }

  static async getBestSellers(): Promise<ProductDto[]> {
    return this.getProducts({ isBestSeller: true });
  }
}
