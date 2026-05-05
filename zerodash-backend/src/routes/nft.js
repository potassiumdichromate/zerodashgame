const express = require('express');
const { relayMint } = require('../services/nftRelayer');
const Player = require('../models/Player');
const { walletBearerRequired } = require('../middleware/walletBearer');

const router = express.Router();

/**
 * GET /nft/proof/:wallet — Merkle whitelist placeholder (contracts may still gate price)
 */
router.get('/proof/:wallet', async (req, res) => {
  try {
    const wallet = String(req.params.wallet || '').toLowerCase();
    const open =
      process.env.NFT_OPEN_WHITELIST === 'true' ||
      process.env.NFT_OPEN_WHITELIST === '1';

    if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
      return res.status(400).json({ success: false, message: 'Invalid wallet address' });
    }

    return res.json({
      success: true,
      message: open
        ? 'Open whitelist enabled for this deployment (empty proof)'
        : 'Configure MERKLE / contract rules explicitly for gated mints',
      isWhitelisted: open,
      proof: [],
      walletAddress: wallet,
    });
  } catch (e) {
    console.error('[nft] proof', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /nft/mint-gasless
 */
router.post('/mint-gasless', walletBearerRequired, async (req, res) => {
  try {
    const authWallet = req.walletAddress;
    const { walletAddress, merkleProof, signature } = req.body || {};

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ success: false, message: 'signature is required' });
    }
    if (!walletAddress || String(walletAddress).toLowerCase() !== authWallet) {
      return res.status(400).json({
        success: false,
        message: 'walletAddress must match Bearer token',
      });
    }

    const result = await relayMint({
      walletAddress: authWallet,
      merkleProof: Array.isArray(merkleProof) ? merkleProof : [],
      signature,
    });

    await Player.updateOne({ walletAddress: authWallet }, { $set: { nftPass: true } }).catch(() => {});

    return res.json({
      success: true,
      message: 'Minted on 0G',
      transactionHash: result.transactionHash,
      tokenId: result.tokenId,
      gasPaidByDeployer: true,
      blockNumber: result.blockNumber,
    });
  } catch (e) {
    console.error('[nft] mint-gasless', e?.code || e?.message || e);

    const code = e?.code === 'BAD_SIGNATURE' ? 401 : e?.code === 'RELAYER_UNAVAILABLE' ? 503 : 500;

    return res.status(code).json({
      success: false,
      message: e.message || 'Mint failed',
      code: e.code || undefined,
    });
  }
});

module.exports = router;
