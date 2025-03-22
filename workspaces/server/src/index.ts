import '@wsh-2025/server/src/setups/luxon';

import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerApi } from '@wsh-2025/server/src/api';
import { initializeDatabase } from '@wsh-2025/server/src/drizzle/database';
import { registerSsr } from '@wsh-2025/server/src/ssr';
import { registerStreams } from '@wsh-2025/server/src/streams';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await initializeDatabase();

  const app = fastify();

  app.addHook('onSend', async (_req, reply) => {
    reply.header('cache-control', 'no-store');
  });
  app.register(cors, {
    origin: true,
  });
  app.register(fastifyStatic, {
    root: path.join(__dirname, '../../../workspaces/client/assets'),
    prefix: '/assets/',
    decorateReply: false
  });
  app.register(registerApi, { prefix: '/api' });
  app.register(registerStreams);
  app.register(registerSsr);

  await app.ready();
  const address = await app.listen({ host: '0.0.0.0', port: Number(process.env['PORT']) });
  console.log(`Server listening at ${address}`);
}

void main();
