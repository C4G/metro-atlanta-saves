import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from '../data-access/auth.store';

export const partnerStaffGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  const result = () => {
    if (!authStore.user()) return router.createUrlTree(['/login']);
    return authStore.isStaff() ? true : router.createUrlTree(['/dashboard']);
  };

  if (authStore.authRefreshed()) {
    return result();
  }

  return toObservable(authStore.authRefreshed).pipe(filter(Boolean), take(1), map(result));
};
