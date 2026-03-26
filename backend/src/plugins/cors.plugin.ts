import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

async function corsPlugin(app: FastifyInstance): Promise<void> {
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  await app.register(fastifyCors, {
    origin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}

export default fp(corsPlugin, { name: 'cors' });
