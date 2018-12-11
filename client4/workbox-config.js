module.exports = {
  "globDirectory": "www/",
  "globPatterns": [
    "index.html",
    "*.js",
    "*.css",
    "assets/icon/*.png",
    "assets/icon/favicon.ico",
    "svg/md-search.svg",
    "svg/md-arrow-dropdown.svg",
    "svg/md-close.svg",
    "svg/md-arrow-back.svg",
    "svg/ios-search.svg",
    "svg/ios-arrow-dropdown.svg",
    "svg/ios-close.svg",
    "svg/ios-arrow-back.svg",
    "manifest.json"
  ],
  "dontCacheBustUrlsMatching": new RegExp('.+\.[a-f0-9]{20}\..+'),
  "maximumFileSizeToCacheInBytes": 5000000,
  "swSrc": "src/service-worker.js",
  "swDest": "www/service-worker.js"
};

