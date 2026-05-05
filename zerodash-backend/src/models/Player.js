const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    highScore: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    characters: {
      unlocked: { type: [String], default: ['HERO1'] },
      currentIndex: { type: Number, default: 0 },
    },
    dailyReward: {
      nextRewardAt: { type: Date, default: null },
      lastClaimedAt: { type: Date, default: null },
    },
    nftPass: { type: Boolean, default: false },
    daSnapshot: {
      eventId: { type: String, default: null },
      daStatus: { type: String, default: null },
      submittedAt: { type: Date, default: null },
      trigger: { type: String, default: null },
    },
    daEvents: [
      {
        eventId: String,
        eventType: String,
        daStatus: String,
        submittedAt: Date,
        trigger: String,
      },
    ],
    antiCheatSnapshot: {
      source: { type: String, default: null },
      verdict: { type: String, default: null },
      checkedAt: { type: Date, default: null },
      details: mongoose.Schema.Types.Mixed,
    },
    lastBlockchainSync: {
      transactionHash: { type: String, default: null },
      blockNumber: { type: Number, default: null },
      syncedAt: { type: Date, default: null },
      success: { type: Boolean, default: null },
    },
    statsMeta: {
      lastSyncAt: { type: Date, default: null },
      totalSyncs: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Player || mongoose.model('Player', PlayerSchema);
