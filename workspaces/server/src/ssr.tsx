import { StoreProvider } from '@wsh-2025/client/src/app/StoreContext';
import { createRoutes } from '@wsh-2025/client/src/app/createRoutes';
import { createStore } from '@wsh-2025/client/src/app/createStore';
import type { FastifyInstance } from 'fastify';
import { createStandardRequest } from 'fastify-standard-request-reply';
import htmlescape from 'htmlescape';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticHandlerContext, StaticRouterProvider } from 'react-router';

interface LoaderData {
  episode?: {
    thumbnailUrl: string;
  };
  series?: {
    thumbnailUrl: string;
  };
  program?: {
    thumbnailUrl: string;
  };
}

// 現在のページで必要な画像のみを取得する関数
function getRequiredImages(context: StaticHandlerContext): string[] {
  const loaderData = context.loaderData as Record<string, LoaderData>;
  const images = new Set<string>();

  // loaderDataから画像URLを抽出
  Object.values(loaderData).forEach((data) => {
    if (data?.episode?.thumbnailUrl) {
      images.add(data.episode.thumbnailUrl);
    }
    if (data?.series?.thumbnailUrl) {
      images.add(data.series.thumbnailUrl);
    }
    if (data?.program?.thumbnailUrl) {
      images.add(data.program.thumbnailUrl);
    }
  });

  return Array.from(images);
}

export function registerSsr(app: FastifyInstance): void {
  app.get('/favicon.ico', (_, reply) => {
    reply.status(404).send();
  });

  app.get('/*', async (req, reply) => {
    // @ts-expect-error ................
    const request = createStandardRequest(req, reply);

    const store = createStore({});
    const handler = createStaticHandler(createRoutes(store));
    const context = await handler.query(request);

    if (context instanceof Response) {
      return reply.send(context);
    }

    const router = createStaticRouter(handler.dataRoutes, context);
    renderToString(
      <StrictMode>
        <StoreProvider createStore={() => store}>
          <StaticRouterProvider context={context} hydrate={false} router={router} />
        </StoreProvider>
      </StrictMode>,
    );

    // 現在のページで必要な画像のみを取得
    const requiredImages = getRequiredImages(context);

    reply.type('text/html').send(/* html */ `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charSet="UTF-8" />
          <meta content="width=device-width, initial-scale=1.0" name="viewport" />
          <script src="/public/main.js"></script>
          ${requiredImages.map((imagePath) => `<link as="image" href="${imagePath}" rel="preload" />`).join('\n')}
        </head>
        <body></body>
      </html>
      <script>
        window.__staticRouterHydrationData = ${htmlescape({
          actionData: context.actionData,
          loaderData: context.loaderData,
        })};
      </script>
    `);
  });
}
