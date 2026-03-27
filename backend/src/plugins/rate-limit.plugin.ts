import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function rateLimitPlugin(app: FastifyInstance): Promise<void> {
  const globalMax = readPositiveInt(process.env.RATE_LIMIT_MAX, 120);
  const globalWindow = process.env.RATE_LIMIT_TIME_WINDOW ?? '1 minute';
  const banAfter = readPositiveInt(process.env.RATE_LIMIT_BAN_AFTER, 5);

  await app.register(fastifyRateLimit, {
    global: true,
    max: globalMax,
    timeWindow: globalWindow,
    ban: banAfter,
    // Ensure users behind proxies are still limited per originating IP.
    keyGenerator: (request) => request.ip,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: context.statusCode,
      error: 'Too Many Requests',
      message: context.ban
        ? 'Too many requests from this client; temporarily blocked'
        : 'Rate limit exceeded, please retry later',
    }),
  });
}

export default fp(rateLimitPlugin, { name: 'rate-limit' });
