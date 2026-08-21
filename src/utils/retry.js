export async function withRetry(fn, opts = {}) {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 500;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const canRetry = err?.retryable !== false && attempt < retries;
      if (!canRetry) throw err;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 150;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('The AI provider took too long to respond.');
      e.code = 'TIMEOUT';
      e.retryable = true;
      throw e;
    }
    const e = new Error('Network error reaching the AI provider.');
    e.code = 'NETWORK_ERROR';
    e.retryable = true;
    throw e;
  } finally {
    clearTimeout(timer);
  }
    }
