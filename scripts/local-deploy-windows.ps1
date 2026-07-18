<#
PowerShell helper to build and run the Docker Compose stack and run Prisma setup steps from host.
Usage: Open PowerShell in repository root and run:
  ./scripts/local-deploy-windows.ps1

Requirements: Docker Desktop running, Node.js + npm installed (if you want to run migrations from host)
#>

param()

function Check-Command($cmd) {
  $p = Get-Command $cmd -ErrorAction SilentlyContinue
  return $p -ne $null
}

if (-not (Check-Command docker)) {
  Write-Error "Docker is not available in PATH. Install Docker Desktop and restart PowerShell."
  exit 1
}

Write-Host "Building and starting containers (docker compose up --build -d) ..."
cd (Join-Path $PSScriptRoot "..")

docker compose up --build -d
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose failed"; exit 2 }

Write-Host "Waiting for web service to respond on http://localhost:3000 ..."
$max=30
for ($i=0; $i -lt $max; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($r.StatusCode -eq 200 -or $r.Content -match '<html') {
      Write-Host "Web service responded"
      break
    }
  } catch {
    Write-Host "Attempt $($i+1): no response yet"
  }
}

# Run Prisma / seed / import on host if Node is installed
if (Check-Command npm) {
  Write-Host "Running npm ci, prisma generate, db push, seed and import locally (requires DATABASE_URL to point at local Postgres)"
  # Set local DATABASE_URL for this session (matches docker-compose.yml)
  $env:DATABASE_URL = "postgresql://postgres:postgres_password@localhost:5432/tecticalhub_db?schema=public"

  npm ci
  if ($LASTEXITCODE -ne 0) { Write-Warning "npm ci failed" }

  npm run db:push
  if ($LASTEXITCODE -ne 0) { Write-Warning "npm run db:push failed" }

  npm run db:seed
  if ($LASTEXITCODE -ne 0) { Write-Warning "npm run db:seed failed" }

  npm run db:import
  if ($LASTEXITCODE -ne 0) { Write-Warning "npm run db:import failed" }

  Write-Host "Local DB setup complete. Visit http://localhost:3000"
} else {
  Write-Warning "npm is not available. Skipping DB migration/seed steps. Install Node/npm and re-run the script if needed."
}

Write-Host "To tail logs: docker compose logs -f tecticalhub-web"