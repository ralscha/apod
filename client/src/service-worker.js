importScripts('workbox-431/workbox-sw.js');
workbox.setConfig({
  debug: false,
  modulePathPrefix: 'workbox-431/'
});
workbox.core.skipWaiting();
workbox.core.clientsClaim();
workbox.precaching.cleanupOutdatedCaches();

workbox.precaching.precacheAndRoute([]);

workbox.routing.registerRoute(/(.*)img(.*)/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 500
      }),
      new workbox.cacheableResponse.Plugin({
        statuses: [0, 200]
      })
    ]
  })
);

