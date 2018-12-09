import {Component, OnInit} from '@angular/core';
import {IApod} from '../protos/apod';
import {NavController} from '@ionic/angular';
import {ApodService} from '../apod.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  selectedApod: IApod;

  constructor(private readonly navCtrl: NavController,
              private readonly route: ActivatedRoute,
              private readonly apodService: ApodService) {
  }

  async ngOnInit() {
    const date = this.route.snapshot.paramMap.get('date');
    this.selectedApod = await this.apodService.getApod(date);
  }

  async showFull() {
    const response = await caches.match(this.imageURL(), {cacheName: 'images'});
    if (response) {
      this.navCtrl.navigateForward(['/full', this.selectedApod.date]);
    }
  }

  imageURL() {
    if (this.selectedApod) {
      return `${environment.serverURL}/img/${this.selectedApod.date}/n`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

}
