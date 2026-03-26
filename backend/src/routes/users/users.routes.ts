import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { validateDto } from '../../lib/validate';
import { UpdateUserDto } from '../../dtos/user.dto';

export default async function userRoutes(app: FastifyInstance): Promise<void> {
  // GET /users/me
  app.get('/me', { preHandler: app.authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, username: true, email: true, pictureUrl: true, createdAt: true, updatedAt: true },
    });
    if (!user) return reply.status(404).send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    return reply.send(user);
  });

  // PATCH /users/me
  app.patch('/me', { preHandler: app.authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const dto = await validateDto(UpdateUserDto, request.body, reply);
    if (!dto) return;

    if (!dto.username && !dto.email) {
      return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No fields to update' });
    }

    if (dto.username) {
      const taken = await prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: request.user.sub } },
      });
      if (taken) {
        return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Username already taken' });
      }
    }

    if (dto.email) {
      const taken = await prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: request.user.sub } },
      });
      if (taken) {
        return reply.status(409).send({ statusCode: 409, error: 'Conflict', message: 'Email already taken' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: request.user.sub },
      data: { ...(dto.username && { username: dto.username }), ...(dto.email && { email: dto.email }) },
      select: { id: true, username: true, email: true, pictureUrl: true, updatedAt: true },
    });
    return reply.send(updated);
  });

  // POST /users/me/picture
  app.post(
    '/me/picture',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No file uploaded' });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowed.includes(data.mimetype)) {
        return reply
          .status(400)
          .send({ statusCode: 400, error: 'Bad Request', message: 'Only JPEG, PNG, GIF, WEBP images are allowed' });
      }

      const ext = path.extname(data.filename) || '.jpg';
      const filename = `${request.user.sub}-picture-${uuidv4()}${ext}`;
      const uploadDir = process.env.UPLOAD_DIR ?? '/uploads';
      const filepath = path.join(uploadDir, filename);

      fs.mkdirSync(uploadDir, { recursive: true });
      await pipeline(data.file, fs.createWriteStream(filepath));

      const pictureUrl = `/uploads/${filename}`;
      await prisma.user.update({
        where: { id: request.user.sub },
        data: { pictureUrl },
      });

      return reply.send({ pictureUrl });
    },
  );
}
