import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================
// CONFIGURATION - UPDATE THESE VALUES
// ====================================

// Your IPFS CIDs from Pinata (after uploading image and video)
const IMAGE_CID = 'bafybeieqg5azdxn63o64aznbupzdxbigwyjdh3bbhb6u2x5yftrexiuhfy'; // Replace with your image CID

// Maximum number of NFTs you plan to mint
const MAX_SUPPLY = 5000;

// NFT Details
const NFT_NAME = "Zero Dash Pass";
const NFT_DESCRIPTION = "Exclusive Zero Dash Pass NFT - Unlock premium game features including special characters, exclusive levels, bonus rewards, and priority access to new content. Powered by 0G Blockchain.";
const EXTERNAL_URL = "https://zerodash.game";
const BACKGROUND_COLOR = "0A1628"; // Hex color without #

// ====================================
// METADATA GENERATION
// ====================================

/**
 * Create metadata object for a specific token ID
 */
const createMetadata = (tokenId) => ({
  name: `${NFT_NAME} #${tokenId}`,
  description: NFT_DESCRIPTION,
  image: `ipfs://${IMAGE_CID}`,
  external_url: EXTERNAL_URL,
  attributes: [
    {
      trait_type: "Type",
      value: "Premium Pass"
    },
    {
      trait_type: "Tier",
      value: "Exclusive"
    },
    {
      trait_type: "Network",
      value: "0G Blockchain"
    },
    {
      trait_type: "Benefits",
      value: "Full Access"
    },
    {
      trait_type: "Coin Multiplier",
      value: "2x"
    },
    {
      trait_type: "Special Levels",
      value: "Unlocked"
    },
    {
      trait_type: "Exclusive Characters",
      value: "Available"
    },
    {
      trait_type: "Priority Access",
      value: "Enabled"
    },
    {
      display_type: "number",
      trait_type: "Token ID",
      value: tokenId
    }
  ],
  background_color: BACKGROUND_COLOR
});

/**
 * Generate all metadata files
 */
const generateMetadata = () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Zero Dash Pass - Metadata Generator      ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Validate CIDs
  if (IMAGE_CID === 'QmYOUR_IMAGE_CID_HERE') {
    console.error('❌ ERROR: Please update IMAGE_CID and VIDEO_CID in the script!');
    console.error('   Upload your image and video to Pinata first.');
    process.exit(1);
  }

  // Create metadata directory
  const metadataDir = path.join(__dirname, 'metadata');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
    console.log('📁 Created metadata directory\n');
  } else {
    console.log('📁 Using existing metadata directory\n');
  }

  console.log('⚙️  Configuration:');
  console.log(`   Name: ${NFT_NAME}`);
  console.log(`   Max Supply: ${MAX_SUPPLY}`);
  console.log(`   Image CID: ${IMAGE_CID}`);
  console.log('');

  // Generate metadata files
  console.log(`🔄 Generating ${MAX_SUPPLY} metadata files...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < MAX_SUPPLY; i++) {
    try {
      const metadata = createMetadata(i);
      const filename = path.join(metadataDir, `${i}`);
      
      // Write file without .json extension (important for IPFS/OpenSea)
      fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
      successCount++;
      
      // Progress indicator
      if (i % 1000 === 0 && i > 0) {
        console.log(`   ✅ Generated ${i}/${MAX_SUPPLY} files...`);
      }
    } catch (error) {
      console.error(`   ❌ Error generating file ${i}:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           GENERATION COMPLETE              ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully generated: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} files`);
  }
  console.log(`📁 Location: ${metadataDir}\n`);

  // Sample metadata
  console.log('📄 Sample Metadata (Token #0):\n');
  const sampleMetadata = createMetadata(0);
  console.log(JSON.stringify(sampleMetadata, null, 2));
  console.log('');

  // Next steps
  console.log('🚀 Next Steps:');
  console.log('   1. Upload the "metadata" folder to Pinata');
  console.log('   2. Get the folder CID from Pinata');
  console.log('   3. Update deploy.js with: ipfs://YOUR_FOLDER_CID/');
  console.log('   4. Deploy your contract!');
  console.log('');
};

// Run the generator
generateMetadata();