import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '@angular/core';

export const authServerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformRequest = inject(REQUEST, { optional: true });

  // Only run on server when REQUEST token is available
  if (platformRequest) {
    const cookieHeader = platformRequest.headers.get('cookie');

    if (cookieHeader) {
      req = req.clone({ setHeaders: { cookie: cookieHeader }, withCredentials: true });
    }
  }

  return next(req);
};
