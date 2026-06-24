import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IApod } from '../protos/apod';
import { environment } from '../../environments/environment';
import { ApodService } from '../apod.service';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonRouterLink,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  LoadingController,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { caretDown, search } from 'ionicons/icons';
import { addIcons } from 'ionicons';

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
    FormsModule,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  apods: IApod[] = [];
  showSearchbar = false;
  searchTerm = '';
  readonly searchbar = viewChild.required<IonSearchbar>('searchbar');
  private readonly apodService = inject(ApodService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadingCtrl = inject(LoadingController);
  private offset = 0;
  private loadGeneration = 0;

  constructor() {
    addIcons({ search, caretDown });
  }

  async ngOnInit(): Promise<void> {
    this.apodService.updates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(this.initEventHandler);
    this.init();

    window.addEventListener('online', this.initEventHandler);
    window.addEventListener('offline', this.initEventHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.initEventHandler);
    window.removeEventListener('offline', this.initEventHandler);
  }

  doRefresh(event: RefresherCustomEvent): void {
    this.apodService.init().finally(() => event.target.complete());
  }

  async init(): Promise<void> {
    const generation = ++this.loadGeneration;
    this.apods = [];
    this.offset = 0;
    this.changeDetectorRef.markForCheck();
    await this.readDataFromDb(generation);
  }

  async doInfinite(event: InfiniteScrollCustomEvent): Promise<void> {
    const generation = this.loadGeneration;
    this.offset += 5;
    try {
      await this.readDataFromDb(generation);
    } finally {
      event.target.complete();
    }
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

  triggerSearchInput(event: CustomEvent<{ value?: string | null }>): void {
    this.searchTerm = event.detail.value ?? '';
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.searchTerm = '';
    }
    this.init();
  }

  private initEventHandler = () => this.init();

  private async readDataFromDb(generation: number): Promise<void> {
    if (navigator.onLine) {
      let apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);
      if (generation !== this.loadGeneration) {
        return;
      }

      if (apodsFromDb.length === 0 && this.searchTerm.trim().length === 0) {
        const loading = await this.loadingCtrl.create({
          message: 'Please wait...',
        });

        try {
          await loading.present();

          await this.apodService.init();
          apodsFromDb = await this.apodService.getApods(this.offset, 5, this.searchTerm);
        } finally {
          await loading.dismiss();
        }
        if (generation !== this.loadGeneration) {
          return;
        }
      }

      this.apods.push(...apodsFromDb);
      this.changeDetectorRef.markForCheck();
      return;
    }

    const apodsFromDb = await this.getCachedApods();
    if (generation !== this.loadGeneration) {
      return;
    }
    this.apods.push(...apodsFromDb);
    this.changeDetectorRef.markForCheck();
  }

  private async getCachedApods(): Promise<IApod[]> {
    const cachedApods: IApod[] = [];
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
