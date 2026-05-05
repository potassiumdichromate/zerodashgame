/**
 * Zero Dash × 0G DA — submits gameplay snapshots via the HTTP event gateway
 * (same integration style as zerogpool / highway-hustle).
 */

const { randomUUID } = require('crypto');

const GATEWAY_URL = process.env.ZEROG_DA_GATEWAY_URL || 'https://da.warzonewarriors.xyz';
const SUBMIT_TIMEOUT = 10_000;
const STATUS_TIMEOUT = 8_000;
const RETRIEVE_TIMEOUT = 12_000;
const GAME_ID = 'zeroDash';

const getBearer = () =>
  (process.env.ZEROG_DA_API_TOKEN || process.env.ZEROG_DA_API_KEY || '').trim();

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const bearer = getBearer();
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return headers;
};

const isEnabled = () => process.env.ZEROG_DA_ENABLED !== 'false';

const summarizeId = (id) => {
  const s = String(id || '');
  if (s.length <= 14) return s || '(empty)';
  return `${s.slice(0, 10)}…${s.slice(-4)}`;
};

const logStartup = () => {
  console.log('[zd:0g-da] config', {
    gatewayUrl: GATEWAY_URL,
    eventsUrl: `${GATEWAY_URL.replace(/\/+$/, '')}/v1/events`,
    game: GAME_ID,
    bearerSet: Boolean(getBearer()),
    enabled: isEnabled(),
  });
};
logStartup();

const buildDashPayload = (walletAddress, doc) => {
  const plain = doc?.toObject ? doc.toObject() : { ...(doc || {}) };
  return {
    walletAddress,
    playerName:
      plain.playerName ||
      (plain.walletAddress ? `${String(plain.walletAddress).slice(0, 6)}…` : 'runner'),
    highScore: Number(plain.highScore) || 0,
    coins: Number(plain.coins) || 0,
    characters: plain.characters || {},
    nftPass: Boolean(plain.nftPass),
    dailyReward: plain.dailyReward || null,
    recordedAt: new Date().toISOString(),
  };
};

const submitEvent = async (eventName, walletAddress, data) => {
  if (!isEnabled()) return null;
  const bearer = getBearer();
  if (!bearer) {
    console.warn('[zd:0g-da] skipped submit — missing ZEROG_DA_API_TOKEN / ZEROG_DA_API_KEY');
    return null;
  }

  const eventId = randomUUID();
  const postUrl = `${GATEWAY_URL.replace(/\/+$/, '')}/v1/events`;
  const body = JSON.stringify({
    eventId,
    game: GAME_ID,
    event: eventName,
    data,
  });

  try {
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: getHeaders(),
      body,
      signal: AbortSignal.timeout(SUBMIT_TIMEOUT),
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.warn('[zd:0g-da] submit http error', {
        status: res.status,
        event: eventName,
        wallet: summarizeId(walletAddress),
        snippet: text.slice(0, 200),
      });
      return null;
    }
    let json = {};
    try {
      json = JSON.parse(text);
    } catch (_) {
      /* ignore */
    }
    console.log('[zd:0g-da] submitted', {
      event: eventName,
      wallet: summarizeId(walletAddress),
      eventId,
      accepted: json.accepted !== false,
    });
    return { eventId };
  } catch (err) {
    console.warn('[zd:0g-da] submit failed', { event: eventName, message: err.message });
    return null;
  }
};

const submitSessionLogin = (walletAddress, playerDoc) =>
  submitEvent(
    'session.login',
    walletAddress,
    buildDashPayload(walletAddress, playerDoc)
  );

const submitBestScore = (walletAddress, playerDoc) =>
  submitEvent(
    'score.best',
    walletAddress,
    buildDashPayload(walletAddress, playerDoc)
  );

const submitPlayerSave = (walletAddress, playerDoc, trigger = 'player.save') =>
  submitEvent('player.save', walletAddress, {
    ...buildDashPayload(walletAddress, playerDoc),
    trigger,
  });

const getEventStatus = async (eventId) => {
  if (!eventId) return null;
  const bearer = getBearer();
  if (!bearer) return null;
  try {
    const res = await fetch(
      `${GATEWAY_URL.replace(/\/+$/, '')}/v1/da/status/${encodeURIComponent(eventId)}`,
      { headers: getHeaders(), signal: AbortSignal.timeout(STATUS_TIMEOUT) }
    );
    if (!res.ok) {
      if (res.status === 404) return { found: false };
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[zd:0g-da] status check failed', { eventId: summarizeId(eventId), message: err.message });
    return null;
  }
};

const retrievePlayerEvent = async (eventId) => {
  if (!eventId) return { retrieved: false, reason: 'no_event_id' };
  const bearer = getBearer();
  if (!bearer) return { retrieved: false, reason: 'no_bearer' };
  try {
    const res = await fetch(
      `${GATEWAY_URL.replace(/\/+$/, '')}/v1/da/retrieve/${encodeURIComponent(eventId)}`,
      {
        method: 'POST',
        headers: getHeaders(),
        signal: AbortSignal.timeout(RETRIEVE_TIMEOUT),
      }
    );
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return { retrieved: false, reason: 'not_finalized_yet', daStatus: body.daStatus };
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { retrieved: false, reason: body.message || `gateway_${res.status}` };
    }
    const doc = await res.json();
    let data = null;
    if (doc.retrieved?.dataBase64) {
      try {
        data = JSON.parse(Buffer.from(doc.retrieved.dataBase64, 'base64').toString('utf-8'));
      } catch (_) {
        data = doc.retrieved.dataBase64;
      }
    }
    return { retrieved: true, eventId: doc.eventId, daBlobInfo: doc.daBlobInfo, data };
  } catch (err) {
    return { retrieved: false, reason: err.message };
  }
};

const healthCheck = async () => {
  try {
    const res = await fetch(`${GATEWAY_URL.replace(/\/+$/, '')}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.json().catch(() => ({}));
    return { gateway: GATEWAY_URL, online: !!body.ready, ...body };
  } catch (err) {
    return { gateway: GATEWAY_URL, online: false, error: err.message };
  }
};

module.exports = {
  submitSessionLogin,
  submitBestScore,
  submitPlayerSave,
  getEventStatus,
  retrievePlayerEvent,
  healthCheck,
  isEnabled,
  getGatewayUrl: () => GATEWAY_URL.replace(/\/+$/, ''),
};
