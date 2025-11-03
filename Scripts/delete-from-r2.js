#!/usr/bin/env node

/**
 * Delete Unity Build from Cloudflare R2
 * 
 * Usage:
 *   node delete-from-r2.js v1.0.0
 *   node delete-from-r2.js v1.0.0 v1.1.0 v1.2.0
 * 
 * WARNING: This will permanently delete the specified build versions!
 * 
 * Environment variables required:
 *   R2_ACCESS_KEY    - Your R2 access key ID
 *   R2_SECRET_KEY    - Your R2 secret access key
 *   R2_ACCOUNT_ID    - Your Cloudflare account ID
 *   R2_BUCKET_NAME   - Your R2 bucket name (default: zero-dash-builds)
 */

const { 
  S3Client, 
  ListObjectsV2Command, 
  DeleteObjectCommand 
} = require('@aws-sdk/client-s3');
const readline = require('readline');

// Configuration
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'zero-dash-builds';
const versionsToDelete = process.argv.slice(2);

// Check arguments
if (versionsToDelete.length === 0) {
  console.error('❌ Error: No versions specified!');
  console.error('\nUsage: node delete-from-r2.js <version> [version2] [version3]...');
  console.error('Example: node delete-from-r2.js v1.0.0');
  console.error('Example: node delete-from-r2.js v1.0.0 v1.1.0');
  process.exit(1);
}

// Prevent deleting "latest" accidentally
if (versionsToDelete.includes('latest')) {
  console.error('❌ Error: Cannot delete "latest" version!');
  console.error('This is your production build. Delete a specific version instead.');
  process.exit(1);
}

// Check environment variables
if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY || !process.env.R2_ACCOUNT_ID) {
  console.error('❌ Error: Missing required environment variables!');
  console.error('Required: R2_ACCESS_KEY, R2_SECRET_KEY, R2_ACCOUNT_ID');
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

/**
 * Ask for user confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * List all objects with a given prefix
 */
async function listObjects(prefix) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await client.send(command);
  return response.Contents || [];
}

/**
 * Delete a single object
 */
async function deleteObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Delete all objects for a version
 */
async function deleteVersion(version) {
  console.log(`\n🗑️  Deleting version: ${version}`);

  // List all files for this version
  const objects = await listObjects(`${version}/`);

  if (objects.length === 0) {
    console.log(`⚠️  No files found for version: ${version}`);
    return 0;
  }

  console.log(`📁 Found ${objects.length} files:`);
  objects.forEach(obj => {
    console.log(`   - ${obj.Key} (${(obj.Size / 1024).toFixed(2)} KB)`);
  });

  // Delete each file
  for (const obj of objects) {
    await deleteObject(obj.Key);
    console.log(`✅ Deleted: ${obj.Key}`);
  }

  return objects.length;
}

/**
 * Main delete function
 */
async function deleteBuild() {
  console.log('🗑️  Zero Dash Build Deleter\n');
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`📁 Versions to delete: ${versionsToDelete.join(', ')}\n`);

  // Ask for confirmation
  console.log('⚠️  WARNING: This action cannot be undone!');
  const confirmed = await askConfirmation('Are you sure you want to delete these builds? (y/N): ');

  if (!confirmed) {
    console.log('\n❌ Deletion cancelled.');
    process.exit(0);
  }

  let totalDeleted = 0;

  try {
    for (const version of versionsToDelete) {
      const deleted = await deleteVersion(version);
      totalDeleted += deleted;
    }

    console.log(`\n🎉 Deletion complete!`);
    console.log(`📊 Total files deleted: ${totalDeleted}`);

  } catch (error) {
    console.error('\n❌ Deletion failed:', error.message);
    process.exit(1);
  }
}

// Run the delete
deleteBuild().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});