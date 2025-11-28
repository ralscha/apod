import {Component, inject, OnDestroy, OnInit, viewChild} from '@angular/core';
import {IApod} from '../protos/apod';
import {environment} from '../../environments/environment';
import {ApodService} from '../apod.service';
import {Subscription} from 'rxjs';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonRouterLink,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  LoadingController
} from "@ionic/angular/standalone";
import {RouterLink} from "@angular/router";
import {FormsModule} from "@angular/forms";

import {addIcons} from "ionicons";
import {caretDown, search} from "ionicons/icons";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    RouterLink,
    IonRouterLink,
    FormsModule
]
})
export class HomeComponent implements OnInit, OnDestroy {
  apods: IApod[] = [];
  showSearchbar = false;
  searchTerm = '';
  readonly searchbar = viewChild.required<IonSearchbar>('searchbar');
  private readonly apodService = inject(ApodService);
  private readonly loadingCtrl = inject(LoadingController);
  private offset = 0;
  private updatesSubscription!: Subscription;

  constructor() {
    addIcons({search, caretDown});
  }

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
    // @ts-expect-error: Event target type is not properly typed in Ionic refresh event
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
    // @ts-expect-error: Event target type is not properly typed in Ionic infinite scroll event
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
      const searchbar = this.searchbar();
      if (searchbar) {
        searchbar.setFocus();
      }
    }, 1);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.toggleSearch();

    this.init();
  }

  triggerSearchInput(event: Event): void {
    // @ts-expect-error: Event target type doesn't include value property for input events
    this.searchTerm = event.target.value;
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.searchTerm = '';
    }
    this.init();
  }

  private initEventHandler = () => this.init();

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
