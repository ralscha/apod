module.exports = {
  copyWorkbox: {
	src: [
	  './node_modules/workbox-sw/build/workbox-sw.js',
    './node_modules/workbox-core/build/workbox-core.prod.js',
    './node_modules/workbox-strategies/build/workbox-strategies.prod.js',
    './node_modules/workbox-cache-expiration/build/workbox-cache-expiration.prod.js',
    './node_modules/workbox-cacheable-response/build/workbox-cacheable-response.prod.js',
    './node_modules/workbox-routing/build/workbox-routing.prod.js',
    './node_modules/workbox-precaching/build/workbox-precaching.prod.js'
  ],
	dest: '{{WWW}}/workbox-3.0.0'
  }
}
