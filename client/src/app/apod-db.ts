import Dexie from 'dexie';
import { IApod } from './protos/apod';

export type StoredApod = IApod & {
  titleTokens: string[];
};

export class ApodDb extends Dexie {
  apods!: Dexie.Table<StoredApod, string>;

  constructor() {
    super('ApodDb');
    this.version(1).stores({
      apods: 'date,*titleTokens',
    });
  }
}
