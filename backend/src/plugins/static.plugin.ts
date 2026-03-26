import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import path from 'path';

async function staticPlugin(app: FastifyInstance): Promise<void> {
  const uploadDir = process.env.UPLOAD_DIR ?? '/uploads';
  await app.register(fastifyStatic, {
    root: path.resolve(uploadDir),
    prefix: '/uploads/',
    decorateReply: false,
  });
}

export default fp(staticPlugin, { name: 'static' });
