import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../data-access/auth.store';

/** Allows the public landing page only for visitors who are not signed in. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  const result = () => (authStore.user() ? router.createUrlTree(['/dashboard']) : true);

  if (authStore.authRefreshed()) {
    return result();
  }

  return toObservable(authStore.authRefreshed).pipe(filter(Boolean), take(1), map(result));
};
