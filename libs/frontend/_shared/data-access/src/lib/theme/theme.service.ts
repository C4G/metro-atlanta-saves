import { DOCUMENT, inject, Injectable, PLATFORM_ID, RendererFactory2, REQUEST, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const THEME_COOKIE = 'mas-theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private renderer2 = inject(RendererFactory2).createRenderer(null, null);
  private platformId = inject(PLATFORM_ID);
  private request = inject(REQUEST, { optional: true });
  private initialized = false;

  darkMode = signal(false);

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.applyTheme(this.readThemeCookie() === 'dark');
  }

  toggleDarkMode(val?: boolean) {
    const nextTheme = val ?? !this.darkMode();
    if (isPlatformBrowser(this.platformId)) {
      this.document.cookie = `${THEME_COOKIE}=${nextTheme ? 'dark' : 'light'}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
    this.applyTheme(nextTheme);
  }

  private readThemeCookie(): 'dark' | 'light' | undefined {
    const cookieHeader = this.request?.headers.get('cookie') ?? this.document.cookie;
    const value = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .find(([name]) => name === THEME_COOKIE)?.[1];
    return value === 'dark' || value === 'light' ? value : undefined;
  }

  private applyTheme(isDark: boolean) {
    this.darkMode.set(isDark);
    if (isDark) this.renderer2.addClass(this.document.body, 'dark-theme');
    else this.renderer2.removeClass(this.document.body, 'dark-theme');
  }
}
