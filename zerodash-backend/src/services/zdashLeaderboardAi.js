/**
 * Zerodash leaderboard one-liners via 0G Compute — Zero Pool–style spectator copy.
 */

const { getConfig } = require('./zdashCompute');

function compactPlayer(p = {}) {
  return {
    wallet: p.walletAddress ? `${p.walletAddress.slice(0, 6)}…${p.walletAddress.slice(-4)}` : null,
    highScore: Number(p.highScore) || 0,
    coins: Number(p.coins) || 0,
  };
}

function isCleanComment(text) {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 12 || t.length > 520) return false;
  if (t.startsWith('{') || t.startsWith('[')) return false;
  return true;
}

async function generateDashLeaderboardAiComment(currentDoc, topDoc) {
  const cfg = getConfig();
  if (!cfg.apiKey) {
    return { comment: null, inferenceSource: null, meta: { reason: 'missing_api_key' } };
  }

  const payload = {
    you: compactPlayer(currentDoc),
    leaderboardTop: compactPlayer(topDoc),
  };

  const messages = [
    {
      role: 'system',
      content:
        'You hype runners in Zerodash — a futuristic endless runner on 0G. ' +
        'Given the current player versus the global #1 runner (high scores), write ONE playful line comparing their gap OR celebrate if they are #1. ' +
        'No markdown, hashtags, JSON, or player-identifying full addresses — use "you" and "the leader". ' +
        'Under 32 words.',
    },
    { role: 'user', content: JSON.stringify(payload) },
  ];

  const started = Date.now();
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.ZD_LEADERBOARD_AI_MODEL || cfg.model,
        messages,
        temperature: 0.75,
        max_tokens: 120,
        stream: false,
      }),
      signal: AbortSignal.timeout(Number(process.env.ZD_LEADERBOARD_AI_TIMEOUT_MS || 12_000)),
    });

    const latencyMs = Date.now() - started;
    const body = await res.json().catch(() => null);
    const text = body?.choices?.[0]?.message?.content;

    if (!res.ok || typeof text !== 'string') {
      return {
        comment: null,
        inferenceSource: null,
        meta: { reason: `http_${res.status}`, latencyMs },
      };
    }

    const trimmed = text.trim();
    if (!isCleanComment(trimmed)) {
      return {
        comment: null,
        inferenceSource: null,
        meta: { reason: 'invalid_output_shape', latencyMs },
      };
    }

    return {
      comment: trimmed,
      inferenceSource: '0g_compute',
      meta: { latencyMs },
    };
  } catch (e) {
    return {
      comment: null,
      inferenceSource: null,
      meta: { reason: String(e.message) },
    };
  }
}

module.exports = { generateDashLeaderboardAiComment };
