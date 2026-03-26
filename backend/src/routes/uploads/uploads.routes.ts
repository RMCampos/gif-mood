import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';

export default async function uploadRoutes(app: FastifyInstance): Promise<void> {
  // POST /uploads — upload a GIF
  app.post(
    '/',
    {
      preHandler: app.authenticate,
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'No file uploaded' });
      }

      const allowed = ['image/gif', 'image/webp', 'image/png', 'image/jpeg'];
      if (!allowed.includes(data.mimetype)) {
        return reply
          .status(400)
          .send({ statusCode: 400, error: 'Bad Request', message: 'Only GIF, WEBP, PNG, JPEG files are allowed' });
      }

      const ext = path.extname(data.filename) || '.gif';
      const filename = `${request.user.sub}-${uuidv4()}${ext}`;
      const uploadDir = process.env.UPLOAD_DIR ?? '/uploads';
      const filepath = path.join(uploadDir, filename);

      fs.mkdirSync(uploadDir, { recursive: true });
      await pipeline(data.file, fs.createWriteStream(filepath));

      const gifUrl = `/uploads/${filename}`;
      return reply.status(201).send({ gifUrl });
    },
  );
}
