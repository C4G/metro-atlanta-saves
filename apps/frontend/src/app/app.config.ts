import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor, authServerInterceptor } from '@mas/frontend-shared-auth';
import { provideNativeDateAdapter } from '@angular/material/core';
import { PROVIDE_PWA_NOTIFICATIONS } from '@mas/frontend-shared-layout';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withHttpTransferCacheOptions({
        includeHeaders: ['Authorization', 'ETag', 'Cache-Control', 'Content-Type'],
        includePostRequests: true,
        includeRequestsWithAuthHeaders: true,
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authServerInterceptor, authInterceptor])),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
      }),
      withViewTransitions(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideServiceWorker('sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideNativeDateAdapter(),
    provideZonelessChangeDetection(),
    PROVIDE_PWA_NOTIFICATIONS,
  ],
};
