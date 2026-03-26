import buildApp from './app';
import { connectDB } from './lib/prisma';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = '0.0.0.0';

async function start(): Promise<void> {
  const app = await buildApp();
  await connectDB(app);

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
