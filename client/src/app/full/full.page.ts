import {Component, OnInit} from '@angular/core';
import {IApod} from '../protos/apod';
import {ApodService} from '../apod.service';
import {environment} from '../../environments/environment';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-full',
  templateUrl: './full.page.html',
  styleUrls: ['./full.page.scss'],
})
export class FullPage implements OnInit {

  selectedApod: IApod;
  imgSrc: string = null;
  imgHeight: number = null;
  imgWidth: number = null;

  constructor(private readonly route: ActivatedRoute,
              private readonly apodService: ApodService) {
  }

  imageURL() {
    if (this.selectedApod) {
      return `${environment.serverURL}/img/${this.selectedApod.date}/hd`;
    }
    return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  }

  async ngOnInit() {
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
