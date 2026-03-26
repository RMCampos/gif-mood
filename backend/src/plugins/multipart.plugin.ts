import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

const TEN_MB = 10 * 1024 * 1024;

async function multipartPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: TEN_MB,
    },
  });
}

export default fp(multipartPlugin, { name: 'multipart' });
