importScripts('workbox-sw.prod.v2.1.2.js');

const workboxSW = new self.WorkboxSW({clientsClaim: true, skipWaiting: true});
workboxSW.precache([]);
workboxSW.precache([{
   "url": "assets/fonts/ionicons.woff2?v=3.0.0-alpha.3"
 }
]);

workboxSW.router.registerRoute(/(.*)img(.*)/,
  workboxSW.strategies.cacheFirst({
    cacheName: 'images',
    cacheExpiration: {
      maxEntries: 500
    },
    cacheableResponse: {statuses: [0, 200]}
  })
);

