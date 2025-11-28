import { provideZoneChangeDetection } from "@angular/core";
import {Workbox} from 'workbox-window';
import {provideRouter, RouteReuseStrategy, Routes, withHashLocation} from '@angular/router';
import {bootstrapApplication} from '@angular/platform-browser';
import {HomeComponent} from './app/home/home.component';
import {DetailComponent} from './app/detail/detail.component';
import {FullComponent} from './app/full/full.component';
import {AppComponent} from './app/app.component';
import {IonicRouteStrategy, provideIonicAngular} from "@ionic/angular/standalone";

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'detail/:date', component: DetailComponent},
  {path: 'full/:date', component: FullComponent},
  {path: '**', redirectTo: '/home'}
];


function loadServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('service-worker.js');
    wb.register();
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideIonicAngular(),
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideRouter(routes, withHashLocation())
  ]
})
  .then(() => loadServiceWorker())
  .catch(err => console.error(err));
