import Dexie from 'dexie';
import {IApod} from "../../protos/apod";

export class ApodDb extends Dexie {
  apods: Dexie.Table<IApod, string>;

  constructor() {
    super("ApodDb");
    this.version(1).stores({
      apods: "date,*titleTokens"
    });
  }
}
