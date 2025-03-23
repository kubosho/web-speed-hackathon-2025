import '@wsh-2025/client/src/setups/luxon';
import '@unocss/reset/tailwind-compat.css';
import 'uno.css';

import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, HydrationState, RouterProvider } from 'react-router';

import { StoreProvider } from '@wsh-2025/client/src/app/StoreContext';
import { createRoutes } from '@wsh-2025/client/src/app/createRoutes';
import { createStore } from '@wsh-2025/client/src/app/createStore';

declare global {
  var __zustandHydrationData: unknown;
  var __staticRouterHydrationData: HydrationState;
}

async function main() {
  // 初期hydrationデータを取得
  const initialHydrationData = window.__staticRouterHydrationData || { loaderData: {}, actionData: {} };

  // 残りのhydrationデータを非同期で取得
  try {
    const response = await fetch(`/api/hydration-data${window.location.pathname}`);
    if (response.ok) {
      const fullHydrationData = await response.json();
      // 初期データと結合
      window.__staticRouterHydrationData = {
        ...initialHydrationData,
        loaderData: {
          ...initialHydrationData.loaderData,
          ...fullHydrationData.loaderData,
        },
        actionData: {
          ...initialHydrationData.actionData,
          ...fullHydrationData.actionData,
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch full hydration data:', error);
  }

  // データが取得できなかった場合のフォールバック
  if (!window.__staticRouterHydrationData) {
    window.__staticRouterHydrationData = { loaderData: {}, actionData: {} };
  }

  const store = createStore({});
  const router = createBrowserRouter(createRoutes(store), {
    hydrationData: window.__staticRouterHydrationData,
  });

  hydrateRoot(
    document,
    <StrictMode>
      <StoreProvider createStore={() => store}>
        <RouterProvider router={router} />
      </StoreProvider>
    </StrictMode>,
  );
}

document.addEventListener('DOMContentLoaded', () => {
  main().catch((error) => {
    console.error('Failed to initialize app:', error);
  });
});
