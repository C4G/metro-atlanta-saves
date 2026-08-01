import { inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authStore = inject(AuthStore);
  return next(
    !authStore.user() ? req : req.clone({ setHeaders: { authorization: `Bearer ${authStore.user()?.accessToken}` } }),
  );
};
