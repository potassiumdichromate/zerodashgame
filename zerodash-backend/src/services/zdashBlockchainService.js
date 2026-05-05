/**
 * Optional 0G EVM anchoring — call a lightweight session logger contract after strong runs.
 *
 * Deploy (or reuse) any contract exposing:
 *   recordSession(address player, uint256 highScore, uint256 coins, uint256 ts)
 */

const { ethers } = require('ethers');

let provider;
let signer;
let contract;
let ready = false;
let initAttempted = false;

const SESSION_ABI = [
  'function recordSession(address player, uint256 highScore, uint256 coins, uint256 ts) external',
];

async function lazyInit() {
  if (initAttempted) return ready;
  initAttempted = true;

  const rpc =
    process.env.ZDASH_CHAIN_RPC_URL ||
    process.env.BLOCKCHAIN_RPC_URL ||
    process.env.OG_RPC_URL ||
    '';

  const pk =
    process.env.ZDASH_OPERATOR_PRIVATE_KEY ||
    process.env.OPERATOR_PRIVATE_KEY ||
    '';

  const addr = (
    process.env.ZDASH_SESSION_CONTRACT_ADDRESS ||
    process.env.CONTRACT_ADDRESS ||
    ''
  ).trim();

  if (!rpc || !pk || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    ready = false;
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(rpc.trim());
    signer = new ethers.Wallet(pk.trim(), provider);
    contract = new ethers.Contract(addr, SESSION_ABI, signer);
    ready = true;
    console.log('[zd:chain] Session logger ready', { contract: addr });
    return true;
  } catch (e) {
    console.warn('[zd:chain] init failed — on-chain anchoring disabled', e.message);
    ready = false;
    return false;
  }
}

function isReady() {
  return ready && Boolean(contract && signer);
}

async function recordDashSession(walletAddress, highScore, coins) {
  await lazyInit();
  if (!isReady()) return null;

  const player = ethers.getAddress(walletAddress);
  const hs = BigInt(Math.max(0, Math.floor(Number(highScore) || 0)));
  const c = BigInt(Math.max(0, Math.floor(Number(coins) || 0)));
  const ts = BigInt(Math.floor(Date.now() / 1000));

  try {
    const tx = await contract.recordSession(player, hs, c, ts);
    const receipt = await tx.wait();
    console.log('[zd:chain] recordSession ✓', { hash: receipt.hash, blockNumber: receipt.blockNumber });
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString?.() ?? null,
    };
  } catch (e) {
    console.warn('[zd:chain] recordSession ✗', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = {
  lazyInit,
  recordDashSession,
  isReady,
};
