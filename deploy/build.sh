#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-project-a2e0bcb0-3c94-423e-ae3}"
REGION="europe-west1"

# Environment-specific Supabase configuration
STAGING_SUPABASE_URL="https://pofacqesahciilruwlpp.supabase.co"
STAGING_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZmFjcWVzYWhjaWlscnV3bHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTA3NTEsImV4cCI6MjA4MDg2Njc1MX0.wY0aVGu905s6VnF9_x2SxWt3RZyVFHP64R1s0QtRWdc"

PROD_SUPABASE_URL="https://kugoawbksufodyyjdkdl.supabase.co"
PROD_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29hd2Jrc3Vmb2R5eWpka2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Nzc0MDQsImV4cCI6MjA4MTQ1MzQwNH0.cDnZDztdoS4HmuP3Lwedcj42RpkRaHZQVKQy8_s_E8c"

# Contentful configuration (same space, different environments)
CONTENTFUL_SPACE_ID="${CONTENTFUL_SPACE_ID:-}"
CONTENTFUL_STAGING_DELIVERY_TOKEN="${CONTENTFUL_STAGING_DELIVERY_TOKEN:-}"
CONTENTFUL_PROD_DELIVERY_TOKEN="${CONTENTFUL_PROD_DELIVERY_TOKEN:-}"

# Get git commit hash for tagging
TAG=$(git rev-parse --short HEAD)
ENV=${1:-all}  # staging, production, or all

echo "=========================================="
echo "Building Docker images"
echo "Project: $PROJECT_ID"
echo "Tag: $TAG"
echo "Environment: $ENV"
echo "=========================================="

# Build API image (same for all environments)
echo ""
echo "Building API image..."
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/tapandstamp-api:$TAG -f apps/api/Dockerfile .
docker tag gcr.io/$PROJECT_ID/tapandstamp-api:$TAG gcr.io/$PROJECT_ID/tapandstamp-api:latest

# Build Admin images per environment (Supabase URLs and Contentful are baked in at build time)
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Building Admin image for STAGING..."
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL=$STAGING_SUPABASE_URL \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$STAGING_SUPABASE_ANON_KEY \
    --build-arg CONTENTFUL_SPACE_ID=$CONTENTFUL_SPACE_ID \
    --build-arg CONTENTFUL_DELIVERY_TOKEN=$CONTENTFUL_STAGING_DELIVERY_TOKEN \
    --build-arg CONTENTFUL_ENVIRONMENT=staging \
    -t gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging \
    -f apps/admin/Dockerfile .
fi

if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Building Admin image for PRODUCTION..."
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL=$PROD_SUPABASE_URL \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$PROD_SUPABASE_ANON_KEY \
    --build-arg CONTENTFUL_SPACE_ID=$CONTENTFUL_SPACE_ID \
    --build-arg CONTENTFUL_DELIVERY_TOKEN=$CONTENTFUL_PROD_DELIVERY_TOKEN \
    --build-arg CONTENTFUL_ENVIRONMENT=master \
    -t gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-production \
    -f apps/admin/Dockerfile .
fi

echo ""
echo "=========================================="
echo "Build complete!"
echo ""
echo "Images built:"
echo "  - gcr.io/$PROJECT_ID/tapandstamp-api:$TAG"
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo "  - gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging"
fi
if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo "  - gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-production"
fi
echo ""
echo "To push images, run:"
echo "  docker push gcr.io/$PROJECT_ID/tapandstamp-api:$TAG"
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo "  docker push gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging"
fi
if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo "  docker push gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-production"
fi
echo "=========================================="
