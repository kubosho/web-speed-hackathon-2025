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
import { registerThumbnails } from '@wsh-2025/server/src/thumbnails';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await initializeDatabase();

  const app = fastify();

  app.addHook('onSend', async (req, reply) => {
    // 静的ファイル（public, assets, streams, thumbnails）のパスにマッチするかチェック
    // バージョンクエリパラメータを含むパスも許可する
    const isStaticFile =
      /^\/(public|assets|streams|thumbnails)\/.*\.(js|css|png|jpe?g|gif|avif|svg|ico|mp4|ts|m3u8)(\?version=.*)?$/.test(
        req.url || '',
      );

    // APIエンドポイントかどうかをチェック
    const isApiEndpoint = req.url?.startsWith('/api/');

    if (isStaticFile) {
      // 静的ファイルの場合は1年間のキャッシュを設定
      // ログイン状態の場合はprivateを使用
      const isLoggedIn = req.session?.get('id') != null;
      const cacheVisibility = isLoggedIn ? 'private' : 'public';
      reply.header('cache-control', `${cacheVisibility}, max-age=31536000`);
    } else if (!isApiEndpoint || !reply.getHeader('cache-control')) {
      // APIエンドポイント以外、またはcache-controlが設定されていないAPIエンドポイントの場合は
      // キャッシュを無効化
      reply.header('cache-control', 'no-store');
    }
  });
  app.register(cors, {
    origin: true,
  });
  app.register(fastifyStatic, {
    root: [
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public'),
    ],
    prefix: '/public/',
    decorateReply: true,
  });
  await registerApi(app);
  app.register(fastifyStatic, {
    root: path.join(__dirname, '../../../workspaces/client/assets'),
    prefix: '/assets/',
    decorateReply: false,
  });
  registerStreams(app);
  app.register(fastifyStatic, {
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../streams'),
    prefix: '/streams/',
    decorateReply: false,
  });
  app.register(fastifyStatic, {
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../thumbnails'),
    prefix: '/thumbnails/',
    decorateReply: false,
  });
  await registerThumbnails(app);
  await registerSsr(app);

  await app.ready();
  const address = await app.listen({ host: '0.0.0.0', port: Number(process.env['PORT']) });
  console.log(`Server listening at ${address}`);
}

void main();
