import { inject, provideAppInitializer } from '@angular/core';
import { PwaUpdateService } from './pwa-update.service';

/**
 * Provides PWA update notification functionality.
 * This function sets up the PwaUpdateService to monitor for app updates
 * and display notifications to users when updates are available.
 *
 * @example
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // other providers...
 *     PROVIDE_PWA_NOTIFICATIONS,
 *   ],
 * };
 * ```
 */
export const PROVIDE_PWA_NOTIFICATIONS = provideAppInitializer(() => {
  inject(PwaUpdateService);
});
