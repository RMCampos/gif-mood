import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';

import corsPlugin from './plugins/cors.plugin';
import authPlugin from './plugins/auth.plugin';
import multipartPlugin from './plugins/multipart.plugin';
import staticPlugin from './plugins/static.plugin';
import rateLimitPlugin from './plugins/rate-limit.plugin';

import authRoutes from './routes/auth/auth.routes';
import userRoutes from './routes/users/users.routes';
import uploadRoutes from './routes/uploads/uploads.routes';
import giphyRoutes from './routes/giphy/giphy.routes';
import postRoutes from './routes/posts/posts.routes';
import shareRoutes from './routes/shares/shares.routes';

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // Plugins
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(multipartPlugin);
  await app.register(staticPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(uploadRoutes, { prefix: '/uploads' });
  await app.register(giphyRoutes, { prefix: '/giphy' });
  await app.register(postRoutes, { prefix: '/posts' });
  await app.register(shareRoutes, { prefix: '/shares' });

  // Health check
  app.get('/health', { config: { rateLimit: false } }, async () => ({ status: 'ok' }));

  return app;
}

export default buildApp;
