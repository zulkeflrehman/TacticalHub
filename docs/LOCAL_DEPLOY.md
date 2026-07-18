Local deployment checklist — Docker Compose and local (Windows)

This document explains how to deploy the project locally using Docker Compose (recommended) or using a direct Node build (no Docker). It also includes instructions to run Prisma migrations, seed demo data, and import products.

Prerequisites
- Git and this repository checked out to d:\\TACTICALHUB
- Node.js 20+ and npm (for non-docker steps and running Prisma locally)
- Docker Desktop for Windows (with WSL2 integration recommended) and Docker Compose v2
- (Optional) Google Cloud SDK (gcloud) if you plan to run the GCP helper script

Quick: Start the app with Docker Compose
1. Start Docker Desktop and ensure it is running and WSL2 backend is enabled.
2. Open PowerShell as your user (not elevated unless required by Docker install).
3. From the repo root run:

   cd d:\\TACTICALHUB
   docker compose up --build -d

4. Check containers:

   docker compose ps

5. View logs for the web service:

   docker compose logs -f tecticalhub-web

6. Open http://localhost:3000 in your browser.

If containers don't start, see the "Troubleshooting" section below.

Database setup (Postgres container + Prisma)
By default docker-compose exposes Postgres on port 5432 (username: postgres, password: postgres_password, db: tecticalhub_db).

From a host shell (PowerShell or Bash):

# 1. Ensure DATABASE_URL env is set for local host operations
$env:DATABASE_URL = "postgresql://postgres:postgres_password@localhost:5432/tecticalhub_db?schema=public"  # PowerShell example

# 2. Generate Prisma client and push schema
npm ci
npm run db:push

# 3. Seed demo users
npm run db:seed

# 4. Import products from Product_details.json (optional)
npm run db:import

These commands require Node/npm installed on the host. Alternatively, you can run them inside the running web container:

docker compose exec tecticalhub-web sh -lc "npm ci && npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts && npx tsx scripts/import-products.ts"

Start without Docker (quick test)
If you don't want to run Docker, you can run the app directly on your machine (requires Node/npm):

cd d:\\TACTICALHUB
npm ci
npm run build
npm start

The app will be available on http://localhost:3000

Helper scripts included
- scripts/local-deploy-windows.ps1 — PowerShell script that performs the Docker Compose build, waits for the web service, then runs Prisma push/seed/import from the host. Use only if Node is installed locally.
- scripts/local-deploy.sh — POSIX shell script with similar behavior for Linux/macOS.
- scripts/create-gcp-service-account.sh — helper to create a GCP service account (see README).

Troubleshooting
- "docker: command not found" — Docker Desktop isn't installed or not in PATH. Install Docker Desktop and restart your shell.
- Postgres connection refused — ensure docker compose started Postgres and that port 5432 isn't already used by another DB service.
- Prisma migrate errors — ensure DATABASE_URL is correct and the DB is reachable. Inspect container logs: docker compose logs postgres

Security notes
- Do not commit secrets to the repository. The compose file uses example credentials — change them for production.
- If running migrations against a production DB, double-check DATABASE_URL and run migrations in a staging environment first.

Contact
If you want, share the output of docker compose ps and docker compose logs and I can help diagnose failures.