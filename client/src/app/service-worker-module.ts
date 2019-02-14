// Based on the Angular service worker module
// https://github.com/angular/angular/blob/master/packages/service-worker/src/module.ts

import {isPlatformBrowser} from '@angular/common';
import {APP_INITIALIZER, ApplicationRef, InjectionToken, Injector, ModuleWithProviders, NgModule, PLATFORM_ID} from '@angular/core';
import {filter, take} from 'rxjs/operators';

export abstract class RegistrationOptions {
  scope?: string;
  enabled?: boolean;
}

export const SCRIPT = new InjectionToken<string>('SERVICE_WORKER_REGISTER_SCRIPT');

export function swAppInitializer(
  injector: Injector, script: string, options: RegistrationOptions,
  platformId: string): () => void {
  const initializer = () => {
    const app = injector.get<ApplicationRef>(ApplicationRef);

    if (!(isPlatformBrowser(platformId) && ('serviceWorker' in navigator) &&
      options.enabled !== false)) {
      return;
    }

    const whenStable =
      app.isStable.pipe(filter((stable: boolean) => !!stable), take(1)).toPromise();

    whenStable.then(() => navigator.serviceWorker.register(script, {scope: options.scope}));
  };
  return initializer;
}


@NgModule()
export class ServiceWorkerModule {
  static register(script: string, opts: { scope?: string; enabled?: boolean; } = {}): ModuleWithProviders<ServiceWorkerModule> {
    return {
      ngModule: ServiceWorkerModule,
      providers: [
        {provide: SCRIPT, useValue: script},
        {provide: RegistrationOptions, useValue: opts},
        {
          provide: APP_INITIALIZER,
          useFactory: swAppInitializer,
          deps: [Injector, SCRIPT, RegistrationOptions, PLATFORM_ID],
          multi: true,
        },
      ],
    };
  }
}
