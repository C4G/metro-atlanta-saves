import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { REQUEST } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookieService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly request = inject(REQUEST, { optional: true });

  setCookie(name: string, value: string, days = 7): void {
    if (!this.isBrowser) return;

    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }

  getCookie(name: string): string | null {
    if (this.isBrowser) {
      // Browser: read from document.cookie
      const nameEQ = `${name}=`;
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    } else if (this.request) {
      // Server: read from request headers
      const cookieHeader = this.request.headers.get('cookie');
      if (!cookieHeader) return null;

      const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
      return match ? match[1] : null;
    }

    return null;
  }

  deleteCookie(name: string): void {
    if (!this.isBrowser) return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}
