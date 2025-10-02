Self hosted [NASA Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html) (APOD) viewer written with Ionic 7 / Angular 17 (`client`) and Java (`server`).

# https://apod.rasc.ch/

This is *not* a PWA. This web app requires a browser with service worker and Cache API implementation.    
Currently the app only runs on Chrome and Firefox. 

## Technology

### Server
Written in Java 17 with Spring / Spring Boot.    
Periodically polls the [APOD API](https://api.nasa.gov/api.html), stores the information in a [Xodus](https://github.com/JetBrains/xodus) database, downloads the normal and high def image and recompresses them with [jpeg-recompress](https://github.com/danielgtaylor/jpeg-archive) to save bandwidth.      
Provides a Protocol Buffer endpoint (`/apods`) for the clients.

**Libraries:**
  * [Spring 6](https://projects.spring.io/spring-framework/)
  * [Spring Boot 3](https://projects.spring.io/spring-boot/)
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
  
Apod data is stored in IndexedDB. The application accesses the IndexedDB through [Dexie.js](http://dexie.org/). Visited images are stored by the service worker in the cache. The application assets are also cached, the app therefore runs when offline. In offline mode the applications shows only entries and images that the user visited before and are therefore cached.

#### Libraries
  * [Ionic](https://ionicframework.com/)
  * [Dexie.js](http://dexie.org/)
  * [ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js/)
  * [Workbox](https://developers.google.com/web/tools/workbox/)
  
#### Icon
Source: https://www.shareicon.net/science-stars-education-astronomy-universe-telescope-795293      
Various sized icons generated with: http://cthedot.de/icongen/

#### Build tools
  * [bread-compressor-cli](https://github.com/ralscha/bread-compressor-cli): Pre-compresses assets
  * [workbox-cli](https://github.com/googlechrome/workbox): Precache the application resources
  

## Run locally

  * Install Node.js    
    https://nodejs.org/en/

  * Download jpeg-recompress for your operation system    
    https://github.com/imagemin/jpeg-recompress-bin/tree/master/vendor/

  * Install the Ionic and Angular CLI: 
    * `npm install -g ionic@latest`
    * `npm install -g @angular/cli`

  * Clone the project and install the dependencies
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
