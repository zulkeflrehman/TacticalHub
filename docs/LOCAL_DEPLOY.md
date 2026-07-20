# Local validation and deployment

Use Node.js 22 or 24. Node.js 25 is outside the project and Firebase emulator engine range.

## Prepare

```text
copy .env.example .env
npm ci
```

Fill in the public Firebase Web App fields in `.env`. Do not add service-account keys.

## Validate

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

For a temporary live checkout/rules smoke test, obtain a short-lived Google access token in `GOOGLE_OAUTH_ACCESS_TOKEN`, then run `npm run test:live`. The script creates and removes its own test account and records.

## Preview the exact Hosting output

```text
npm run build
npm run preview
```

The preview command serves the `out/` directory through the Firebase Hosting emulator.

## Manual deployment

```text
npm run deploy
```

The normal production path is a push to `main`, which uses the keyless GitHub Actions identity documented in `PRODUCTION_DEPLOYMENT.md`.
