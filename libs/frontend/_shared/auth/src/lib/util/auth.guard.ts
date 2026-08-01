import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from './cookie.service';
import { decodeJwt } from './jwt-decode';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const cookieService = inject(CookieService);

  const token = cookieService.getCookie('accessToken');
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const decoded = decodeJwt(token);
  return decoded ? true : router.createUrlTree(['/login']);
};
