import {Component} from '@angular/core';
import {NavParams} from 'ionic-angular';
import {IApod} from "../../protos/apod";
import {ENV} from "@app/env";
import {ApodProvider} from "../../providers/apod/apod";

@Component({
  selector: 'page-full',
  templateUrl: 'full.html',
})
export class FullPage {

  selectedApod: IApod;
  imgSrc: string = null;
  imgHeight: number = null;
  imgWidth: number = null;

  constructor(private readonly navParams: NavParams,
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

    const image = new Image();
    image.onload = () => {
      this.imgHeight = image.naturalHeight;
      this.imgWidth = image.naturalWidth;
      this.imgSrc = image.src;
    };
    image.src = this.imageURL();
  }

  imageURL() {
    if (this.selectedApod) {
      return `${ENV.SERVER_URL}/img/${this.selectedApod.date}/hd`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }
}
