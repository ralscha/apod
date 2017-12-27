Self hosted [NASA Astronomy Picture of the Day](https://apod.nasa.gov/apod/astropix.html) (APOD) viewer written in Ionic 3 (client) and Java (server).

# https://apod.hplar.ch


## Technology

### Server
Written in Java 8 and Spring. 
Periodically polls the [APOD API](https://api.nasa.gov/api.html), stores the informations in a Xodus database, downloads the normal and high def image and recompresses them with [jpeg-recompress](https://github.com/danielgtaylor/jpeg-archive) to save bandwidth.      
Provides an Protocol Buffer endpoint (`/apods`) for the clients.

**Libraries:**
  * [Spring 5](https://projects.spring.io/spring-framework/)
  * [Spring Boot 2](https://projects.spring.io/spring-boot/)
  * [Xodus](https://github.com/JetBrains/xodus)
  * [jsoup](https://jsoup.org/)
  * [OkHttp](http://square.github.io/okhttp/)
  * [protobuf-java](https://github.com/google/protobuf)
  * [kryo](https://github.com/EsotericSoftware/kryo)


### Client

#### Icon
Source: https://www.shareicon.net/science-stars-education-astronomy-universe-telescope-795293      
Various sized icons generated with: http://cthedot.de/icongen/

