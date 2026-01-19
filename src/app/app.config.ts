import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { FakeDbService } from '../@fake-db/fake-db.service';
import { AuthInterceptor } from '../@core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // ✅ HTTP Client with interceptors
    provideHttpClient(
      withInterceptorsFromDi()
    ),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

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
