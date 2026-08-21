import * as getCurrentTime from './getCurrentTime.js';

const registry = [getCurrentTime];

export const toolSchemas = registry.map((t) => t.schema);

const byName = new Map(registry.map((t) => [t.schema.name, t]));

export async function executeTool(name, input) {
  const tool = byName.get(name);
  if (!tool) {
    return { error: `Unknown tool "${name}".` };
  }
  try {
    return await tool.execute(input);
  } catch (err) {
    return { error: `Tool "${name}" failed: ${err.message}` };
  }
}
