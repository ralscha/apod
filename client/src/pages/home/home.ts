import {Component, ViewChild} from '@angular/core';
import {IApod} from "../../protos/apod";
import {ApodProvider} from "../../providers/apod/apod";
import {Events, LoadingController, NavParams, Searchbar} from "ionic-angular";
import {ENV} from "@app/env";
import {DetailPage} from "../detail/detail";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  version: string;
  apods: IApod[] = [];
  private offset = 0;
  detailPage = DetailPage;

  showSearchbar: boolean = false;
  searchTerm: string = '';

  @ViewChild('searchbar')
  searchbar: Searchbar;

  constructor(private readonly apodProvider: ApodProvider,
              private readonly loadingCtrl: LoadingController,
              private readonly navParams: NavParams,
              events: Events) {
    events.subscribe('apods_updated', () => {
      this.init();
    });

    this.init();

    window.addEventListener('online', this.init.bind(this));
    window.addEventListener('offline', this.init.bind(this));
  }

  ionViewWillEnter() {
    const fromDetail = this.navParams.get('fromDetail');
    if (fromDetail) {
      return;
    }

    const loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });

    loading.present();

    this.apodProvider.init().then(() => loading.dismiss());
  }

  doRefresh(refresher) {
    this.apodProvider.init().then(() => refresher.complete());
  }

  async init() {
    this.apods = [];
    this.offset = 0;
    this.readDataFromDb();
  }

  async doInfinite(infiniteScroll) {
    this.offset += 5;
    await this.readDataFromDb();
    infiniteScroll.complete();
  }

  private async readDataFromDb() {
    let apodsFromDb = [];

    if (navigator.onLine) {
      apodsFromDb = await this.apodProvider.getApods(this.offset, 5, this.searchTerm);
    }
    else {
      apodsFromDb = await this.getCachedApods();
    }

    this.apods.push(...apodsFromDb);
  }

  private async getCachedApods(): Promise<IApod[]> {
    const cachedApods = [];
    let apodsFromDb = await this.apodProvider.getApods(this.offset, 5, this.searchTerm);
    while (cachedApods.length < 5 && apodsFromDb.length > 0) {
      for (const a of apodsFromDb) {
        const response = await caches.match(`${ENV.SERVER_URL}/img/${a.date}/n`, {cacheName: 'images'});
        if (response) {
          cachedApods.push(a);
        }
      }
      this.offset += 5;
      apodsFromDb = await this.apodProvider.getApods(this.offset, 5, this.searchTerm);
    }
    return cachedApods;
  }

  trackBy(index, item: IApod) {
    return item.date;
  }

  imageURL(apod: IApod) {
    return `${ENV.SERVER_URL}/img/${apod.date}/n`;
  }

  toggleSearch() {
    this.showSearchbar = !this.showSearchbar;
    setTimeout(() => {
      if (this.searchbar) {
        this.searchbar.setFocus();
      }
    }, 1);
  }

  clearSearch() {
    this.searchTerm = '';
    this.toggleSearch();

    this.init();
  }

  triggerSearchInput(event: any) {
    this.searchTerm = event.target.value;
    if (this.searchTerm && this.searchTerm.trim() !== '') {

    }
    else {
      this.searchTerm = '';
    }
    this.init();
  }
}
