import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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
    // If not a valid URL, extract handle from name
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
  const jsonPath = path.join(__dirname, '../Product_details.json');
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
    if (!groupedProducts[slug]) {
      groupedProducts[slug] = [];
    }
    groupedProducts[slug].push(item);
  });

  console.log(`Grouped into ${Object.keys(groupedProducts).length} unique slugs.`);

  let productsProcessed = 0;
  let productsCreated = 0;
  let productsUpdated = 0;
  let categoriesCreated = new Set<string>();
  let variantsCreatedCount = 0;
  let imagesLinkedCount = 0;

  for (const [slug, records] of Object.entries(groupedProducts)) {
    // Determine the "best" record
    // Rules: Prefer non-empty vendor, and compare at price > price
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
      comparePrice = 0; // Ignore invalid compare prices
    }

    // Parse image URLs
    const rawImages = bestRecord["Product Image"]
      .split('\n')
      .map(img => img.trim())
      .filter(Boolean)
      .map(img => {
        // Clean URL query params like width and version
        try {
          const url = new URL(img);
          url.search = '';
          return url.toString();
        } catch {
          return img;
        }
      });

    // Extract handle / collection slug
    const categorySlug = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Upsert Category
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: collectionName },
      create: {
        name: collectionName,
        slug: categorySlug,
        description: `Premium selection of ${collectionName}`
      }
    });
    categoriesCreated.add(collectionName);

    // Upsert Product
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    let product;
    if (existingProduct) {
      product = await prisma.product.update({
        where: { slug },
        data: {
          name,
          price,
          compareAtPrice: comparePrice > 0 ? comparePrice : null,
          vendor,
          categoryId: category.id,
        }
      });
      productsUpdated++;
    } else {
      product = await prisma.product.create({
        data: {
          name,
          slug,
          description: `${name}. Designed for high performance, reliability, and extreme durability. Crafted with military-grade specifications.`,
          shortDescription: `High-quality ${name.toLowerCase()} by ${vendor}.`,
          price,
          compareAtPrice: comparePrice > 0 ? comparePrice : null,
          vendor,
          categoryId: category.id,
          status: 'PUBLISHED',
          isFeatured: Math.random() > 0.7,
          isNewArrival: Math.random() > 0.7,
          isBestSeller: Math.random() > 0.7
        }
      });
      productsCreated++;
    }

    // Sync Product Images
    await prisma.productImage.deleteMany({
      where: { productId: product.id }
    });

    for (let i = 0; i < rawImages.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: rawImages[i],
          isPrimary: i === 0,
          orderIndex: i
        }
      });
      imagesLinkedCount++;
    }

    // Build Product Options & Variants
    // For Camping Tents: generate color options (Forest Green, Tactical Black) and sizes (2-4 Persons, 5-6 Persons, 8 Persons)
    // For chairs / travel tables: Color (Olive Drab, Sand Tan, Stealth Black)
    // For Tasers & Baton sticks: Option (Standard, Heavy Duty)
    let options: { name: string; values: string[] }[] = [];
    if (collectionName === 'Camping Tents') {
      options = [
        { name: 'Color', values: ['Forest Green', 'Tactical Black'] },
        { name: 'Size', values: ['2-4 Persons', '5-6 Persons'] }
      ];
    } else if (collectionName === 'Travel & Camping') {
      options = [
        { name: 'Color', values: ['Olive Drab', 'Stealth Black'] }
      ];
    } else if (collectionName === 'Knives & Tasers') {
      options = [
        { name: 'Type', values: ['Standard', 'Heavy Duty'] }
      ];
    } else {
      options = [
        { name: 'Option', values: ['Default'] }
      ];
    }

    // Clear existing variants and options
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productOption.deleteMany({ where: { productId: product.id } });

    // Helper to generate Cartesian product of options for variants
    const optionRecords: any[] = [];
    for (const opt of options) {
      const optionRecord = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: opt.name
        }
      });

      const valueRecords: any[] = [];
      for (const val of opt.values) {
        const valRecord = await prisma.productOptionValue.create({
          data: {
            optionId: optionRecord.id,
            value: val
          }
        });
        valueRecords.push(valRecord);
      }
      optionRecords.push({ optionName: opt.name, values: valueRecords });
    }

    // Generate variants
    const generateVariants = (
      index: number,
      currentCombination: { name: string; ids: string[] }
    ) => {
      if (index === optionRecords.length) {
        // base case: create variant
        const nameCombination = currentCombination.name || 'Default';
        const variantSku = `TECT-${slug.substring(0, 15)}-${nameCombination
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')}`;

        prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variantSku,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: Math.floor(Math.random() * 25) + 5, // random stock 5 to 30
            name: nameCombination,
            optionValues: {
              connect: currentCombination.ids.map(id => ({ id }))
            }
          }
        }).then(() => {
          variantsCreatedCount++;
        }).catch(err => {
          console.error(`Error creating variant: ${variantSku}`, err);
        });
        return;
      }

      const currentOpt = optionRecords[index];
      for (const valRecord of currentOpt.values) {
        const nextName = currentCombination.name
          ? `${currentCombination.name} / ${valRecord.value}`
          : valRecord.value;
        generateVariants(index + 1, {
          name: nextName,
          ids: [...currentCombination.ids, valRecord.id]
        });
      }
    };

    generateVariants(0, { name: '', ids: [] });

    productsProcessed++;
  }

  // Sleep briefly to ensure async variant generation promises settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`\n================ IMPORT SUMMARY ================`);
  console.log(`Products Processed: ${productsProcessed}`);
  console.log(`Products Created  : ${productsCreated}`);
  console.log(`Products Updated  : ${productsUpdated}`);
  console.log(`Categories Created: ${categoriesCreated.size} (${Array.from(categoriesCreated).join(', ')})`);
  console.log(`Images Linked     : ${imagesLinkedCount}`);
  console.log(`Variants Created  : ${variantsCreatedCount}`);
  console.log(`================================================\n`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
