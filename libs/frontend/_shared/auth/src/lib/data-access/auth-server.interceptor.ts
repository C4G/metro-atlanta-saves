import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '@angular/core';

export const authServerInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformRequest = inject(REQUEST, { optional: true });

  // Only run on server when REQUEST token is available
  if (platformRequest) {
    const cookieHeader = platformRequest.headers.get('cookie');

    if (cookieHeader) {
      // Extract accessToken from cookies
      const accessTokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

      // Clone the request and add both cookie header and Authorization header
      const headers: Record<string, string> = {
        cookie: cookieHeader,
      };

      if (accessToken) {
        headers['authorization'] = `Bearer ${accessToken}`;
      }

      req = req.clone({ setHeaders: headers });
    }
  }

  return next(req);
};
