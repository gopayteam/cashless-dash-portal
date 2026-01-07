import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { FakeDbService } from '../@fake-db/fake-db.service';
import { importProvidersFrom } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    ...(environment.useMockApi
      ? [
          importProvidersFrom(
            InMemoryWebApiModule.forRoot(FakeDbService, {
              delay: 500,
              apiBase: '/api/',
              passThruUnknownUrl: true,
            })
          ),
        ]
      : []),
  ],
};
