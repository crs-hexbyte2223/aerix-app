export const schema = {
  name: 'get_current_time',
  description:
    'Get the current date and time, optionally in a specific IANA timezone ' +
    '(e.g. "Asia/Manila", "America/New_York"). Use this whenever the user ' +
    'asks what time or date it is, or needs a timestamp for something.',
  input_schema: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone name. Defaults to UTC if omitted.',
      },
    },
    required: [],
  },
};

export async function execute(input) {
  const timezone = input?.timezone || 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'long',
    });
    return {
      timezone,
      formatted: formatter.format(new Date()),
      iso: new Date().toISOString(),
    };
  } catch {
    return {
      error: `Unknown timezone "${timezone}".`,
      iso: new Date().toISOString(),
    };
  }
}
