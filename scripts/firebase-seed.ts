import { loadEnvConfig } from '@next/env';
// Load environment variables from .env file before importing firebase-admin
loadEnvConfig(process.cwd());

import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from '../lib/firebase-admin';

interface RawProduct {
  "Product Name": string;
  "Product URL": string;
  "Product Image": string;
  "Collection Name": string;
  "Vendor": string;
  "Price (PKR)": string;
  "Compare At Price (PKR)": string;
}

function cleanSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const handle = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    return decodeURIComponent(handle).toLowerCase().trim();
  } catch (err) {
    return url
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

function cleanCollectionName(col: string): string {
  const trimmed = col.trim().toUpperCase();
  if (trimmed === 'CAMPING TENTS') return 'Camping Tents';
  if (trimmed === 'TRAVEL & CAMPING') return 'Travel & Camping';
  if (trimmed === 'KNIVES & TASERS') return 'Knives & Tasers';
  if (trimmed === 'PREMIUM ITEM\'S' || trimmed === 'PREMIUM ITEMS') return 'Premium Items';
  return col.trim();
}

async function main() {
  console.log("Initializing Firebase Seeding process...");
  
  const jsonPath = path.join(process.cwd(), 'Product_details.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: Product JSON not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData: RawProduct[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${rawData.length} raw products from JSON.`);

  // Group by slug to de-duplicate
  const groupedProducts: { [slug: string]: RawProduct[] } = {};
  rawData.forEach(item => {
    const slug = cleanSlug(item["Product URL"]);
    if (!slug) return;
    if (!groupedProducts[slug]) {
      groupedProducts[slug] = [];
    }
    groupedProducts[slug].push(item);
  });

  console.log(`Grouped into ${Object.keys(groupedProducts).length} unique product slugs.`);

  // Initialize batch operation
  let batch = adminDb.batch();
  let operationCount = 0;
  const COMMIT_LIMIT = 400; // Firestore limit is 500 operations per batch

  const commitBatch = async () => {
    if (operationCount > 0) {
      console.log(`Committing batch of ${operationCount} operations...`);
      await batch.commit();
      batch = adminDb.batch();
      operationCount = 0;
    }
  };

  const categoriesCreated = new Set<string>();

  for (const [slug, records] of Object.entries(groupedProducts)) {
    let bestRecord = records[0];
    for (const record of records) {
      if (record["Vendor"] && !bestRecord["Vendor"]) {
        bestRecord = record;
      }
      const price = parseInt(record["Price (PKR)"] || '0', 10);
      const comparePrice = parseInt(record["Compare At Price (PKR)"] || '0', 10);
      if (comparePrice > price) {
        bestRecord = record;
      }
    }

    const name = bestRecord["Product Name"].trim();
    const vendor = bestRecord["Vendor"].trim() || "TecticalHub";
    const collectionName = cleanCollectionName(bestRecord["Collection Name"]);
    const price = parseInt(bestRecord["Price (PKR)"] || '0', 10);
    let comparePrice = parseInt(bestRecord["Compare At Price (PKR)"] || '0', 10);
    if (comparePrice <= price) {
      comparePrice = 0;
    }

    // Clean image URLs
    const rawImages = bestRecord["Product Image"]
      .split('\n')
      .map(img => img.trim())
      .filter(Boolean)
      .map(img => {
        try {
          const url = new URL(img);
          url.search = '';
          return url.toString();
        } catch {
          return img;
        }
      });

    const categorySlug = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 1. Seed Category (only once per slug)
    if (!categoriesCreated.has(categorySlug)) {
      const categoryRef = adminDb.collection('categories').doc(categorySlug);
      batch.set(categoryRef, {
        name: collectionName,
        slug: categorySlug,
        description: `Premium selection of ${collectionName}`,
        image: rawImages[0] || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      categoriesCreated.add(categorySlug);
      operationCount++;
    }

    // 2. Generate Options & Variants (Denormalized inside the product document)
    let variants: any[] = [];
    if (collectionName === 'Camping Tents') {
      const colors = ['Forest Green', 'Tactical Black'];
      const sizes = ['2-4 Persons', '5-6 Persons'];
      colors.forEach(c => {
        sizes.forEach(s => {
          variants.push({
            sku: `TECT-${slug.substring(0, 10).toUpperCase()}-${c.substring(0, 3).toUpperCase()}-${s.replace(/\s/g, '').substring(0, 3).toUpperCase()}`,
            name: `${c} / ${s}`,
            price,
            compareAtPrice: comparePrice > 0 ? comparePrice : null,
            stock: Math.floor(Math.random() * 25) + 5
          });
        });
      });
    } else if (collectionName === 'Travel & Camping') {
      const colors = ['Olive Drab', 'Stealth Black'];
      colors.forEach(c => {
        variants.push({
          sku: `TECT-${slug.substring(0, 12).toUpperCase()}-${c.substring(0, 3).toUpperCase()}`,
          name: c,
          price,
          compareAtPrice: comparePrice > 0 ? comparePrice : null,
          stock: Math.floor(Math.random() * 20) + 10
        });
      });
    } else if (collectionName === 'Knives & Tasers') {
      const types = ['Standard', 'Heavy Duty'];
      types.forEach(t => {
        variants.push({
          sku: `TECT-${slug.substring(0, 12).toUpperCase()}-${t.substring(0, 3).toUpperCase()}`,
          name: t,
          price,
          compareAtPrice: comparePrice > 0 ? comparePrice : null,
          stock: Math.floor(Math.random() * 15) + 5
        });
      });
    } else {
      variants.push({
        sku: `TECT-${slug.substring(0, 15).toUpperCase()}-STD`,
        name: 'Standard',
        price,
        compareAtPrice: comparePrice > 0 ? comparePrice : null,
        stock: 20
      });
    }

    // 3. Seed Product
    const productRef = adminDb.collection('products').doc(slug);
    batch.set(productRef, {
      name,
      slug,
      description: `${name}. Engineered for tactical efficiency, robust operations, and high durability in extreme environments.`,
      shortDescription: `Premium ${name.toLowerCase()} supplied by ${vendor}.`,
      price,
      compareAtPrice: comparePrice > 0 ? comparePrice : null,
      vendor,
      status: 'PUBLISHED',
      categoryId: categorySlug,
      categoryName: collectionName,
      images: rawImages.map((url, i) => ({ url, isPrimary: i === 0 })),
      variants,
      isFeatured: Math.random() > 0.7,
      isNewArrival: Math.random() > 0.7,
      isBestSeller: Math.random() > 0.7,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    operationCount++;

    // Commit batch if it approaches Firestore limits
    if (operationCount >= COMMIT_LIMIT) {
      await commitBatch();
    }
  }

  // 4. Seed Standard Coupons
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 0,
      maxUsage: null,
      usedCount: 0,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
      isActive: true
    },
    {
      code: 'FREE250',
      discountType: 'FIXED',
      discountValue: 250,
      minOrderValue: 2000,
      maxUsage: null,
      usedCount: 0,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      code: 'TACTICAL15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderValue: 5000,
      maxUsage: null,
      usedCount: 0,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ];

  for (const coupon of coupons) {
    const couponRef = adminDb.collection('coupons').doc(coupon.code);
    batch.set(couponRef, coupon);
    operationCount++;
  }

  // 5. Seed Content Pages
  const pages = [
    {
      slug: 'about-us',
      title: 'About TecticalHub',
      content: 'Welcome to TecticalHub. We supply tactical response gear, camping equipment, and heavy-duty survival accessories across Pakistan. Built for operators, campers, and outdoor adventurers.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: 'We take your privacy seriously. Your user profile, checkout information, and order logs are securely stored and never shared with third-party networks.',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const page of pages) {
    const pageRef = adminDb.collection('contentPages').doc(page.slug);
    batch.set(pageRef, page);
    operationCount++;
  }

  await commitBatch();

  console.log("Firestore seeding completed successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Firestore seeding failed with error:", err);
  process.exit(1);
});
