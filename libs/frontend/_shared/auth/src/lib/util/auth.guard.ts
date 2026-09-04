import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from '../data-access/auth.store';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  if (authStore.authRefreshed()) {
    return authStore.user() ? true : router.createUrlTree(['/login']);
  }

  return toObservable(authStore.authRefreshed).pipe(
    filter(Boolean),
    take(1),
    map(() => (authStore.user() ? true : router.createUrlTree(['/login']))),
  );
};
