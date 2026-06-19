import { Injectable } from '@angular/core';
import { ApodDb, StoredApod } from './apod-db';
import { Apods, IApod, IApods } from './protos/apod';
import { environment } from '../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApodService {
  private db: ApodDb;
  private updatesSubject = new Subject<boolean>();
  updates = this.updatesSubject.asObservable();

  constructor() {
    this.db = new ApodDb();
    this.init();
  }

  async init(): Promise<void> {
    const lastApod = await this.getLastEntry();
    let apods: IApods | null;
    if (lastApod) {
      try {
        apods = await this.readApods(lastApod.date);
      } catch {
        apods = null;
      }
    } else {
      try {
        apods = await this.readApods();
      } catch {
        apods = null;
      }
    }

    const decodedApods = apods?.apods ?? [];
    if (decodedApods.length > 0) {
      await this.db.transaction('rw', this.db.apods, async () => {
        for (const apod of decodedApods) {
          const storedApod: StoredApod = {
            ...apod,
            titleTokens: this.getAllWords(apod.title),
          };
          this.db.apods.put(storedApod);
        }
      });

      this.updatesSubject.next(true);
    }
  }

  getLastEntry(): Promise<IApod | undefined> {
    return this.db.apods.toCollection().last();
  }

  getApods(offset: number, limit: number, searchTerms: string): Promise<IApod[]> {
    if (searchTerms && searchTerms.trim().length > 0) {
      const words = this.getAllWords(searchTerms);
      return this.db.apods
        .where('titleTokens')
        .startsWithAnyOfIgnoreCase(words)
        .distinct()
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();
    }
    return this.db.apods.reverse().offset(offset).limit(limit).toArray();
  }

  getApod(key: string | null): Promise<IApod | undefined | null> {
    if (key !== null) {
      return this.db.apods.get(key);
    }
    return Promise.resolve(null);
  }

  private getAllWords(text: string | null | undefined): string[] {
    if (text === null || text === undefined) {
      return [];
    }

    const allWords = text.split(' ');
    const wordSet = allWords.reduce((prev: Record<string, boolean>, current) => {
      // ignore small tokens
      if (current && current.length > 2) {
        prev[current] = true;
      }
      return prev;
    }, {});
    return Object.keys(wordSet);
  }

  private async readApods(date: string | null = null): Promise<IApods> {
    const headers = new Headers();
    headers.append('Accept', 'application/x-protobuf');

    let queryParam;
    if (date) {
      queryParam = `?from=${date}`;
    } else {
      queryParam = '';
    }

    const response = await fetch(`${environment.serverURL}/apods${queryParam}`, { headers });
    if (!response.ok) {
      throw new Error(`Could not read APOD data: ${response.status} ${response.statusText}`);
    }
    const buf = await response.arrayBuffer();
    return Apods.decode(new Uint8Array(buf));
  }
}
