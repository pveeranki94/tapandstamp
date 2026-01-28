#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-project-a2e0bcb0-3c94-423e-ae3}"

# Get git commit hash for tagging
TAG=$(git rev-parse --short HEAD)
ENV=${1:-all}  # staging, production, or all

echo "=========================================="
echo "Pushing Docker images to GCR"
echo "Project: $PROJECT_ID"
echo "Tag: $TAG"
echo "Environment: $ENV"
echo "=========================================="

# Configure docker for GCR
echo ""
echo "Configuring Docker for GCR..."
gcloud auth configure-docker --quiet

# Push API image
echo ""
echo "Pushing API image..."
docker push gcr.io/$PROJECT_ID/tapandstamp-api:$TAG
docker push gcr.io/$PROJECT_ID/tapandstamp-api:latest

# Push Admin images per environment
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Pushing Admin image for STAGING..."
  docker push gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-staging
fi

if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo ""
  echo "Pushing Admin image for PRODUCTION..."
  docker push gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG-production
fi

echo ""
echo "=========================================="
echo "Push complete!"
echo ""
echo "To deploy, run:"
if [ "$ENV" = "staging" ] || [ "$ENV" = "all" ]; then
  echo "  ./deploy/deploy-staging.sh"
fi
if [ "$ENV" = "production" ] || [ "$ENV" = "all" ]; then
  echo "  ./deploy/deploy-production.sh"
fi
echo "=========================================="
