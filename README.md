Self hosted [NASA Astronomy Picture of the Day](https://science.nasa.gov/apod/) (APOD) viewer written with Ionic 8 / Angular 22 (`client`) and Java (`server`).

# https://apod.rasc.ch/


## Technology

### Server
Written in Java 25 with Spring / Spring Boot.
Periodically polls the [NASA Science APOD API](https://science.nasa.gov/wp-json/wp/v2/apod-basic/261017), stores the information in a [Xodus](https://github.com/JetBrains/xodus) database, downloads JPEG images and recompresses them with [jpeg-recompress](https://github.com/danielgtaylor/jpeg-archive) to save bandwidth. The API's `url` is an article link; `hdurl` supplies the image used for both normal and high definition views. Credits and explanations are converted from HTML to plain text. Video and non-JPEG entries are skipped.

The NASA Science API does not require an API key. Its base URL can be overridden with `app.nasa-api-url` (default: `https://science.nasa.gov/wp-json/wp/v2/apod-basic/`).
Provides a Protocol Buffer endpoint (`/apods`) for the clients.

**Libraries:**
  * [Spring 7](https://spring.io/projects/spring-framework)
  * [Spring Boot 4](https://spring.io/projects/spring-boot)
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
  * [Vite](https://vite.dev/): Builds the custom service worker
  * [workbox-cli](https://github.com/googlechrome/workbox): Precache the application resources
  

## Run locally

  * Install Node.js
    https://nodejs.org/en/

  * Install Java 25

  * Download jpeg-recompress for your operation system
    https://github.com/imagemin/jpeg-recompress-bin/tree/master/vendor/

  * Clone the project and install the dependencies
    ```
    git clone https://github.com/ralscha/apod.git
    cd apod/client
    npm install
    ```

  * Open `server/src/main/resources/application-development.properties` and change the path to the jpeg-recompress binary. 


  * Download some test data. The following command will download the last 10 days.
    ```
    cd apod/server
    ./mvnw spring-boot:run -Dspring.profiles.active=development -Dspring-boot.run.arguments=import10
    ```

  * Start the server
  ```
  ./mvnw spring-boot:run -Dspring.profiles.active=development
  ```

  * Start the client and service worker build watcher
  ```
  cd apod/client
  npm run dev
  ```

## Backfill missing dates

The scheduled import checks the latest four days. To recover a longer gap, stop the running server, replace its JAR with the rebuilt `server/target/apod.jar`, and run the following with the same configuration and data paths as the service:

```
java -jar apod.jar import-range --from=2026-09-29 --to=2026-10-18 --spring.main.web-application-type=none
```

Both dates are inclusive; `--to` defaults to today. Existing database entries are skipped. The command imports oldest first and can be rerun after a failure. Run it before restarting the service so clients receive the missing dates before newer entries. Clients that already synchronized newer dates will need their local APOD data refreshed to pick up older backfilled entries.

Build and test the server with Java 25 or later:

```
cd server
./mvnw verify
```

## Upgrading an existing Kryo 4 database

Stop APOD and back up the complete directory configured by `app.xodus-path`
(resolved relative to the configured application paths) before the first start.
Allow space for both the original records and their converted copy.

On startup, APOD converts the `apod` store into `apod-kryo5` in one Xodus
transaction. It checks the record count, leaves `apod` untouched, and uses the
new store for all subsequent reads and writes. A conversion failure aborts
startup and rolls back the new store. Restarting does not import records again;
deleting records from the new store does not resurrect the original data.

Kryo 4.0.3 remains solely as the legacy decoder; the relocated `kryo5` artifact
5.7.1 handles current data. Dependabot continues updating Kryo 5 and Kryo 4
patches, but cannot replace the legacy decoder with a different major version.
This follows [Kryo's migration approach](https://github.com/EsotericSoftware/kryo/wiki/Migration-to-v5).

Verify the archive after startup. To roll back, stop APOD and restore the full
pre-upgrade backup with the old application. The retained `apod` store is a
snapshot at migration time and does not include later edits.

Validation: `mvn -f server/pom.xml verify` includes conversion of actual Kryo 4
records, Unicode/null fields, restart behavior, and atomic rollback on corruption.
