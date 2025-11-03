#!/bin/bash

# upload-build.sh - Upload Unity build to Cloudflare R2

VERSION=${1:-latest}  # Default to "latest" if no version provided
BUCKET_NAME="zero-dash-builds"
BUILD_DIR="./Build"

echo "🚀 Uploading Unity build version: $VERSION"

# Upload each file to R2
wrangler r2 object put "$BUCKET_NAME/$VERSION/ZeroDash.data" \
  --file="$BUILD_DIR/ZeroDash.data" \
  --content-type="application/octet-stream"

wrangler r2 object put "$BUCKET_NAME/$VERSION/ZeroDash.framework.js" \
  --file="$BUILD_DIR/ZeroDash.framework.js" \
  --content-type="application/javascript"

wrangler r2 object put "$BUCKET_NAME/$VERSION/ZeroDash.wasm" \
  --file="$BUILD_DIR/ZeroDash.wasm" \
  --content-type="application/wasm"

wrangler r2 object put "$BUCKET_NAME/$VERSION/ZeroDash.loader.js" \
  --file="$BUILD_DIR/ZeroDash.loader.js" \
  --content-type="application/javascript"

echo "✅ Upload complete! Build available at:"
echo "https://pub-xxxxx.r2.dev/$VERSION/"