import { config, resolveModel } from '../config.js';
import { createMessage } from '../providers/anthropicProvider.js';
import { toolSchemas, executeTool } from '../tools/index.js';
import { withRetry } from '../utils/retry.js';

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const trimmed = history.slice(-config.maxHistoryMessages);
  return trimmed
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
}

export async function generateReply({ modelKey, history }) {
  const model = resolveModel(modelKey);
  let messages = sanitizeHistory(history);

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    const err = new Error('The conversation must end with a user message.');
    err.status = 400;
    err.code = 'BAD_REQUEST';
    err.retryable = false;
    throw err;
  }

  const toolsUsed = [];

  for (let iteration = 0; iteration < config.maxToolIterations; iteration++) {
    const response = await withRetry(
      () =>
        createMessage({
          model,
          system: config.systemPrompt,
          messages,
          tools: toolSchemas,
        }),
      { retries: config.maxRetries }
    );

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

      messages = [...messages, { role: 'assistant', content: response.content }];

      const toolResults = [];
      for (const block of toolUseBlocks) {
        toolsUsed.push(block.name);
        const result = await executeTool(block.name, block.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages = [...messages, { role: 'user', content: toolResults }];
      continue;
    }

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return { text: text || "I wasn't able to generate a response for that.", model, toolsUsed };
  }

  const err = new Error('AERIX made too many tool calls without reaching an answer.');
  err.status = 502;
  err.code = 'TOOL_LOOP_EXCEEDED';
  err.retryable = false;
  throw err;
      }
