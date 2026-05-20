const express = require('express');
const rateLimit = require('express-rate-limit');
const { createHash } = require('crypto');
const Player = require('../models/Player');
const zerogDAService = require('../services/zerogDAService');
const { walletFromBrowserJwt } = require('../services/privyWallet');
const { walletBearerRequired } = require('../middleware/walletBearer');
const { evaluateDashGameSync } = require('../services/dashAntiCheatService');
const { generateDashLeaderboardAiComment } = require('../services/zdashLeaderboardAi');
const zdashBlockchain = require('../services/zdashBlockchainService');
const {
  syncPlayerFromUnityBinarySave,
} = require('../services/unityBinarySaveService');

const router = express.Router();

const aiCommentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ZD_LEADERBOARD_AI_RATE_LIMIT || 45),
  standardHeaders: true,
  legacyHeaders: false,
});

const binarySaveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.ZD_BINARY_SAVE_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
});

const binarySaveBodyParser = express.raw({
  type: () => true,
  limit: process.env.ZD_BINARY_SAVE_MAX_BYTES || '256kb',
});

const queueDA = (trigger, eventType, playerId, walletAddress, submitFn) => {
  setImmediate(async () => {
    try {
      const result = await submitFn();
      if (!result?.eventId) return;
      const entry = {
        eventId: result.eventId,
        eventType,
        daStatus: 'submitted',
        submittedAt: new Date(),
        trigger,
      };
      await Player.findByIdAndUpdate(playerId, {
        $set: {
          daSnapshot: {
            ...entry,
            snapshotAt: new Date(),
          },
        },
        $push: {
          daEvents: { $each: [entry], $slice: -50 },
        },
      });
      console.log(
        `[zd:0g-da] queued mongodb wallet=${walletAddress} eventId=${entry.eventId} trigger=${trigger}`
      );
    } catch (err) {
      console.warn('[zd:0g-da] background queue failed', err.message);
    }
  });
};

const nextDailyRewardUtc = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const toProfileDto = (doc) => {
  const plain = doc?.toObject ? doc.toObject() : { ...(doc || {}) };
  const saveBackedBy0g = Boolean(plain.daSnapshot?.eventId);

  const out = {
    walletAddress: plain.walletAddress,
    highScore: plain.highScore ?? 0,
    coins: plain.coins ?? 0,
    characters: plain.characters || { unlocked: ['HERO1'], currentIndex: 0 },
    dailyReward: plain.dailyReward || { nextRewardAt: null },
    nftPass: Boolean(plain.nftPass),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    zerogTrust: {
      saveBackedBy0g,
      lastDaEventId: plain.daSnapshot?.eventId || null,
    },
    antiCheat: {
      source: plain.antiCheatSnapshot?.source || null,
      verdict: plain.antiCheatSnapshot?.verdict || null,
      checkedAt: plain.antiCheatSnapshot?.checkedAt || null,
    },
    blockchain: plain.lastBlockchainSync?.transactionHash
      ? {
          lastTxHash: plain.lastBlockchainSync.transactionHash,
          lastBlockNumber: plain.lastBlockchainSync.blockNumber ?? null,
          syncedAt: plain.lastBlockchainSync.syncedAt || null,
        }
      : null,
    statsMeta: {
      lastSyncAt: plain.statsMeta?.lastSyncAt || null,
      totalSyncs: plain.statsMeta?.totalSyncs ?? 0,
    },
  };

  return out;
};

router.post('/profile', async (req, res) => {
  try {
    const { jwt } = req.body || {};
    if (!jwt || typeof jwt !== 'string') {
      return res.status(400).json({ message: 'jwt is required' });
    }

    const walletAddress = await walletFromBrowserJwt(jwt);
    let player = await Player.findOne({ walletAddress });
    let created = false;
    if (!player) {
      player = await Player.create({
        walletAddress,
        dailyReward: { nextRewardAt: nextDailyRewardUtc() },
      });
      created = true;
      queueDA('bootstrap.jwt', 'session.login', player._id, walletAddress, () =>
        zerogDAService.submitSessionLogin(walletAddress, player));
    }

    return res.status(created ? 201 : 200).json(toProfileDto(player));
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('privy_not_configured')) {
      return res.status(503).json({ message: 'Privy is not configured on this server' });
    }
    if (msg.startsWith('privy_resolve_failed') || msg === 'wallet_not_found_on_privy_user') {
      return res.status(401).json({ message: 'Invalid or unrecognized JWT', detail: msg });
    }
    console.error('[player] POST profile', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', walletBearerRequired, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;
    let player = await Player.findOne({ walletAddress });
    let created = false;
    if (!player) {
      player = await Player.create({
        walletAddress,
        dailyReward: { nextRewardAt: nextDailyRewardUtc() },
      });
      created = true;
      queueDA('bootstrap.get', 'session.login', player._id, walletAddress, () =>
        zerogDAService.submitSessionLogin(walletAddress, player));
    }
    return res.status(created ? 201 : 200).json(toProfileDto(player));
  } catch (e) {
    console.error('[player] GET profile', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/save/binary',
  binarySaveLimiter,
  walletBearerRequired,
  binarySaveBodyParser,
  async (req, res) => {
    try {
      const walletAddress = req.walletAddress;
      const binary =
        Buffer.isBuffer(req.body)
          ? req.body
          : req.body instanceof Uint8Array
            ? Buffer.from(req.body.buffer, req.body.byteOffset, req.body.byteLength)
            : Buffer.alloc(0);

      if (!binary.length) {
        return res.status(400).json({
          success: false,
          message: 'Binary save payload required',
        });
      }

      const checksumSha256 = createHash('sha256').update(binary).digest('hex');

      res.set({
        'Access-Control-Expose-Headers': 'X-Checksum-Sha256,X-Save-Bytes',
        'X-Checksum-Sha256': checksumSha256,
        'X-Save-Bytes': String(binary.length),
      });

      const responseBody = {
        success: true,
        accepted: true,
        walletAddress,
        byteLength: binary.length,
        checksumSha256,
      };

      res.status(200).json(responseBody);

      setImmediate(async () => {
        try {
          const { player, parsed } = await syncPlayerFromUnityBinarySave({
            walletAddress,
            binary,
          });

          queueDA('save-binary', 'player.save.binary', player._id, walletAddress, () =>
            zerogDAService.submitPlayerSave(walletAddress, player, 'save-binary')
          );

          console.log('[player] save/binary post-response sync ok', {
            walletAddress,
            coins: parsed.coins,
            highScore: parsed.highScore,
            byteLength: parsed.byteLength,
          });
        } catch (err) {
          console.warn('[player] save/binary post-response sync failed', {
            walletAddress,
            message: err.message,
          });
        }
      });
    } catch (e) {
      console.error('[player] save/binary', e);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

/**
 * POST /player/game-sync
 */
router.post('/game-sync', walletBearerRequired, async (req, res) => {
  try {
    const walletAddress = req.walletAddress;
    const body = req.body || {};
    const highScoreRaw = Number(body.highScore ?? body.score);
    const coinsRaw = body.coins != null ? Number(body.coins) : NaN;

    let player = await Player.findOne({ walletAddress });
    if (!player) {
      player = await Player.create({
        walletAddress,
        dailyReward: { nextRewardAt: nextDailyRewardUtc() },
      });
      queueDA('bootstrap.gamesync', 'session.login', player._id, walletAddress, () =>
        zerogDAService.submitSessionLogin(walletAddress, player));
    }

    const prevHs = Number(player.highScore) || 0;
    const prevCoins = Number(player.coins) || 0;

    let nextHs = prevHs;
    let nextCoins = prevCoins;

    if (!Number.isNaN(highScoreRaw) && Number.isFinite(highScoreRaw)) {
      nextHs = Math.max(prevHs, Math.floor(highScoreRaw));
    }
    if (!Number.isNaN(coinsRaw) && Number.isFinite(coinsRaw) && coinsRaw >= 0) {
      nextCoins = Math.floor(coinsRaw);
    }

    const evaluation = await evaluateDashGameSync({
      walletAddress,
      previous: { highScore: prevHs, coins: prevCoins },
      proposed: { highScore: nextHs, coins: nextCoins },
    });

    if (!evaluation.accepted) {
      console.warn('[zd:anti-cheat] reject', walletAddress, evaluation?.compute?.reason);
      return res.status(422).json({
        success: false,
        code: 'ANTICHEAT_REJECT',
        message: 'Run rejected by Zerodash anti-cheat (0G compute + rules)',
        inference: evaluation.compute || {},
        hints: evaluation.details || {},
      });
    }

    const daBest = nextHs > prevHs;

    player.highScore = nextHs;
    player.coins = nextCoins;

    if (body.characters && typeof body.characters === 'object') {
      const cur =
        player.characters &&
        typeof player.characters.toObject === 'function'
          ? player.characters.toObject()
          : { ...(player.characters || {}) };
      player.characters = { ...cur, ...body.characters };
    }

    player.antiCheatSnapshot = {
      source: evaluation.compute?.source || evaluation.source || 'heuristics',
      verdict: evaluation.compute?.verdict || 'allow',
      checkedAt: new Date(),
      details: {
        suspicious: evaluation.details?.suspicious || false,
        reasons: evaluation.details?.suspiciousReasons || [],
      },
    };

    player.statsMeta = player.statsMeta || {};
    player.statsMeta.totalSyncs = (player.statsMeta.totalSyncs || 0) + 1;
    player.statsMeta.lastSyncAt = new Date();

    await player.save();

    queueDA(
      'game-sync',
      daBest ? 'score.best' : 'player.save',
      player._id,
      walletAddress,
      async () =>
        daBest
          ? zerogDAService.submitBestScore(walletAddress, player)
          : zerogDAService.submitPlayerSave(walletAddress, player, 'game-sync')
    );

    const minChainScore = Number(process.env.ZDASH_CHAIN_MIN_HIGHSCORE ?? 50_000);

    let blockchainBump = null;
    if (
      daBest &&
      nextHs >= minChainScore &&
      process.env.ZDASH_CHAIN_ON_PB !== 'false'
    ) {
      setImmediate(async () => {
        const chainOut = await zdashBlockchain.recordDashSession(walletAddress, nextHs, nextCoins);
        if (chainOut?.success && chainOut.transactionHash) {
          await Player.updateOne(
            { _id: player._id },
            {
              $set: {
                lastBlockchainSync: {
                  transactionHash: chainOut.transactionHash,
                  blockNumber: Number(chainOut.blockNumber) || 0,
                  syncedAt: new Date(),
                  success: true,
                },
              },
            }
          ).catch(() => {});
        }
      });
      blockchainBump = { queued: true, minHighScore: minChainScore };
    }

    return res.json({
      success: true,
      antiCheat: {
        accepted: true,
        source: evaluation.compute?.source || evaluation.source || 'heuristics',
        suspicious: evaluation.details?.suspicious || false,
      },
      ...(blockchainBump ? { blockchain: blockchainBump } : {}),
      ...toProfileDto(player),
    });
  } catch (e) {
    console.error('[player] game-sync', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
    const rows = await Player.find()
      .select('walletAddress highScore daSnapshot antiCheatSnapshot')
      .sort({ highScore: -1 })
      .limit(limit)
      .lean();

    const out = rows.map((r) => ({
      walletAddress: r.walletAddress,
      highScore: r.highScore || 0,
      trust: {
        saveBackedBy0g: Boolean(r.daSnapshot?.eventId),
        antiCheatSource: r.antiCheatSnapshot?.source || null,
      },
    }));

    res.json(out);
  } catch (e) {
    console.error('[player] leaderboard', e);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /player/leaderboard/ai-comment?wallet=0x…
 */
router.get('/leaderboard/ai-comment', aiCommentLimiter, async (req, res) => {
  try {
    const raw = (req.query.wallet || '').toString().trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(raw)) {
      return res.status(400).json({ success: false, message: 'wallet query param required (0x…40 hex)' });
    }

    const current = await Player.findOne({ walletAddress: raw }).lean();
    if (!current) {
      return res.status(404).json({ success: false, message: 'Player not found — play once & sync scores' });
    }

    const [top] = await Player.find().sort({ highScore: -1 }).limit(1).lean();
    if (!top) {
      return res.json({ success: true, comment: null, _meta: { source: null, reason: 'no_leaderboard' } });
    }

    const { comment, inferenceSource, meta } = await generateDashLeaderboardAiComment(current, top);

    res.json({
      success: true,
      comment,
      _meta: { source: inferenceSource, ...(meta || {}) },
    });
  } catch (e) {
    console.error('[player] leaderboard/ai-comment', e);
    res.json({ success: true, comment: null, _meta: { source: null, reason: 'error' } });
  }
});

module.exports = router;
