import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { validateDto } from '../../lib/validate';
import { CreatePostDto } from '../../dtos/post.dto';

interface PaginationQuery {
  cursor?: string;
  take?: string;
}

export default async function postRoutes(app: FastifyInstance): Promise<void> {
  // POST /posts
  app.post(
    '/',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = await validateDto(CreatePostDto, request.body, reply);
    if (!dto) return;

    const post = await prisma.post.create({
      data: { userId: request.user.sub, gifUrl: dto.gifUrl, source: dto.source },
    });
    return reply.status(201).send(post);
    },
  );

  // GET /posts/me?cursor=&take=
  app.get<{ Querystring: PaginationQuery }>(
    '/me',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const take = Math.min(parseInt(request.query.take ?? '20', 10), 50);
      const cursor = request.query.cursor;

      const posts = await prisma.post.findMany({
        where: { userId: request.user.sub },
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
