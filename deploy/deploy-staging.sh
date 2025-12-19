#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-project-a2e0bcb0-3c94-423e-ae3}"
REGION="europe-west1"

# Get git commit hash for tagging
TAG="${1:-$(git rev-parse --short HEAD)}"

echo "=========================================="
echo "Deploying to STAGING"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Tag: $TAG"
echo "=========================================="

# Deploy API
echo ""
echo "Deploying API to staging..."
gcloud run deploy tapandstamp-api-staging \
  --image gcr.io/$PROJECT_ID/tapandstamp-api:$TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=staging" \
  --set-secrets "SUPABASE_URL=tapandstamp-staging-supabase-url:latest" \
  --set-secrets "SUPABASE_ANON_KEY=tapandstamp-staging-supabase-anon-key:latest" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=tapandstamp-staging-supabase-service-key:latest"

# Get API URL
API_URL=$(gcloud run services describe tapandstamp-api-staging --region $REGION --format 'value(status.url)')
echo "API deployed at: $API_URL"

# Deploy Admin
echo ""
echo "Deploying Admin to staging..."

# Custom domain URLs for staging
ADMIN_URL="https://staging.getregulars.app"
API_CUSTOM_URL="https://api.staging.getregulars.app"

gcloud run deploy tapandstamp-admin-staging \
  --image gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=staging,NEXT_PUBLIC_API_URL=$API_CUSTOM_URL,NEXT_PUBLIC_BASE_URL=$ADMIN_URL,NEXT_PUBLIC_ADMIN_URL=$ADMIN_URL,NEXT_PUBLIC_SUPABASE_URL=https://pofacqesahciilruwlpp.supabase.co,APPLE_PASSKIT_CERT_PATH=/secrets/passkit/cert.p12,APPLE_WWDR_CERT_PATH=/secrets/wwdr/cert.cer,APPLE_APNS_KEY_PATH=/secrets/apns/key.p8" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=tapandstamp-staging-supabase-service-key:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=tapandstamp-staging-supabase-anon-key:latest,APPLE_PASS_TYPE_ID=tapandstamp-apple-pass-type-id:latest,APPLE_TEAM_ID=tapandstamp-apple-team-id:latest,APPLE_PASSKIT_CERT_PASSWORD=tapandstamp-passkit-cert-password:latest,APPLE_APNS_KEY_ID=tapandstamp-apns-key-id:latest,PASSKIT_AUTH_SECRET=tapandstamp-passkit-auth-secret:latest,/secrets/passkit/cert.p12=tapandstamp-passkit-cert:latest,/secrets/wwdr/cert.cer=tapandstamp-wwdr-cert:latest,/secrets/apns/key.p8=tapandstamp-apns-key:latest"

echo ""
echo "=========================================="
echo "Staging deployment complete!"
echo ""
echo "API:   $API_CUSTOM_URL"
echo "Admin: $ADMIN_URL"
echo "=========================================="
