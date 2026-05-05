const express = require('express');
const rateLimit = require('express-rate-limit');
const { mikeChat, computeHealthSummary } = require('../services/zdashCompute');
const zerogDAService = require('../services/zerogDAService');
const { walletBearerOptional } = require('../middleware/walletBearer');

const router = express.Router();

const daStatusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.ZEROG_DA_STATUS_RATE_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ZEROG_CHAT_RATE_LIMIT_PER_15MIN || 40),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /zerog/chat — Mike (OpenAI-compatible response)
 * Body: { messages: [{ role, content }], temperature?, max_tokens? }
 */
router.post('/chat', chatLimiter, walletBearerOptional, async (req, res) => {
  try {
    const { messages, temperature, max_tokens: maxTokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages[] required', error: { type: 'invalid_request' } });
    }

    const normalized = messages
      .slice(-24)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'))
      .map((m) => ({ role: m.role, content: String(m.content ?? '') }));

    if (!normalized.some((m) => m.role === 'user')) {
      return res.status(400).json({ message: 'At least one user message required' });
    }

    const augmented = [...normalized];

    const result = await mikeChat({
      messages: augmented,
      temperature,
      maxTokens,
    });

    if (!result.ok) {
      return res.status(result.phase === 'no_api_key' ? 503 : 502).json({
        error: { message: result.error || result.phase },
        inference: { provider: '0g_compute', ok: false, phase: result.phase },
      });
    }

    return res.json({
      id: `chatcmpl-zdash-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model || 'zdash',
      inference: {
        provider: '0g_compute',
        ok: true,
        latencyMs: result.latencyMs,
      },
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.text,
          },
          finish_reason: 'stop',
        },
      ],
    });
  } catch (e) {
    console.error('[zerog] chat', e);
    return res.status(500).json({ message: 'Chat error', error: { message: String(e.message) } });
  }
});

router.get('/health', async (_req, res) => {
  try {
    const [daGateway, compute] = await Promise.all([
      zerogDAService.healthCheck(),
      Promise.resolve(computeHealthSummary()),
    ]);

    res.json({
      ok: true,
      daGateway,
      compute,
      daConfigured: zerogDAService.isEnabled() && Boolean(
        process.env.ZEROG_DA_API_TOKEN ||
          process.env.ZEROG_DA_API_KEY ||
          ''
      ),
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e.message) });
  }
});

router.get('/da/status/:eventId', daStatusLimiter, async (req, res) => {
  try {
    const eventId = (req.params.eventId || '').toString().trim();
    if (!eventId || eventId.length > 200) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
    const status = await zerogDAService.getEventStatus(eventId);
    res.json(status || { ok: false, message: 'unavailable_or_no_gateway_token' });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e.message) });
  }
});

module.exports = router;
