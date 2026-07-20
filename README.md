# TecticalHub

TecticalHub is a static Next.js 16 e-commerce storefront deployed on the Firebase Spark plan. It uses classic Firebase Hosting, Firebase Authentication, Cloud Firestore, Security Rules, and client-side Firestore transactions. No request-time application server is required.

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

Firestore Security Rules are the enforcement boundary. Order creation requires the trusted Firebase Auth `email_verified` token claim. Customers cannot choose prices, discounts, order totals, status values, phone confirmation, payment state, or stock changes. Checkout supports at most five cart lines so every referenced inventory document can be validated within Firestore rules-access limits. Customers can read only their own orders. Administrator access is based on the protected `users/{uid}.role` field; customers cannot create or promote themselves to `ADMIN`.

The Firebase Web SDK configuration is public application configuration, not a privileged credential. No administrator credential or service-account key is shipped to the browser or stored in GitHub.

## Local development

1. Install Node.js 22 or 24.
2. Copy `.env.example` to `.env` and add the Firebase Web App values.
3. Run `npm ci`.
4. Run `npm run dev` and open `http://localhost:3000`.

Useful commands:

```text
npm run lint
npm run typecheck
npm test
npm run test:rules
npm run test:e2e
npm run build
npm run preview
```

`npm run test:rules` needs Java 21 and runs the Firestore emulator regression suite. `npm run build` creates the deployable static site in `out/`. `npm run deploy` builds and deploys Hosting plus Firestore rules/indexes using an authenticated Firebase CLI session.

## Firestore collections

- `products`: public documents only when `status == PUBLISHED`
- `inventory`: checkout authority for SKU, product, price, status, and stock
- `categories`: storefront navigation
- `contentPages`: public only when published
- `users`: private profile and protected role
- `orders`: immutable customer/order totals plus protected admin fulfillment, phone-confirmation, cancellation, and restock markers; private to the owner and administrators
- `coupons`: public single-document validation; listing and management are admin-only
- `contactMessages` and `newsletterSubscribers`: public create with strict field validation; admin read

## Deployment

The default Firebase project is `tecticalhub`. Pushes to `main` run linting, type checking, unit tests, browser smoke tests, a static export, and then a keyless Firebase deployment. See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) for operational readiness and launch steps.

## Spark-plan operating constraints

- Checkout is COD only; online card processing and payment webhooks need a trusted backend and are intentionally absent.
- Real SMS OTP and Firebase Phone Number Verification are unavailable on Spark. Phone numbers remain unverified until an administrator records a manual confirmation result.
- Administrators must monitor the real-time dashboard because automatic order email, SMS, WhatsApp, background jobs, and courier webhooks are not available in this architecture.
- Public contact/newsletter endpoints should receive Firebase App Check before a broad marketing launch.
- Firestore, Authentication email, and Hosting usage must remain within current Spark quotas; over-quota Spark services can stop until their quota resets.
- Catalog detail routes use query strings (`/products?slug=...`) so products created after deployment work without rebuilding static paths.
