import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IApod} from '../protos/apod';
import {environment} from '../../environments/environment';
import {Events, IonSearchbar, LoadingController} from '@ionic/angular';
import {ApodService} from '../apod.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {

  version: string;
  apods: IApod[] = [];
  showSearchbar = false;
  searchTerm = '';
  @ViewChild('searchbar', {static: false})
  searchbar: IonSearchbar;
  private offset = 0;

  private initEventHandler = () => this.init();

  constructor(private readonly apodService: ApodService,
              private readonly loadingCtrl: LoadingController,
              private readonly events: Events) {
  }

  async ngOnInit() {
    this.events.subscribe('apods_updated', this.initEventHandler);
    this.init();

    window.addEventListener('online', this.initEventHandler);
    window.addEventListener('offline', this.initEventHandler);
  }

  ngOnDestroy(): void {
    this.events.unsubscribe('apods_updated', this.initEventHandler);
    window.removeEventListener('online', this.initEventHandler);
    window.removeEventListener('offline', this.initEventHandler);
  }

  doRefresh(event) {
    this.apodService.init().then(() => event.target.complete());
  }

  async init() {
    this.apods = [];
    this.offset = 0;
    this.readDataFromDb();
  }

  async doInfinite(event) {
    this.offset += 5;
    await this.readDataFromDb();
    event.target.complete();
  }

  trackBy(index, item: IApod) {
    return item.date;
  }

  imageURL(apod: IApod) {
    return `${environment.serverURL}/img/${apod.date}/n`;
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

    } else {
      this.searchTerm = '';
    }
    this.init();
  }

  private async readDataFromDb() {
    let apodsFromDb = [];

    if (navigator.onLine) {
      apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);

      if (apodsFromDb.length === 0 && this.searchTerm.trim().length === 0) {
        const loading = await this.loadingCtrl.create({
          message: 'Please wait...'
        });

        await loading.present();

        await this.apodService.init();
        loading.dismiss();
        apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);
      }

    } else {
      apodsFromDb = await this.getCachedApods();
    }

    this.apods.push(...apodsFromDb);
  }

  private async getCachedApods(): Promise<IApod[]> {
    const cachedApods = [];
    let apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);
    while (cachedApods.length < 5 && apodsFromDb.length > 0) {
      for (const a of apodsFromDb) {
        const imagesCache = await caches.open('images');
        const response = await imagesCache.match(`${environment.serverURL}/img/${a.date}/n`);
        if (response) {
          cachedApods.push(a);
        }
      }
      this.offset += 5;
      apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);
    }
    return cachedApods;
  }

}
