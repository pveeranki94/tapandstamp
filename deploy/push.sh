#!/bin/bash
set -e

# Configuration - update these values
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"

# Get git commit hash for tagging
TAG=$(git rev-parse --short HEAD)

echo "=========================================="
echo "Pushing Docker images to GCR"
echo "Project: $PROJECT_ID"
echo "Tag: $TAG"
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

# Push Admin image
echo ""
echo "Pushing Admin image..."
docker push gcr.io/$PROJECT_ID/tapandstamp-admin:$TAG
docker push gcr.io/$PROJECT_ID/tapandstamp-admin:latest

echo ""
echo "=========================================="
echo "Push complete!"
echo ""
echo "To deploy, run:"
echo "  ./deploy/deploy-staging.sh"
echo "  or"
echo "  ./deploy/deploy-production.sh"
echo "=========================================="
