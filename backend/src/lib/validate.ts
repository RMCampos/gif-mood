import { validate } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { FastifyReply } from 'fastify';

export async function validateDto<T extends object>(
  cls: ClassConstructor<T>,
  plain: unknown,
  reply: FastifyReply,
): Promise<T | null> {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: messages });
    return null;
  }
  return instance;
}
