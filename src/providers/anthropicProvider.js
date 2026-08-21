import { config } from '../config.js';
import { fetchWithTimeout } from '../utils/retry.js';

export async function createMessage({ model, system, messages, tools }) {
  if (!config.anthropic.apiKey) {
    const err = new Error(
      'Server is missing ANTHROPIC_API_KEY. Add it to server/.env and restart the server.'
    );
    err.code = 'NOT_CONFIGURED';
    err.status = 500;
    err.retryable = false;
    throw err;
  }

  const body = {
    model,
    max_tokens: 1536,
    system,
    messages,
    ...(tools && tools.length ? { tools } : {}),
  };

  const res = await fetchWithTimeout(
    config.anthropic.baseUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropic.apiKey,
        'anthropic-version': config.anthropic.version,
      },
      body: JSON.stringify(body),
    },
    config.requestTimeoutMs
  );

  if (!res.ok) {
    let message = `AI provider returned ${res.status}`;
    try {
      const data = await res.json();
      message = data?.error?.message || message;
    } catch {
      /* ignore parse failure, use default message */
    }
    const err = new Error(message);
    err.status = res.status;
    err.retryable = res.status === 429 || res.status >= 500;
    err.code = res.status === 401 ? 'AUTH_ERROR' : res.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR';
    throw err;
  }

  return res.json();
        }
