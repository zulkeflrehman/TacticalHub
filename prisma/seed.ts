import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = 'admin@tecticalhub.com';
  const adminPassword = 'admin_password_123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: 'TecticalHub Admin',
      passwordHash,
      role: Role.ADMIN,
      phone: '03001234567'
    }
  });

  console.log(`Admin account seeded/updated: ${admin.email}`);

  // Seed default CMS content pages
  const contentPages = [
    {
      slug: 'about-us',
      title: 'About Us',
      content: 'Welcome to TecticalHub, Pakistan’s premium independent supplier of military-grade gear, camping tents, travel accessories, and self-defense equipment. We source high-performance equipment designed for extreme environments, offering unmatched durability and reliability. Our mission is to prepare you for any adventure.'
    },
    {
      slug: 'contact-us',
      title: 'Contact Us',
      content: 'Have questions? We are here to help. You can contact TecticalHub support by email at support@tecticalhub.com.pk, or by phone at +92-300-1234567. Our support hours are Monday to Saturday, 9:00 AM - 6:00 PM.'
    },
    {
      slug: 'faq',
      title: 'Frequently Asked Questions',
      content: '1. What is the delivery time? Standard delivery takes 3-5 business days across Pakistan.\n2. Do you offer Cash on Delivery? Yes, COD is our primary payment method.\n3. What is your return policy? We offer a 7-day hassle-free return policy for unused products in original packaging.'
    },
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: 'Your privacy is extremely important to TecticalHub. We only collect details necessary to process your orders securely (shipping addresses, email, phone number). We do not share your private data with third parties except for delivery partner logistics.'
    },
    {
      slug: 'terms-and-conditions',
      title: 'Terms & Conditions',
      content: 'By using TecticalHub storefront, you agree to comply with our Terms of Service. Prices and product availability are subject to change. Order completion is verified on the server before dispatch.'
    },
    {
      slug: 'shipping-policy',
      title: 'Shipping Policy',
      content: 'We ship all orders across Pakistan. Standard shipping is 250 PKR. Orders above 5,000 PKR qualify for Free Shipping. Tracking information is sent once the order is shipped.'
    },
    {
      slug: 'return-policy',
      title: 'Return and Refund Policy',
      content: 'We offer a 7-day return policy on all eligible purchases. If you receive a damaged or incorrect product, contact us within 48 hours. Returns are processed within 5 business days after inspection.'
    }
  ];

  for (const page of contentPages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content },
      create: page
    });
  }

  console.log(`CMS pages seeded: ${contentPages.length} pages.`);
  console.log('Seeding completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
