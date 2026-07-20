# Production deployment and launch checklist

## Provisioned platform

- Firebase project: `tecticalhub`
- Plan: Spark / no billing account
- Hosting site: `https://tecticalhub.web.app`
- Firestore: `(default)`, `asia-southeast1`, free-tier database
- Authentication: email/password enabled
- Administrator: `zulkeflrehman@gmail.com` / `Zulkefl Rehman`
- Catalog: 39 products, 99 inventory variants, 4 categories, 3 coupons
- GitHub: `zulkeflrehman/TacticalHub`, default branch `main`
- GitHub repository ID restriction: `1306632512`
- Deployment service account: `tecticalhub-deploy@tecticalhub.iam.gserviceaccount.com`
- Keyless provider: `projects/207771096742/locations/global/workloadIdentityPools/github-actions/providers/tacticalhub`

The administrator must complete the password-reset link sent to the configured email before first admin login.

## Automatic release flow

1. Push or merge code into `main`.
2. GitHub Actions installs locked dependencies.
3. Lint, TypeScript, unit, and browser tests must pass.
4. GitHub exchanges its repository OIDC identity for the restricted deployment service account.
5. The workflow reads the project’s public Firebase Web SDK configuration.
6. Next.js generates only static files in `out/`.
7. Firebase CLI deploys classic Hosting, Firestore rules, and indexes.
8. Verify `https://tecticalhub.web.app` and the admin dashboard.

No long-lived Google credential is stored in the repository or GitHub.

## Launch-blocking operator checklist

- [ ] Complete the administrator password reset and verify admin login.
- [ ] Review every imported product, image, price, SKU, and starter stock level.
- [ ] Replace placeholder support email/phone text throughout storefront content.
- [ ] Publish final privacy, terms, shipping, returns/refunds, and prohibited-items policies.
- [ ] Confirm applicable Pakistan laws and courier policies for knives, tasers, batons, and restricted products; remove products that cannot legally be sold or shipped.
- [ ] Contract and test a COD courier workflow, including tracking, failed delivery, returns, and reconciliation.
- [ ] Place one real low-value internal COD order and complete its full admin lifecycle through delivered/cancelled status.
- [ ] Enable and enforce Firebase App Check for the web app before advertising publicly, especially for contact/newsletter abuse resistance.
- [ ] Configure Firebase Authentication email templates and authorized domains.
- [ ] Confirm the three starter coupon terms or deactivate them.
- [ ] Confirm inventory counts; the seed uses 15 units per variant as a starter value, not audited stock.
- [ ] Set up a daily manual admin routine for orders, contact messages, low stock, and Spark quota monitoring.
- [ ] Add a custom domain later if desired; it is not required to launch.

## Release verification checklist

- [ ] Home catalog and images load from an incognito window.
- [ ] Category, product, search, cart, and wishlist links work.
- [ ] A new customer can register, reset a password, log in, and log out.
- [ ] Checkout refuses stale/out-of-stock inventory and more than five distinct lines.
- [ ] Coupon totals, Rs. 250 shipping, and the Rs. 5,000 free-shipping threshold are correct.
- [ ] A customer sees only their own order history.
- [ ] A customer cannot open the admin console.
- [ ] Admin can publish a product, change stock, process an order, and edit content.
- [ ] `robots.txt`, `sitemap.xml`, security headers, 404 behavior, and mobile layouts are correct.
- [ ] GitHub Actions completes a clean deployment from `main`.

## Operations on the free architecture

The protected admin area includes orders, products, coupons, content, contact messages, and newsletter subscribers. Automated order/customer emails, courier webhooks, online payments, scheduled jobs, automated backups, and dynamic server rendering are intentionally absent. If those become mandatory, the architecture must be revisited; they should not be simulated in untrusted browser code.

The public catalog is cached for the current browser session to avoid duplicate Firestore reads between pages. Monitor the Firebase console for Hosting transfer/storage and Firestore reads, writes, deletes, and storage. Pause advertising or reduce catalog traffic if usage approaches Spark quotas.
