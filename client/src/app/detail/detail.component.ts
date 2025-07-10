import {Component, inject, OnInit} from '@angular/core';
import {IApod} from '../protos/apod';
import {ApodService} from '../apod.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  NavController
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent
  ]
})
export class DetailComponent implements OnInit {
  selectedApod: IApod | null | undefined;
  private readonly navCtrl = inject(NavController);
  private readonly route = inject(ActivatedRoute);
  private readonly apodService = inject(ApodService);

  async ngOnInit(): Promise<void> {
    const date = this.route.snapshot.paramMap.get('date');
    this.selectedApod = await this.apodService.getApod(date);
  }

  async showFull(): Promise<void> {
    if (navigator.onLine) {
      this.navCtrl.navigateForward(['/full', this.selectedApod?.date]);
    } else {
      const imagesCache = await caches.open('images');
      const response = await imagesCache.match(this.imageHDURL());
      if (response) {
        this.navCtrl.navigateForward(['/full', this.selectedApod?.date]);
      }
    }
  }

  imageHDURL(): string {
    if (this.selectedApod) {
      return `${environment.serverURL}/img/${this.selectedApod.date}/hd`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

  imageURL(): string {
    if (this.selectedApod) {
      return `${environment.serverURL}/img/${this.selectedApod.date}/n`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

}
