const Player = require('../models/Player');

const HEADER_SIZE = 13;
const MAGIC = 'ZDSV';

const nextDailyRewardUtc = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

function ensureBuffer(binary) {
  if (Buffer.isBuffer(binary)) return binary;
  if (binary instanceof Uint8Array) {
    return Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength);
  }
  throw new Error('binary_buffer_required');
}

function parseUnityBinarySave(binary) {
  const buffer = ensureBuffer(binary);

  if (buffer.length < HEADER_SIZE) {
    throw new Error('binary_save_too_small');
  }

  const magic = buffer.subarray(0, 4).toString('ascii');
  if (magic !== MAGIC) {
    throw new Error(`binary_save_unknown_magic:${magic || 'empty'}`);
  }

  const versionByte = buffer[4];
  const primaryValue = buffer.readUInt32LE(5);
  const secondaryValue = buffer.readUInt32LE(9);
  const trailingZeros = buffer.subarray(13).every((byte) => byte === 0);

  return {
    kind: 'unity-custom-save-header',
    magic,
    versionByte,
    primaryValue,
    secondaryValue,
    coins: primaryValue,
    highScore: secondaryValue,
    bestScore: secondaryValue,
    trailingZeros,
    byteLength: buffer.length,
    interpretation:
      'This looks like a tiny custom Unity save header, not a full gameplay snapshot.',
    likelyMeaning:
      'Possible layout: magic "ZDSV", serializer/schema byte 1, coins value, best-score value, then empty/default zero-filled fields.',
    caution:
      'Field names are inferred from byte layout, not from the original Unity serializer.',
  };
}

async function syncPlayerFromUnityBinarySave({ walletAddress, binary }) {
  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new Error('wallet_address_required');
  }

  const parsed = parseUnityBinarySave(binary);
  const normalizedWallet = walletAddress.toLowerCase();

  let player = await Player.findOne({ walletAddress: normalizedWallet });
  if (!player) {
    player = await Player.create({
      walletAddress: normalizedWallet,
      dailyReward: { nextRewardAt: nextDailyRewardUtc() },
    });
  }

  player.coins = Number(parsed.coins) || 0;
  player.highScore = Number(parsed.highScore) || 0;
  player.statsMeta = player.statsMeta || {};
  player.statsMeta.totalSyncs = (player.statsMeta.totalSyncs || 0) + 1;
  player.statsMeta.lastSyncAt = new Date();

  await player.save();

  return { player, parsed };
}

module.exports = {
  parseUnityBinarySave,
  syncPlayerFromUnityBinarySave,
};
