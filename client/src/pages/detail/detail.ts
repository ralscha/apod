import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {IApod} from "../../protos/apod";
import {ENV} from "@app/env";
import {FullPage} from "../full/full";
import {ApodProvider} from "../../providers/apod/apod";

@Component({
  selector: 'page-detail',
  templateUrl: 'detail.html',
})
export class DetailPage {

  selectedApod: IApod;

  constructor(private readonly navCtrl: NavController,
              private readonly navParams: NavParams,
              private readonly apodProvider: ApodProvider) {
  }

  async ionViewWillEnter() {
    const navData = this.navParams.data;
    if (Object.keys(navData).length === 1) {
      this.selectedApod = await this.apodProvider.getApod(navData);
    }
    else {
      this.selectedApod = this.navParams.data;
    }
  }

  ionViewWillLeave() {
    this.navCtrl.getPrevious().data.fromDetail = true;
  }

  async showFull() {
    const response = await caches.match(this.imageURL(), {cacheName: 'images'});
    if (response) {
      this.navCtrl.push(FullPage, this.selectedApod);
    }
  }

  imageURL() {
    if (this.selectedApod) {
      return `${ENV.SERVER_URL}/img/${this.selectedApod.date}/n`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

}
