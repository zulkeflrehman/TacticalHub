#!/usr/bin/env bash
# Usage: ./scripts/create-gcp-service-account.sh <PROJECT_ID> <SA_NAME>
# This script creates a GCP service account and grants roles useful for Cloud Run deployments and pushing images to GCR.

set -euo pipefail
PROJECT_ID=${1:-}
SA_NAME=${2:-tecticalhub-deployer}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <GCP_PROJECT_ID> [SERVICE_ACCOUNT_NAME]"
  exit 2
fi

SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "Creating service account: $SA_EMAIL"
gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT_ID" --display-name "TecticalHub deployer SA"

echo "Granting roles to service account"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$SA_EMAIL" \
  --role roles/run.admin

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$SA_EMAIL" \
  --role roles/storage.admin

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$SA_EMAIL" \
  --role roles/iam.serviceAccountUser

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$SA_EMAIL" \
  --role roles/run.developer

echo "Creating and downloading service account key (save this JSON to GitHub Secrets as GCP_SA_KEY)"
gcloud iam service-accounts keys create ./${SA_NAME}-key.json --project "$PROJECT_ID" --iam-account "$SA_EMAIL"

echo "Created key: ./${SA_NAME}-key.json"
echo "Add this file's contents to GitHub repository secret named GCP_SA_KEY. Remove the file after uploading the secret."
