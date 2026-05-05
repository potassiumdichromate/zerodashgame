/**
 * Runner leaderboard anti-cheat: heuristics + optional 0G Compute JSON verdict
 * (pattern from zerogpool leaderboardAntiCheatService).
 */

const { getConfig } = require('./zdashCompute');

const ANTICHEAT_ON = process.env.ZD_ANTICHEAT_ENABLED !== 'false';

const HARD_CAP_SCORE = Math.max(Number(process.env.ZD_ANTICHEAT_HARD_CAP_SCORE || 9_999_999_999), 1_000_000);

const MAX_COINS = Math.max(Number(process.env.ZD_ANTICHEAT_MAX_COINS || 9_999_999_999), 1);

const SCORE_DELTA_ONE_SYNC = Math.max(
  Number(process.env.ZD_ANTICHEAT_SUSPICIOUS_SCORE_DELTA || 400_000),
  5000
);

const COINS_DELTA_ONE_SYNC = Math.max(
  Number(process.env.ZD_ANTICHEAT_SUSPICIOUS_COINS_DELTA || 5_000_000),
  50_000
);

function clampNum(v, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.floor(n)));
}

function classifyDashSuspicion(previous = {}, next = {}) {
  const prevScore = clampNum(previous.highScore ?? previous.score, HARD_CAP_SCORE);
  const nextScore = clampNum(next.highScore ?? next.score, HARD_CAP_SCORE);
  const prevCoins = clampNum(previous.coins, MAX_COINS);
  const nextCoins = clampNum(next.coins, MAX_COINS);

  const suspiciousReasons = [];

  if (nextScore > HARD_CAP_SCORE) suspiciousReasons.push('hard_cap_score');
  if (nextCoins > MAX_COINS) suspiciousReasons.push('hard_cap_coins');

  const dScore = nextScore - prevScore;
  const dCoins = nextCoins - prevCoins;

  /* Skip abrupt delta when syncing from blank save — avoids first-run legitimate PBs looking like spoofing */
  if (prevScore > 0 && dScore > SCORE_DELTA_ONE_SYNC) {
    suspiciousReasons.push('abrupt_score_delta');
  }
  if (prevCoins > 0 && dCoins > COINS_DELTA_ONE_SYNC) {
    suspiciousReasons.push('abrupt_coins_delta');
  }
  if (nextScore < 0 || nextCoins < 0) suspiciousReasons.push('negative_value');

  return {
    suspicious: suspiciousReasons.length > 0,
    suspiciousReasons,
    dScore,
    dCoins,
  };
}

async function verifySuspiciousWithCompute(payload) {
  const cfg = getConfig();
  if (!cfg.apiKey) {
    return { verdict: 'allow', source: 'rules_only', reason: 'missing_api_key' };
  }

  const prompt = [
    'You are an anti-cheat validator for Zerodash endless runner leaderboard.',
    'Return strict JSON only: {"verdict":"allow"|"reject","confidence":0..1,"reason":"short"}',
    'Reject ONLY impossible or highly implausible run progress (instant max score).',
    'If uncertain, verdict allow.',
    `Input JSON: ${JSON.stringify(payload)}`,
  ].join('\n');

  const started = Date.now();
  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.ZD_ANTICHEAT_MODEL || cfg.model,
        messages: [
          { role: 'system', content: 'Output only strict JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 120,
        stream: false,
      }),
      signal: AbortSignal.timeout(Number(process.env.ZD_ANTICHEAT_TIMEOUT_MS || 6000)),
    });

    if (!response.ok) {
      return { verdict: 'allow', source: '0g_compute_error', reason: `http_${response.status}` };
    }

    const body = await response.json().catch(() => null);
    const text = body?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      return { verdict: 'allow', source: '0g_compute_error', reason: 'empty_output' };
    }

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const parsed =
      jsonStart >= 0 && jsonEnd > jsonStart
        ? JSON.parse(text.slice(jsonStart, jsonEnd + 1))
        : JSON.parse(text);

    const verdict = parsed?.verdict === 'reject' ? 'reject' : 'allow';
    const confidence = Number(parsed?.confidence);
    return {
      verdict,
      source: '0g_compute',
      confidence: Number.isFinite(confidence) ? confidence : null,
      reason: typeof parsed?.reason === 'string' ? parsed.reason : 'n/a',
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    console.warn('[zd:anti-cheat] compute failed', err.message);
    return { verdict: 'allow', source: '0g_compute_error', reason: err.message };
  }
}

/**
 * Decide whether /player/game-sync may commit.
 */
async function evaluateDashGameSync({
  walletAddress,
  previous = {},
  proposed = {},
}) {
  if (!ANTICHEAT_ON) {
    return { accepted: true, source: 'disabled', details: {} };
  }

  const details = classifyDashSuspicion(previous, proposed);

  if (!details.suspicious) {
    return { accepted: true, source: 'heuristics', details };
  }

  const compute = await verifySuspiciousWithCompute({
    walletAddress,
    previous,
    proposed,
    heuristics: details,
  });

  if (compute.verdict === 'reject' && compute.source === '0g_compute') {
    return {
      accepted: false,
      source: '0g_compute',
      details,
      compute,
    };
  }

  return {
    accepted: true,
    source: compute.source,
    details,
    compute,
  };
}

module.exports = {
  evaluateDashGameSync,
  classifyDashSuspicion,
};
