# TECTICALHUB — Full-Stack E-Commerce Platform

A production-ready, independent full-stack e-commerce website for TecticalHub — Pakistan's premier supplier of military-grade tactical gear, camping equipment, and outdoor accessories.

**Built with:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma ORM · PostgreSQL · Zustand · JWT Auth

---

## 🚀 Quick Start (No Database Required)

The app runs fully without a database — all products are served from `Product_details.json`.

```bash
# Clone and install
cd d:\TACTICALHUB
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000**

---

## 🗄️ Full Database Setup

```bash
# 1. Install and start PostgreSQL locally (or use a cloud DB)
# 2. Edit DATABASE_URL in .env
nano .env

# 3. Generate Prisma client
npx prisma generate

# 4. Push schema to database
npx prisma db push

# 5. Seed admin + demo user accounts
npx tsx prisma/seed.ts

# 6. Import products from JSON
npx tsx scripts/import-products.ts

# 7. Start development server
npm run dev
```

---

## 🔑 Demo Credentials

| Role     | Email                       | Password             |
|----------|-----------------------------|----------------------|
| Admin    | admin@tecticalhub.com       | admin_password_123   |
| Customer | user@tecticalhub.com        | user_password_123    |

### Mock Coupon Codes (no DB needed)
| Code        | Discount        |
|-------------|-----------------|
| `WELCOME10` | 10% off         |
| `FREE250`   | Rs. 250 off     |

---

## 📁 Project Structure

```
TACTICALHUB/
├── app/
│   ├── (storefront)/          # Customer-facing pages
│   │   ├── page.tsx           # Homepage
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # COD checkout + order confirmation
│   │   ├── categories/[slug]/ # Category listing + filter sidebar
│   │   ├── products/[slug]/   # Product detail page
│   │   ├── search/            # Search results
│   │   ├── wishlist/          # Saved wishlist
│   │   └── pages/[slug]/      # CMS content pages
│   ├── account/               # Auth pages (login, register, profile)
│   ├── admin/                 # Admin control panel
│   │   ├── dashboard/         # KPI overview
│   │   ├── products/          # Product CRUD
│   │   ├── categories/        # Category management
│   │   ├── orders/            # Order workflow
│   │   ├── coupons/           # Discount codes
│   │   └── content/           # CMS pages editor
│   └── api/                   # REST API routes
├── components/
│   ├── layout/                # Header, Footer, AnnouncementBar
│   ├── product/               # ProductCard, ProductDetails
│   ├── cart/                  # CartDrawer
│   └── storefront/            # CategoryListing, ContactForm, HeroSection
├── lib/
│   ├── auth.ts                # JWT session (jose)
│   ├── db.ts                  # Prisma singleton
│   ├── store.ts               # Zustand cart + wishlist
│   └── services/              # ProductService, OrderService
├── prisma/
│   ├── schema.prisma          # Full e-commerce schema
│   └── seed.ts                # User seeder
├── scripts/
│   └── import-products.ts     # JSON → DB product importer
├── proxy.ts                   # Route protection (Next.js 16)
└── Product_details.json       # 200+ real products (Shopify export)
```

---

## 🛍️ Features

### Storefront
- **Homepage** — Hero banner, featured products, new arrivals, bestsellers, brand partners strip, newsletter signup
- **Category Pages** — Filter by brand/price/availability, sort by name/price, mobile filter drawer
- **Product Pages** — Image gallery with zoom, variant selector (size/color), add to cart/wishlist, stock status
- **Cart** — Persistent cart (localStorage via Zustand), quantity controls, shipping estimate
- **Checkout** — Full shipping form (Zod validation), COD + Bank Transfer, coupon codes, order summary
- **Order Confirmation** — Inline after checkout with order number, payment instructions
- **Search** — Full-text search with autocomplete suggestions in header
- **Wishlist** — Save products, move to cart
- **Content Pages** — About, FAQ, Shipping Policy, Returns, Privacy Policy, Contact (with form)

### Authentication
- Cookie-based JWT sessions via `jose`
- Login, Register, Profile page with order history
- Route protection via `proxy.ts` (Next.js 16 middleware)
- Guest cart merge on login

### Admin Panel (`/admin`)
- **Dashboard** — Revenue, order count, low-stock alerts, recent orders
- **Products** — Full CRUD with variant grid editor and image management
- **Categories** — Add/edit/delete product collections
- **Orders** — Status workflow (Pending → Processing → Shipped → Delivered), payment status toggle
- **Coupons** — Create percentage or fixed discount codes with expiry and usage limits
- **Content Pages** — Edit all CMS pages from the admin

---

## 🎨 Design System

| Token              | Value                  |
|--------------------|------------------------|
| `brand-black`      | `#010101`              |
| `brand-white`      | `#FFFFFF`              |
| `brand-light-gray` | `#F6F6F6`              |
| `brand-dark-gray`  | `#434343`              |
| `brand-accent`     | `#B8EC44` (Tactical Green) |
| Font               | Inter (Google Fonts)   |
| Style              | Military-tactical, clip-angled corners, uppercase typography |

---

## ⚙️ Environment Variables

```env
# Database Connection
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tecticalhub_db?schema=public"

# Authentication
JWT_SECRET="change-this-to-a-secure-random-string-in-production"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# E-commerce Rules
SHIPPING_COST_PKR="250"
FREE_SHIPPING_THRESHOLD_PKR="5000"
```

---

## 🏗️ Production Build

```bash
npm run build
npm start
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database ORM | Prisma v5.22.0 |
| Database | PostgreSQL |
| Auth | JWT via `jose` (HTTP-only cookies) |
| State | Zustand (cart, wishlist, toasts) |
| Forms | react-hook-form + Zod |
| Icons | Lucide React |

---

## 📞 Support

For queries about this platform, contact: support@tecticalhub.com.pk

---

## 🚢 Deployment

Two deployment options are provided: Vercel (zero-config for Next.js) and Docker Compose (self-hostable, with Postgres).

Vercel (quick, recommended):
1. Sign in to https://vercel.com and import the repository.
2. In Project Settings, set the Environment Variables listed in the "⚙️ Environment Variables" section above (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, etc.).
3. Deploy — Vercel will detect Next.js and build automatically.

Docker Compose (self-hostable):
1. Build and run locally:

   cd d:\\TACTICALHUB
   docker compose up --build -d

2. Example production env variables are set in docker-compose.yml. Update them before deploying to a server.

3. To apply Prisma schema to the Postgres service (when using DB):

   # Generate client (on host)
   npm run db:push
   npm run db:seed

Notes:
- The app also runs in "no-database" mode and falls back to Product_details.json for product data when DB or external credentials are not provided (useful for quick demos).
- Update JWT_SECRET and DATABASE_URL with strong values in production.

If you want, the next steps are:
- (A) Add managed secrets for Vercel, GCP and CI (required for automated deploys)
- (B) Create a small GitHub Actions workflow to build & push a Docker image to a registry and deploy to Google Cloud Run (recommended for SSR + Firebase) — this repository already includes GHCR publish and a Cloud Run deploy workflow
- (C) Use Vercel for production Next.js SSR — this repo contains an example Vercel deploy workflow that triggers on push to main

Repository secrets required for the automated workflows in .github/workflows:

For Cloud Run workflow (deploy-cloud-run.yml):
- GCP_SA_KEY — JSON service account key for a GCP service account with roles: roles/run.admin, roles/storage.admin (if pushing to GCR), roles/iam.serviceAccountUser, roles/run.developer (store as GitHub secret)
- GCP_PROJECT — GCP project id
- GCP_REGION — Cloud Run region (e.g., asia-south1)
- JWT_SECRET — (production secret)
- DATABASE_URL — (Postgres DB URL if using DB)
- NEXT_PUBLIC_APP_URL — production URL

For Vercel workflow (deploy-vercel.yml):
- VERCEL_TOKEN — a personal token (or project token) from Vercel
- VERCEL_ORG_ID — organization id (found in Vercel project settings)
- VERCEL_PROJECT_ID — project id (found in Vercel project settings)

Notes on setup:
- Create a GCP service account and grant the minimum roles required. Download the JSON key and add it to the repository secrets as GCP_SA_KEY.
- For Vercel, add the listed Vercel values to GitHub repository secrets.

Once secrets are added:
- Pushing to the main branch will: build the app, push Docker image(s) and run the Cloud Run deploy workflow and also trigger a Vercel deploy (both workflows run on push to main).

Important: The Cloud Run workflow now auto-runs Prisma in CI. It will execute `npx prisma generate` and `npx prisma migrate deploy` before building and pushing the Docker image. This is convenient but has operational implications:
- Ensure DATABASE_URL points to the correct target database (staging vs production). Prefer testing migrations in a staging environment before applying to production.
- Prisma migrations run in CI require the database to be reachable from the GitHub Actions runner (or via a secure tunnel). If your DB is private behind VPC, configure a deployment environment that can reach the database (e.g., run migrations from a Cloud Build step or a runner inside your GCP project).
- Keep migration files reviewed and tested. Automated migrations are powerful but irreversible without backups — enable regular backups/export of your Postgres database.

If you'd like, I can:
- (1) Add the GitHub Actions workflows (done)
- (2) Add an optional GitHub Action that runs prisma migrate/generate against the Cloud Run Postgres instance (if you want DB migrations automated)
- (3) Create a script to generate a minimal GCP service account and a guide to set IAM roles

Which of (2) or (3) would you like me to add now (or none)?


### About protected deployments and manual approval

The GitHub Actions Cloud Run workflow has been split into three jobs: `migration-preview`, `migrate` and `build-and-deploy`.

- `migration-preview` runs automatically on push and produces a migration plan artifact (`migration-plan`) that reviewers can inspect.
- `migrate` is the protected job that requires a GitHub Environment approval (create an environment named `production`) and runs the actual `prisma migrate deploy`.
- `build-and-deploy` depends on `migrate` and will only proceed after migrations complete.

To enable manual approval:
1. Go to your repository -> Settings -> Environments -> New environment, name it exactly `production`.
2. Under the environment, add required reviewers (users or teams) and set any protection rules you want.
3. When the workflow reaches the `migrate` job, it will pause and request approval from the configured reviewers.

Reviewers can inspect the migration plan artifact produced by the automatic `migration-preview` job (download it from the workflow run page) before approving the protected `migrate` job.

Notes:
- The `migration-preview` job prints `prisma migrate status` to an artifact so reviewers can see pending changes without running migrations.
- The `migrate` job still requires the database to be reachable from the GitHub Actions runner; if your DB is private, consider running migrations from a runner inside your cloud network instead.
- You can change the environment name in `.github/workflows/deploy-cloud-run.yml` if you prefer a different name (e.g., `staging`, `prod-migrations`) but the environment must exist in repo settings for approvals to work.


### Manual migrate dispatch

A dedicated workflow `manual-migrate.yml` allows authorized users to trigger migrations manually from the Actions tab (workflow_dispatch). This job is also environment-protected and uploads a `manual-migration-plan` artifact for review prior to applying the migrations.


### Helper: create GCP service account

A helper script is included to create a service account and grant typical roles required for deployments. Use it from Cloud Shell or a machine with the Google Cloud SDK installed:

```bash
# Create SA and download key
./scripts/create-gcp-service-account.sh <GCP_PROJECT_ID> tecticalhub-deployer

# Add the downloaded JSON as a GitHub repository secret named: GCP_SA_KEY
# Remove the downloaded file after uploading the secret for safety
rm tecticalhub-deployer-key.json
```

Notes on migrations in CI:
- Ensure DATABASE_URL points to the correct environment (staging vs production).
- If your DB is private (e.g., private Cloud SQL), use a runner inside your GCP project or Cloud Build so the migration job can reach the DB.
- Consider adding a manual approval step or workflow gating for prod migrations (already implemented via GitHub Environments).

### Automatic migration SQL diff (PR / push preview)

A dedicated workflow `prisma-migration-diff.yml` runs on pull requests and pushes to `main` and produces a SQL diff artifact named `prisma-migration-diff`. This lets reviewers inspect the exact SQL that would be applied to the target database before approving migrations:

- The workflow runs `npx prisma migrate diff --from-schema-datamodel=./prisma/schema.prisma --to-url="$DATABASE_URL" --script` and uploads the resulting `migration-diff.sql` file as an artifact.
- Reviewers can download the artifact from the workflow run and inspect the SQL statements.

Important: The diff workflow requires the `DATABASE_URL` secret to point at a reachable database. For private DBs, run this workflow from a self-hosted runner or use a staging DB reachable from GitHub Actions.

