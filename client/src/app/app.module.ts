import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import {IonicApp, IonicErrorHandler, IonicModule} from 'ionic-angular';
import {MyApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {FullPage} from "../pages/full/full";
import {DetailPage} from "../pages/detail/detail";

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    FullPage,
    DetailPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {}, {
      links: [
        { component: HomePage, name: 'Home', segment: 'home' },
        { component: DetailPage, name: 'Detail', segment: 'detail/:date', defaultHistory: [HomePage] },
        { component: FullPage, name: 'Full', segment: 'full/:date', defaultHistory: [HomePage] }
      ]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    FullPage,
    DetailPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {
}
