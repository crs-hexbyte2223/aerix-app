import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { chatRouter } from './routes/chat.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// Lets the frontend show a real "Connected / Offline" status instead of
// guessing, and reports (without leaking) whether an API key is set.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    configured: Boolean(config.anthropic.apiKey),
  });
});

app.use('/api', chatRouter);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: { message: 'Unexpected server error.', code: 'INTERNAL_ERROR' } });
});

app.listen(config.port, () => {
  console.log(`AERIX backend listening on http://localhost:${config.port}`);
  if (!config.anthropic.apiKey) {
    console.warn('  ⚠  ANTHROPIC_API_KEY not set — copy .env.example to .env and add your key.');
  }
});
    
