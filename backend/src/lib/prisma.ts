import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectDB(app: FastifyInstance): Promise<void> {
  await prisma.$connect();
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
}
