import {Component, OnInit} from '@angular/core';
import {IApod} from '../protos/apod';
import {NavController} from '@ionic/angular';
import {ApodService} from '../apod.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {

  selectedApod: IApod | null | undefined;

  constructor(private readonly navCtrl: NavController,
              private readonly route: ActivatedRoute,
              private readonly apodService: ApodService) {
  }

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
