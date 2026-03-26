import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { validateDto } from '../../lib/validate';
import { RegisterDto, LoginDto } from '../../dtos/auth.dto';

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register
  app.post(
    '/register',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = await validateDto(RegisterDto, request.body, reply);
      if (!dto) return;

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: dto.email },
            { username: { equals: dto.username, mode: 'insensitive' } },
          ],
        },
      });
      if (existing) {
        return reply
          .status(409)
          .send({ statusCode: 409, error: 'Conflict', message: 'Email or username already taken' });
      }

      const hashed = await bcrypt.hash(dto.password, 12);
      const user = await prisma.user.create({
        data: { username: dto.username, email: dto.email, password: hashed },
        select: { id: true, username: true, email: true, createdAt: true },
      });

      return reply.status(201).send(user);
    },
  );

  // POST /auth/login
  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = await validateDto(LoginDto, request.body, reply);
      if (!dto) return;

      const user = await prisma.user.findUnique({ where: { email: dto.email } });
      if (!user || user.disabledAt) {
        return reply
          .status(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) {
        return reply
          .status(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
      }

      const token = app.jwt.sign({ sub: user.id, username: user.username, email: user.email });
      return reply.send({ token });
    },
  );
}
