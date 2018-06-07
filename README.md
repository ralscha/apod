Self hosted [NASA Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html) (APOD) viewer written in Ionic 3 (client) and Java (server).

# https://apod.hplar.ch/

This is *not* a PWA. The Web App requires a browser with Service Worker and Cache API implementation.    
Currently the app only runs on Chrome and Firefox. 

## Technology

### Server
Written in Java 8 and Spring. 
Periodically polls the [APOD API](https://api.nasa.gov/api.html), stores the information in a Xodus database, downloads the normal and high def image and recompresses them with [jpeg-recompress](https://github.com/danielgtaylor/jpeg-archive) to save bandwidth.      
Provides a Protocol Buffer endpoint (`/apods`) for the clients.

**Libraries:**
  * [Spring 5](https://projects.spring.io/spring-framework/)
  * [Spring Boot 2](https://projects.spring.io/spring-boot/)
  * [Xodus](https://github.com/JetBrains/xodus)
  * [jsoup](https://jsoup.org/)
  * [OkHttp](http://square.github.io/okhttp/)
  * [protobuf-java](https://github.com/google/protobuf)
  * [kryo](https://github.com/EsotericSoftware/kryo)

<br>

### Client
Written in [TypeScript](https://www.typescriptlang.org/), CSS, HTML and the [Ionic](https://ionicframework.com/) framework.    
The app consists of 3 pages:
  * **Home**: Displays a list of images for each APOD entry. Shows detail page when user taps on image.
  * **Detail**: Displays the image and underneath the explanation. Shows full page when user taps on image.
  * **Full**: Displays the high definition image in a scrollable view.
  
Thanks to the Ionic support for the History API each page is bookmarkable (see configuration in [app.module.ts](https://github.com/ralscha/apod/blob/master/client/src/app/app.module.ts#L19-L25)).    
Examples:
  * https://apod.hplar.ch/index.html#/detail/2017-12-24
  * https://apod.hplar.ch/index.html#/full/2017-12-27
  
With this configuration also the hardware back button on an Android device works properly.

Apod data is stored in IndexedDB. The application accesses the IndexedDB through [Dexie.js](http://dexie.org/). Visited images are stored by the Service Worker in the Cache. The application assets are also cached, this makes the app offline capable, limited to entries and images that the user visited  when the browser was online.

#### Libraries
  * [Ionic](https://ionicframework.com/)
  * [Dexie.js](http://dexie.org/)
  * [ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js/)
  * [Workbox](https://developers.google.com/web/tools/workbox/)
  
#### Icon
Source: https://www.shareicon.net/science-stars-education-astronomy-universe-telescope-795293      
Various sized icons generated with: http://cthedot.de/icongen/

#### Build tools
  * [bread-compressor-cli](https://github.com/ralscha/bread-compressor-cli): Precompress assets
  * [html-minifier](https://www.npmjs.com/package/html-minifier): Minify the index.html page
  * [workbox-cli](https://github.com/googlechrome/workbox): Precache the application assets
  * [shx](https://github.com/shelljs/shx): Used for common platform independent shell tasks
  
Application assets are versioned with a content hash in their filename ([rev-hash](https://www.npmjs.com/package/rev-hash), [webpack-manifest-plugin](https://github.com/danethurber/webpack-manifest-plugin), [cache-busting.js](https://github.com/ralscha/apod/blob/master/client/cache-busting.js))     
See also my blog post for more information about this topic: https://golb.hplar.ch/p/Workbox-in-Ionic-and-Lazy-Loading-Modules


## Run locally

  * Install Node.js    
    https://nodejs.org/en/

  * Download jpeg-recompress for your operation system    
    https://github.com/imagemin/jpeg-recompress-bin/tree/master/vendor/

  * Install the Ionic CLI: `npm install -g ionic@latest`

  * Clone the project and install the client dependencies
    ```
    git clone https://github.com/ralscha/apod.git
    cd apod/client
    npm install
    ```

  * Open `server/src/main/resources/application-development.properties` and change the path to the jpeg-recompress binary. 


  * Visit the NASA Open API page and apply for an API key (it's free)     
    https://api.nasa.gov/index.html#apply-for-an-api-key

  * Open `server/src/main/resources/application.properties` and enter the API key     
    `app.nasa-api-key=<enter key here>`

  * Download some test data. The following command will download the last 10 days.
    ```
    cd apod/server
    ./mvnw spring-boot:run -Dspring.profiles.active=development -Dspring-boot.run.arguments=import10
    ```

  * Start the server
  ```
  ./mvnw spring-boot:run -Dspring.profiles.active=development
  ```

  * Start the client
  ```
  cd apod/client
  ionic serve
  ```
