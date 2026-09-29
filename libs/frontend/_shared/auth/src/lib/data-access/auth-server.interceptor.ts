import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '@angular/core';

export const authServerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformRequest = inject(REQUEST, { optional: true });

  // Only run on server when REQUEST token is available
  if (platformRequest) {
    const cookieHeader = platformRequest.headers.get('cookie');
    const pageUrl = platformRequest.url ? new URL(platformRequest.url) : null;
    const requestUrl = pageUrl ? new URL(req.url, pageUrl) : null;

    if (requestUrl && pageUrl) {
      const isSameOrigin = requestUrl.origin === pageUrl.origin;
      req = req.clone({
        url: requestUrl.toString(),
        ...(isSameOrigin && cookieHeader ? { setHeaders: { cookie: cookieHeader } } : {}),
        ...(isSameOrigin ? { withCredentials: true } : {}),
      });
    } else if (cookieHeader) {
      req = req.clone({ setHeaders: { cookie: cookieHeader }, withCredentials: true });
    }
  }

  return next(req);
};
