import { Router } from 'express';
import { generateReply } from '../services/aiService.js';

export const chatRouter = Router();

chatRouter.post('/chat', async (req, res) => {
  const { model, messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: { message: '"messages" must be a non-empty array.', code: 'BAD_REQUEST' },
    });
  }

  try {
    const result = await generateReply({ modelKey: model, history: messages });
    res.json({
      content: result.text,
      model: result.model,
      toolsUsed: result.toolsUsed,
    });
  } catch (err) {
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[chat] ${code}:`, err.message);
    res.status(status).json({
      error: { message: err.message || 'Something went wrong generating a reply.', code },
    });
  }
});
