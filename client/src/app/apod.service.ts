import {Injectable} from '@angular/core';
import {ApodDb} from './apod-db';
import {Events} from '@ionic/angular';
import {Apods, IApod} from './protos/apod';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApodService {

  private db: ApodDb;

  constructor(private readonly events: Events) {
    this.db = new ApodDb();
  }

  async init() {
    const lastApod = await this.getLastEntry();
    let apods;
    if (lastApod) {
      try {
        apods = await this.readApods(lastApod.date);
      } catch (e) {
        apods = null;
      }
    } else {
      try {
        apods = await this.readApods();
      } catch (e) {
        apods = null;
      }
    }

    if (apods && apods.apods.length > 0) {
      await this.db.transaction('rw', this.db.apods, async () => {
        for (const apod of apods.apods) {
          apod.titleTokens = this.getAllWords(apod.title);
          this.db.apods.put(apod);
        }
      });

      this.events.publish('apods_updated');
    }
  }

  getLastEntry() {
    return this.db.apods.toCollection().last();
  }

  getApods(offset: number, limit: number, searchTerms: string): Promise<IApod[]> {
    if (searchTerms && searchTerms.trim().length > 0) {
      const words = this.getAllWords(searchTerms);
      return this.db.apods.where('titleTokens').startsWithAnyOfIgnoreCase(words)
        .distinct().reverse().offset(offset).limit(limit).toArray();
    }
    return this.db.apods.reverse().offset(offset).limit(limit).toArray();
  }

  getApod(key: string) {
    return this.db.apods.get(key);
  }

  private getAllWords(text: string) {
    const allWords = text.split(' ');
    const wordSet = allWords.reduce((prev, current) => {
      // ignore small tokens
      if (current && current.length > 2) {
        prev[current] = true;
      }
      return prev;
    }, {});
    return Object.keys(wordSet);
  }

  private async readApods(date: string = null) {
    const headers = new Headers();
    headers.append('Accept', 'application/x-protobuf');

    let queryParam;
    if (date) {
      queryParam = `?from=${date}`;
    } else {
      queryParam = '';
    }

    const response = await fetch(`${environment.serverURL}/apods${queryParam}`, {headers});
    const buf = await response.arrayBuffer();
    return Apods.decode(new Uint8Array(buf));
  }
}
