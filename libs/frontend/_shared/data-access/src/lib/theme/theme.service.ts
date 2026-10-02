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

  readonly darkMode = signal(false);

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.applyTheme(this.readThemeCookie() === 'dark');
  }

  toggleDarkMode(value?: boolean): void {
    const darkMode = value ?? !this.darkMode();
    if (isPlatformBrowser(this.platformId)) {
      this.document.cookie = `${THEME_COOKIE}=${darkMode ? 'dark' : 'light'}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
    this.applyTheme(darkMode);
  }

  private readThemeCookie(): 'dark' | 'light' | undefined {
    const cookieHeader = isPlatformBrowser(this.platformId)
      ? this.document.cookie
      : (this.request?.headers.get('cookie') ?? '');
    const value = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .find(([name]) => name === THEME_COOKIE)?.[1];
    return value === 'dark' || value === 'light' ? value : undefined;
  }

  private applyTheme(darkMode: boolean): void {
    this.darkMode.set(darkMode);
    this.renderer2[darkMode ? 'addClass' : 'removeClass'](this.document.body, 'dark-theme');
  }
}
