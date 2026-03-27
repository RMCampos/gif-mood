import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { validateDto } from '../../lib/validate';
import { CreateShareDto } from '../../dtos/share.dto';

interface ShareTokenParams {
  token: string;
}

interface PaginationQuery {
  cursor?: string;
  take?: string;
}

export default async function shareRoutes(app: FastifyInstance): Promise<void> {
  // GET /shares/me — get current share link status (protected)
  app.get(
    '/me',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
    const shareLink = await prisma.shareLink.findUnique({
      where: { userId: request.user.sub },
    });
    return reply.send({ shareLink: shareLink ?? null });
    },
  );

  // POST /shares — create or regenerate share link (protected)
  app.post(
    '/',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = await validateDto(CreateShareDto, request.body, reply);
    if (!dto) return;

    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt <= new Date()) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'expiresAt must be in the future' });
    }

    const shareToken = uuidv4();
    const shareLink = await prisma.shareLink.upsert({
      where: { userId: request.user.sub },
      update: { shareToken, expiresAt },
      create: { userId: request.user.sub, shareToken, expiresAt },
    });

    return reply.status(201).send({ shareLink });
    },
  );

  // DELETE /shares — revoke share link (protected)
  app.delete(
    '/',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
    const existing = await prisma.shareLink.findUnique({ where: { userId: request.user.sub } });
    if (!existing) {
      return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'No active share link' });
    }
    await prisma.shareLink.delete({ where: { userId: request.user.sub } });
    return reply.status(204).send();
    },
  );

  // GET /shares/:token — public; validate token + expiry, return paginated posts
  app.get(
    '/:token',
    {
      config: { rateLimit: { max: 40, timeWindow: '1 minute' } },
    },
    async (
      request: FastifyRequest<{ Params: ShareTokenParams; Querystring: PaginationQuery }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.params;
      const take = Math.min(parseInt(request.query.take ?? '20', 10), 50);
      const cursor = request.query.cursor;

      const shareLink = await prisma.shareLink.findUnique({ where: { shareToken: token } });
      if (!shareLink) {
        return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'Share link not found' });
      }

      if (shareLink.expiresAt <= new Date()) {
        return reply.status(410).send({ statusCode: 410, error: 'Gone', message: 'Share link has expired' });
      }

      const posts = await prisma.post.findMany({
        where: { userId: shareLink.userId },
        orderBy: { createdAt: 'desc' },
        take: take + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      const hasMore = posts.length > take;
      const data = hasMore ? posts.slice(0, take) : posts;
      const nextCursor = hasMore ? data[data.length - 1].id : null;

      return reply.send({ data, nextCursor, hasMore });
    },
  );
}
