import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app/app.module';
import {Workbox} from 'workbox-window';

function loadServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('service-worker.js');
    wb.register();
  }
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => loadServiceWorker())
  .catch(err => console.error(err));
