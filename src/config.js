import 'dotenv/config';

// Central place for all environment-driven configuration. Nothing in this
// file ever reaches the browser — it's only imported by server-side code.

const apiKey = process.env.ANTHROPIC_API_KEY || '';

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] ANTHROPIC_API_KEY is not set. /api/chat will respond with a ' +
    'configuration error until you add it to server/.env'
  );
}

export const config = {
  port: Number(process.env.PORT || 8787),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  anthropic: {
    apiKey,
    baseUrl: 'https://api.anthropic.com/v1/messages',
    version: '2023-06-01',
  },

  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
  maxRetries: Number(process.env.MAX_RETRIES || 2),
  maxToolIterations: 3,

  // Trim conversation history sent to the model so long chats stay fast
  // and cheap. The frontend can still keep the full history for display.
  maxHistoryMessages: 24,

  systemPrompt:
    "You are AERIX, a helpful, precise, and conversational AI assistant. " +
    "Give accurate, well-structured answers. Use short paragraphs, bullet " +
    "points, or numbered steps where that improves clarity. Ask a brief " +
    "clarifying question only when the request is genuinely ambiguous — " +
    "otherwise make a reasonable assumption and answer directly. When you " +
    "use a tool, weave the result naturally into your answer rather than " +
    "just repeating raw tool output.",

  // Public AERIX model names (shown in the UI) mapped to real provider
  // models. This is the one place to touch when you want AERIX's branding
  // to point at a different underlying model.
  modelMap: {
    'aerix-v0.1-basic': process.env.AERIX_MODEL_BASIC || 'claude-haiku-4-5-20251001',
    'claude-sonnet-5': 'claude-sonnet-5',
    'claude-opus-4-8': 'claude-opus-4-8',
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  },
  defaultModelKey: 'aerix-v0.1-basic',
};

export function resolveModel(modelKey) {
  return config.modelMap[modelKey] || config.modelMap[config.defaultModelKey];
}
