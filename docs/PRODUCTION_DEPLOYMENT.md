# TecticalHub production deployment

## Platform boundary

- Firebase project: `tecticalhub`
- Firebase plan: Spark, with no billing account
- Runtime: static Next.js 16 export on classic Firebase Hosting
- Data: the single free Cloud Firestore database in `asia-southeast1`
- Identity: Firebase Email/Password Authentication and standard address-verification email
- Checkout: cash on delivery (COD) only
- Administrator: `zulkeflrehman@gmail.com` / `Zulkefl Rehman`
- Live site: `https://tecticalhub.web.app`
- Repository: `zulkeflrehman/TacticalHub`, branch `main`

This design contains no Cloud Functions, Cloud Run, Artifact Registry, Secret Manager, Cloud Scheduler, request-time server API, SMS OTP provider, paid trial, or browser-exposed privileged secret.

## Customer order flow

1. The cart is stored in browser-local Zustand storage and remains present during authentication.
2. The customer registers with Firebase Email/Password Authentication.
3. Registration creates a `CUSTOMER` profile and immediately calls `sendEmailVerification()` with Firebase's standard verification flow. It is not passwordless email-link sign-in.
4. The verification screen provides Spam/Junk/Promotions guidance, a 60-second resend cooldown, rate-limit/expired-link guidance, resend, and an **I have verified my email** refresh action.
5. Before checkout is shown, the Firebase user is reloaded and its ID token is refreshed. Firestore independently requires `request.auth.token.email_verified == true` when the order is created.
6. The customer enters their name, complete Pakistan delivery address, city/province/postal code, notes, and a Pakistani mobile number. `03XXXXXXXXX` is stored as `+923XXXXXXXXX`; it is not represented as verified.
7. One Firestore transaction reads every inventory record, corresponding published product, and optional coupon. It derives the authoritative item prices, discount, delivery charge, final total, and checks stock before atomically creating the order, decrementing stock, and incrementing coupon usage.
8. The confirmation screen shows the order number, final total, **Your order has been received**, and explains that the team may call or WhatsApp to confirm the phone number and delivery details.
9. The customer can read only orders whose `userId` equals their Firebase UID. Customers cannot update an order.

## Administrator order flow

1. An administrator signs in through Firebase Authentication; the protected `users/{uid}.role == ADMIN` document is checked by Security Rules.
2. `/admin/orders` subscribes to the latest 100 orders with Firestore `onSnapshot`.
3. New orders receive an in-page badge and last-updated time. Manual refresh is available. The administrator may opt into a browser notification and a short sound while the dashboard remains open.
4. The administrator reviews customer contact, address, items, quantities, totals, notes, and the normalized phone number.
5. Manual phone confirmation is recorded as `PENDING`, `CONFIRMED`, `UNREACHABLE`, or `INVALID`.
6. Fulfillment can move only forward: `PENDING` to `CONFIRMED` to `PROCESSING` to `SHIPPED` to `DELIVERED`. `PENDING`, `CONFIRMED`, or `PROCESSING` can instead move to `CANCELLED`; delivered, shipped, and cancelled transitions are terminal except `SHIPPED` to `DELIVERED`.
7. Courier, tracking number, dispatch date, delivery notes, cancellation reason, and payment status are protected administrator fields.
8. Cancellation runs a Firestore transaction that reads the order and inventory records, restores each ordered quantity, marks every inventory record with that order ID, and commits the terminal cancellation markers atomically. A repeated or concurrent cancellation sees `inventoryRestored == true` and does not add stock again.
9. Browser/sound alerts are dashboard-only. No automatic order email, SMS, WhatsApp, courier notification, or background job is claimed or provided.

## Firestore collections

### `users/{uid}`

`email`, `name`, optional profile `phone`, protected `role`, `createdAt`, `updatedAt`.

### `products/{productId}`

Catalog content, publication status, images, category/vendor data, and variants containing `inventoryId`, SKU, and price. Only `PUBLISHED` products are public.

### `inventory/{inventoryId}`

`productId`, `sku`, authoritative `name`, authoritative `price`, `stock`, `status`, `lastOrderId`, optional `lastRestoredOrderId`, and `updatedAt`.

### `coupons/{CODE}`

`code`, `discountType`, `discountValue`, `minOrderValue`, optional `maxUsage`, `usedCount`, active date range, `isActive`, `lastOrderId`, and `updatedAt`.

### `orders/{orderId}`

- Identity/contact: `orderNumber`, `userId`, `customerName`, `firstName`, `lastName`, verified `email`, `emailVerified`, normalized `phone`
- Delivery: `address`, `city`, `state`, `postalCode`, `notes`
- Lines: `items[]` with `inventoryId`, `productId`, `variantSku`, authoritative `name`, authoritative `price`, and `quantity`
- Money: `subtotal`, `discount`, `shippingCost`, `total`, optional `couponCode`, `paymentMethod: COD`, protected `paymentStatus`
- Operations: protected `phoneConfirmation`, `status`, `courierName`, `trackingNumber`, `dispatchDate`, `cancellationReason`, `deliveryNotes`
- Idempotency/audit: protected `inventoryRestored`, `inventoryRestoredAt`, `cancelledAt`, `createdAt`, `updatedAt`

Other collections are `categories`, `contentPages`, `contactMessages`, and `newsletterSubscribers`.

## Release gates

Use Node.js 22 or 24 and Java 21 for the local Firestore emulator.

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run test:rules
npm run test:e2e
npm run build
```

The security-rules suite proves verified-email enforcement, owner isolation, immutable admin fields, authoritative price/stock enforcement, replay protection, atomic coupon use, real-time admin receipt, safe order transitions, and exactly-once cancellation restoration.

Pushes to `main` repeat lint, TypeScript, unit, browser, emulator-rules, and build gates in GitHub Actions. Deployment uses repository-scoped, keyless Workload Identity Federation and publishes only static Hosting files, Firestore rules, and indexes. There is no long-lived service-account key in the repository or GitHub.

## Manual launch checklist

- [ ] Complete the administrator password reset, verify the admin email, and test admin login.
- [ ] In Firebase Authentication, customize and test the sender name, verification template, password-reset template, authorized domains, and continuation URL.
- [ ] Review every product, image, description, price, SKU, publication status, and physical stock count. Seed stock is not an audited warehouse count.
- [ ] Confirm coupon terms or deactivate starter coupons.
- [ ] Replace placeholder support contact information.
- [ ] Publish final privacy, terms, shipping, returns/refunds, prohibited-items, and customer-support policies.
- [ ] Obtain qualified Pakistan legal/compliance advice for every regulated tactical product and every destination served.
- [ ] Contract and manually test a COD courier process, tracking, failed-delivery returns, reconciliation, and cash handling.
- [ ] Place a low-value real COD order and complete both delivered and cancelled/restocked scenarios.
- [ ] Register Firebase App Check with the no-cost reCAPTCHA v3 provider, monitor metrics, and enable enforcement only after legitimate traffic succeeds.
- [ ] Establish a daily admin routine for orders, phone confirmation, contact messages, low stock, cancellations, quota monitoring, and manual data exports.
- [ ] Add a custom domain later if desired; Firebase's default domain is launch-capable.

## Spark-plan limitations

- Firebase Phone Number Verification and real SMS OTP are not available on Spark. Phone ownership is therefore not cryptographically verified; confirmation is a protected manual status.
- Address-verification email is limited by Firebase's Spark quota (currently 1,000/day); password resets have a lower quota (currently 150/day) and abuse/rate limits can apply without notice.
- Firestore's free database quota is currently 1 GiB stored, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day, and 10 GiB outbound/month. Over-quota use cannot spill into paid usage without billing.
- Hosting has a no-cost storage and transfer ceiling. If Spark transfer is exhausted, the site can be disabled until quota resets; old releases also consume Hosting storage.
- Managed Firestore backups, point-in-time recovery, clone/restore, and TTL deletion require billing. Backups and recovery must remain a manual operator process.
- There is no trusted server runtime for online payments, payment/courier webhooks, server-side fraud scoring, automatic emails/messages, scheduled work, or private third-party credentials.
- Browser notifications and sound require the orders dashboard to remain open. Browser permission, autoplay, power saving, and connectivity can suppress them.
- The real-time admin query reads Firestore documents and consumes quota. It is intentionally limited to the newest 100 orders.
- Checkout is intentionally limited to five cart lines and twenty units per line to stay inside transaction and Security Rules evaluation/access limits.
- Static export means no request-time rendering or API routes. Product detail URLs use query parameters so newly created products do not require a rebuild.
- App Check reduces casual abuse but does not replace Authentication or Security Rules; reCAPTCHA provider quotas and false positives must be monitored.
- No automatic legal, product-safety, courier, inventory, tax, refund, or cash reconciliation decision is made by the application. Those remain business/operator responsibilities.
