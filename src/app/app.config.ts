import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { FakeDbService } from '../@fake-db/fake-db.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // ✅ HTTP Client with interceptors
    provideHttpClient(
      withInterceptorsFromDi()
    ),

    // ✅ Mock API (optional)
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
