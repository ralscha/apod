import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy, RouterModule, Routes} from '@angular/router';
import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {CommonModule} from '@angular/common';
import {DetailComponent} from './detail/detail.component';
import {FullComponent} from './full/full.component';
import {FormsModule} from '@angular/forms';

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'detail/:date', component: DetailComponent},
  {path: 'full/:date', component: FullComponent},
  {path: '**', redirectTo: '/home'}
];

@NgModule({
  declarations: [AppComponent, HomeComponent, DetailComponent, FullComponent],
  entryComponents: [],
  imports: [BrowserModule,
    CommonModule,
    FormsModule,
    IonicModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' })
  ],
  providers: [
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
