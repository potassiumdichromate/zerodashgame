#!/usr/bin/env node

/**
 * Upload Unity WebGL Build to Cloudflare R2
 * 
 * Usage:
 *   node upload-to-r2.js latest
 *   node upload-to-r2.js v1.2.0
 * 
 * Environment variables required:
 *   R2_ACCESS_KEY    - Your R2 access key ID
 *   R2_SECRET_KEY    - Your R2 secret access key
 *   R2_ACCOUNT_ID    - Your Cloudflare account ID
 *   R2_BUCKET_NAME   - Your R2 bucket name (default: zero-dash-builds)
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Configuration
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'zero-dash-builds';
const BUILD_VERSION = process.argv[2] || 'latest';
const BUILD_DIR = path.join(__dirname, '../Build');

// Check environment variables
if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY || !process.env.R2_ACCOUNT_ID) {
  console.error('❌ Error: Missing required environment variables!');
  console.error('Required: R2_ACCESS_KEY, R2_SECRET_KEY, R2_ACCOUNT_ID');
  console.error('\nCreate a .env file or export these variables:');
  console.error('  export R2_ACCESS_KEY="your-key"');
  console.error('  export R2_SECRET_KEY="your-secret"');
  console.error('  export R2_ACCOUNT_ID="your-account-id"');
  process.exit(1);
}

// Initialize S3 client for R2
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Files to upload with their content types
const filesToUpload = [
  { name: 'ZeroDash.data', contentType: 'application/octet-stream' },
  { name: 'ZeroDash.framework.js', contentType: 'application/javascript' },
  { name: 'ZeroDash.wasm', contentType: 'application/wasm' },
  { name: 'ZeroDash.loader.js', contentType: 'application/javascript' },
];

/**
 * Get file size in MB
 */
function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

/**
 * Upload a single file to R2
 */
async function uploadFile(file) {
  const filePath = path.join(BUILD_DIR, file.name);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    throw new Error(`File not found: ${file.name}`);
  }

  const fileContent = fs.readFileSync(filePath);
  const fileSize = getFileSizeMB(filePath);
  const key = `${BUILD_VERSION}/${file.name}`;

  console.log(`📤 Uploading ${file.name} (${fileSize} MB)...`);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: file.contentType,
      })
    );

    console.log(`✅ Uploaded ${file.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${file.name}:`, error.message);
    throw error;
  }
}

/**
 * Main upload function
 */
async function uploadBuild() {
  console.log('🚀 Zero Dash Unity Build Uploader\n');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`📁 Version: ${BUILD_VERSION}`);
  console.log(`📂 Build directory: ${BUILD_DIR}\n`);

  // Check if Build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`❌ Build directory not found: ${BUILD_DIR}`);
    console.error('Please ensure your Unity build is exported to the Build/ folder');
    process.exit(1);
  }

  let totalSize = 0;

  // Calculate total size
  filesToUpload.forEach(file => {
    const filePath = path.join(BUILD_DIR, file.name);
    if (fs.existsSync(filePath)) {
      totalSize += parseFloat(getFileSizeMB(filePath));
    }
  });

  console.log(`📊 Total size: ${totalSize.toFixed(2)} MB\n`);

  // Upload all files
  const startTime = Date.now();

  try {
    for (const file of filesToUpload) {
      await uploadFile(file);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🎉 Upload complete!');
    console.log(`⏱️  Time taken: ${duration} seconds`);
    console.log('\n📍 Your build is now available at:');
    console.log(`   https://pub-xxxxx.r2.dev/${BUILD_VERSION}/`);
    console.log('\n💡 Don\'t forget to replace "pub-xxxxx" with your actual R2 public URL!');
    
    if (BUILD_VERSION !== 'latest') {
      console.log('\n⚠️  Note: You uploaded a versioned build.');
      console.log('   To make it the live version, also upload as "latest":');
      console.log(`   node upload-to-r2.js latest`);
    }

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadBuild().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});