import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [IonRouterOutlet, IonApp],
})
export class AppComponent {}
