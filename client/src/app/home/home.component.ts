import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {IApod} from '../protos/apod';
import {environment} from '../../environments/environment';
import {IonSearchbar, LoadingController} from '@ionic/angular';
import {ApodService} from '../apod.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  apods: IApod[] = [];
  showSearchbar = false;
  searchTerm = '';
  @ViewChild('searchbar')
  searchbar!: IonSearchbar;
  private offset = 0;
  private updatesSubscription!: Subscription;

  constructor(private readonly apodService: ApodService,
              private readonly loadingCtrl: LoadingController) {
  }

  private initEventHandler = () => this.init();

  async ngOnInit(): Promise<void> {
    this.updatesSubscription = this.apodService.updates.subscribe(this.initEventHandler);
    this.init();

    window.addEventListener('online', this.initEventHandler);
    window.addEventListener('offline', this.initEventHandler);
  }

  ngOnDestroy(): void {
    this.updatesSubscription.unsubscribe();
    window.removeEventListener('online', this.initEventHandler);
    window.removeEventListener('offline', this.initEventHandler);
  }

  doRefresh(event: Event): void {
    // @ts-ignore
    this.apodService.init().then(() => event.target?.complete());
  }

  async init(): Promise<void> {
    this.apods = [];
    this.offset = 0;
    this.readDataFromDb();
  }

  async doInfinite(event: Event): Promise<void> {
    this.offset += 5;
    await this.readDataFromDb();
    // @ts-ignore
    event.target?.complete();
  }

  trackBy(index: number, item: IApod): string | null | undefined {
    return item.date;
  }

  imageURL(apod: IApod): string {
    return `${environment.serverURL}/img/${apod.date}/n`;
  }

  toggleSearch(): void {
    this.showSearchbar = !this.showSearchbar;
    setTimeout(() => {
      if (this.searchbar) {
        this.searchbar.setFocus();
      }
    }, 1);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.toggleSearch();

    this.init();
  }

  triggerSearchInput(event: Event): void {
    // @ts-ignore
    this.searchTerm = event.target.value;
    if (this.searchTerm && this.searchTerm.trim() !== '') {

    } else {
      this.searchTerm = '';
    }
    this.init();
  }

  private async readDataFromDb(): Promise<void> {
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
