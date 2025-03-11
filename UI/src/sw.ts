/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import type { Ingredient } from './types/ingredients';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

declare global {
  interface ServiceWorkerGlobalScopeEventMap {
    'periodicsync': PeriodicSyncEvent;
  }
}

interface PeriodicSyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<void>): void;
}

clientsClaim();
self.skipWaiting();

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Handle periodic sync for ingredients
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'sync-ingredients') {
    event.waitUntil(
      fetch('https://api.sheety.co/e05b4640b9ab192354f836e9a1b60432/ingredients/ingredientsList')
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          // Open IndexedDB and update the ingredients
          const dbRequest = indexedDB.open('celiacSafeDB');
          dbRequest.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction('ingredients', 'readwrite');
            const store = transaction.objectStore('ingredients');
            store.clear(); // Clear existing data
            data.forEach((ingredient: Ingredient) => store.add(ingredient));
          };
        })
        .catch(error => {
          console.error('Periodic sync failed:', error);
        })
    );
  }
});

// Cache page navigations
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

// Cache CSS, JS, and Web Worker requests with a Stale While Revalidate strategy
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

// Cache images with a Cache First strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache the API requests
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
      }),
    ],
  })
); 