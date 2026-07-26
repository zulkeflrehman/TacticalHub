# TacticalHub

TacticalHub is a static Next.js 16 e-commerce storefront deployed on the Firebase Spark plan. It uses classic Firebase Hosting, Firebase Authentication, Cloud Firestore, Security Rules, and client-side cart/order management.

## Current capabilities

- Live catalog, categories, search, product detail, wishlist, and five-line cart
- Email/password registration with immediate standard Firebase address verification, login, reset-password, profile, and private order history
- Cash-on-delivery checkout with authoritative price, coupon, shipping, and inventory validation
- Atomic inventory decrement, coupon usage increment, and order creation
- Pakistani mobile normalization (`03XXXXXXXXX` to `+923XXXXXXXXX`) with manual admin confirmation status
- Real-time admin orders, optional in-dashboard browser/sound alerts, safe fulfillment states, and exactly-once cancellation restocking
- Role-protected browser admin console for products, stock, categories, orders, coupons, and content
- Contact and newsletter capture in Firestore
- Static Firebase Hosting export with free `tecticalhub.web.app` and `tecticalhub.firebaseapp.com` addresses
- Keyless GitHub Actions deployment through repository-scoped Workload Identity Federation

## Security model

Firestore Security Rules are the enforcement boundary. Order creation requires the trusted Firebase Auth `email_verified` token claim. Customers cannot choose prices, discounts, order totals, status, or stock. All validation is server-side in Firestore Security Rules.

The Firebase Web SDK configuration is public application configuration, not a privileged credential. No administrator credential or service-account key is shipped to the browser or stored in GitHub. Deployments use keyless Workload Identity Federation.

## Project architecture

```
tactical-hub/
├── app/                          # Next.js 16 app router
│   ├── (admin)/                  # Admin dashboard routes
│   ├── (customer)/               # Customer-facing routes
│   ├── api/                      # Backend API routes
│   └── layout.tsx                # Root layout
├── components/                   # Reusable React components
├── docs/                         # Documentation & UI reference
│   └── ui-reference/             # UI design documentation
├── lib/                          # Utility functions & helpers
├── public/                       # Static assets
├── scripts/                      # Development & maintenance scripts
│   ├── data/                     # Data files (Product_details.json)
│   └── firebase-seed.ts          # Firestore seeding script
├── firestore.rules               # Firestore Security Rules
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## Directory structure

- **app/** — Next.js 16 app router with grouped routes for admin and customer sections
- **components/** — Reusable React components used throughout the application
- **docs/** — Documentation, guides, and design references including UI mockups
- **lib/** — Shared utility functions, Firebase initialization, and constants
- **public/** — Static images, icons, and other public assets
- **scripts/** — Maintenance and development scripts, including Firestore seeding
- **scripts/data/** — Product and reference data files

## Environment setup

1. **Install Node.js 22 or 24**
   ```bash
   node --version  # Should be v22 or v24
   ```

2. **Copy `.env.example` to `.env`**
   ```bash
   cp .env.example .env
   ```

3. **Add Firebase configuration**
   Edit `.env` and add your Firebase Web App credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

4. **Install dependencies**
   ```bash
   npm ci
   ```

## Development commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run lint            # Run ESLint on all files
npm run typecheck       # TypeScript type checking
npm test                # Run unit tests (Jest)
npm run test:rules      # Test Firestore Security Rules (requires Java 21)
npm run test:e2e        # Run Playwright end-to-end tests
npm run build           # Build static export to out/
npm run preview         # Preview static build locally
npm run deploy          # Build and deploy to Firebase Hosting (requires auth)
```

## Testing commands

- **Unit tests**: `npm test` — Jest tests for utilities, hooks, and components
- **Firestore rules**: `npm run test:rules` — Firestore emulator regression suite (requires Java 21)
- **E2E tests**: `npm run test:e2e` — Playwright browser automation tests
- **Type checking**: `npm run typecheck` — Full TypeScript validation
- **Linting**: `npm run lint` — ESLint code quality checks

## Firebase deployment process

1. **Local deployment**
   ```bash
   npm run deploy
   ```
   This builds the static site to `out/` and deploys both Hosting and Security Rules.

2. **Automated deployment**
   Pushes to `main` automatically run:
   - Linting and type checking
   - Unit tests (`npm test`)
   - Firestore rules tests (`npm run test:rules`)
   - Browser smoke tests (`npm run test:e2e`)
   - Static export build
   - Keyless Firebase deployment via GitHub Actions

3. **Environment requirements**
   - GitHub Actions uses Workload Identity Federation (keyless auth)
   - No service account keys or personal access tokens in the repository

## Firestore collections

- `products`: Public documents only when `status == PUBLISHED`
- `inventory`: Checkout authority for SKU, product, price, status, and stock
- `categories`: Storefront navigation and organization
- `contentPages`: Public content only when published
- `users`: Private profile and role information
- `orders`: Immutable customer/order totals; protected admin fulfillment and state tracking
- `coupons`: Public validation rules; admin-only management
- `contactMessages` and `newsletterSubscribers`: Public create with strict field validation; admin read

## Files that must never be committed

- `.env` — Contains Firebase credentials and API keys
- `firebase-service-account-*.json` — Service account keys (if using older auth)
- `gha-creds-*.json` — GitHub Actions credentials
- `.firebase/` — Local Firebase emulator state
- `.turbo/` — Turbo build cache
- `node_modules/` — Dependencies (use `npm ci` to install)
- `.next/` — Next.js build cache
- `out/` — Static export output
- `/test-results/` — Test outputs
- `/playwright-report/` — E2E test reports
- Debug logs and local build artifacts

## Spark-plan operating constraints

- Checkout is COD only; online card processing and payment webhooks need a trusted backend and are intentionally absent.
- Real SMS OTP and Firebase Phone Number Verification are unavailable on Spark. Phone numbers remain unverified until an administrator records a manual confirmation result.
- Administrators must monitor the real-time dashboard because automatic order email, SMS, WhatsApp, background jobs, and courier webhooks are not available in this architecture.
- Public contact/newsletter endpoints should receive Firebase App Check before a broad marketing launch.
- Firestore, Authentication email, and Hosting usage must remain within current Spark quotas; over-quota Spark services can stop until their quota resets.
- Catalog detail routes use query strings (`/products?slug=...`) so products created after deployment work without rebuilding static paths.
