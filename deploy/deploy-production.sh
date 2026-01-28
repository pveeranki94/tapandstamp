#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-project-a2e0bcb0-3c94-423e-ae3}"
REGION="europe-west1"

# Get git commit hash for tagging
TAG="${1:-$(git rev-parse --short HEAD)}"

echo "=========================================="
echo "⚠️  DEPLOYING TO PRODUCTION ⚠️"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Tag: $TAG"
echo "=========================================="

read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Deployment cancelled."
  exit 1
fi

# Deploy API
echo ""
echo "Deploying API to production..."
gcloud run deploy tapandstamp-api-prod \
  --image gcr.io/$PROJECT_ID/tapandstamp-api:$TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --min-instances 1 \
  --max-instances 50 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "SUPABASE_URL=tapandstamp-prod-supabase-url:latest" \
  --set-secrets "SUPABASE_ANON_KEY=tapandstamp-prod-supabase-anon-key:latest" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=tapandstamp-prod-supabase-service-key:latest"

# Get API URL
API_URL=$(gcloud run services describe tapandstamp-api-prod --region $REGION --format 'value(status.url)')
echo "API deployed at: $API_URL"

# Deploy Admin
echo ""
echo "Deploying Admin to production..."

# Custom domain URLs for production
ADMIN_URL="https://getregulars.app"
API_CUSTOM_URL="https://api.getregulars.app"

gcloud run deploy tapandstamp-admin-prod \
  --image gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-production \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --min-instances 1 \
  --max-instances 50 \
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=$API_CUSTOM_URL,NEXT_PUBLIC_BASE_URL=$ADMIN_URL,NEXT_PUBLIC_ADMIN_URL=$ADMIN_URL,NEXT_PUBLIC_SUPABASE_URL=https://kugoawbksufodyyjdkdl.supabase.co,APPLE_PASSKIT_CERT_PATH=/secrets/passkit/cert.p12,APPLE_WWDR_CERT_PATH=/secrets/wwdr/cert.cer,APPLE_APNS_KEY_PATH=/secrets/apns/key.p8,CONTENTFUL_ENVIRONMENT=master" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=tapandstamp-prod-supabase-service-key:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=tapandstamp-prod-supabase-anon-key:latest,APPLE_PASS_TYPE_ID=tapandstamp-apple-pass-type-id:latest,APPLE_TEAM_ID=tapandstamp-apple-team-id:latest,APPLE_PASSKIT_CERT_PASSWORD=tapandstamp-passkit-cert-password:latest,APPLE_APNS_KEY_ID=tapandstamp-apns-key-id:latest,PASSKIT_AUTH_SECRET=tapandstamp-passkit-auth-secret:latest,/secrets/passkit/cert.p12=tapandstamp-passkit-cert:latest,/secrets/wwdr/cert.cer=tapandstamp-wwdr-cert:latest,/secrets/apns/key.p8=tapandstamp-apns-key:latest,CONTENTFUL_SPACE_ID=contentful-space-id:latest,CONTENTFUL_DELIVERY_TOKEN=contentful-prod-delivery-token:latest,CONTENTFUL_PREVIEW_TOKEN=contentful-preview-token:latest,CONTENTFUL_PREVIEW_SECRET=contentful-prod-preview-secret:latest,CONTENTFUL_REVALIDATE_SECRET=contentful-prod-revalidate-secret:latest"

echo ""
echo "=========================================="
echo "Production deployment complete!"
echo ""
echo "API:   $API_CUSTOM_URL"
echo "Admin: $ADMIN_URL"
echo "=========================================="
