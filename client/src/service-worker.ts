/// <reference lib="es2018" />
/// <reference lib="webworker" />
import {cleanupOutdatedCaches, precacheAndRoute} from 'workbox-precaching';
import {clientsClaim} from 'workbox-core';
import {registerRoute} from 'workbox-routing';
import {CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();

if (process.env['NODE_ENV'] === 'production') {
  registerRoute(/assets\/icons\/.+\.png$/, new CacheFirst({cacheName: 'icons'}));
  precacheAndRoute(self.__WB_MANIFEST);
}

registerRoute(/(.*)img(.*)/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

