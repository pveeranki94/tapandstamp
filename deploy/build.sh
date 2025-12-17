#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-project-a2e0bcb0-3c94-423e-ae3}"
REGION="europe-west1"

# Environment-specific Supabase configuration
STAGING_SUPABASE_URL="https://pofacqesahciilruwlpp.supabase.co"
STAGING_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZmFjcWVzYWhjaWlscnV3bHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzY1NjUsImV4cCI6MjA0OTg1MjU2NX0.kVnlU-6K5-AEKZ3NbnfHG_nBKLvHBLkgLEsKXHsHqHI"

PROD_SUPABASE_URL="https://kugoawbksufodyyjdkdl.supabase.co"
PROD_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1Z29hd2Jrc3Vmb2R5eWpka2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNDk5NjAsImV4cCI6MjA0OTkyNTk2MH0.Jqx2dZOgZ2P_e5nAiw17xnKdj2CpGqMsJ-x6T_U-qSg"

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

# Build Admin images per environment (Supabase URLs are baked in at build time)
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Building Admin image for STAGING..."
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL=$STAGING_SUPABASE_URL \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$STAGING_SUPABASE_ANON_KEY \
    -t gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging \
    -f apps/admin/Dockerfile .
fi

if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Building Admin image for PRODUCTION..."
  docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL=$PROD_SUPABASE_URL \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$PROD_SUPABASE_ANON_KEY \
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
