import {Component, inject, OnInit} from '@angular/core';
import {IApod} from '../protos/apod';
import {ApodService} from '../apod.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';
import {IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";

@Component({
  selector: 'app-full',
  templateUrl: './full.component.html',
  styleUrl: './full.component.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent
  ]
})
export class FullComponent implements OnInit {
  selectedApod!: IApod | null | undefined;
  imgSrc!: string;
  imgHeight!: number;
  imgWidth!: number;
  private readonly route = inject(ActivatedRoute);
  private readonly apodService = inject(ApodService);

  imageURL(): string {
    if (this.selectedApod) {
      return `${environment.serverURL}/img/${this.selectedApod.date}/hd`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

  async ngOnInit(): Promise<void> {
    const date = this.route.snapshot.paramMap.get('date');
    this.selectedApod = await this.apodService.getApod(date);

    const image = new Image();
    image.onload = () => {
      this.imgHeight = image.naturalHeight;
      this.imgWidth = image.naturalWidth;
      this.imgSrc = image.src;
    };
    image.src = this.imageURL();
  }

}
