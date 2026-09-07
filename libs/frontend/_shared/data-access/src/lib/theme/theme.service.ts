import { DOCUMENT, inject, Injectable, PLATFORM_ID, RendererFactory2, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private renderer2 = inject(RendererFactory2).createRenderer(null, null);
  private platformId = inject(PLATFORM_ID);
  private initialized = false;

  darkMode = signal(false);

  init() {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return;
    this.initialized = true;
    const storedTheme = localStorage.getItem('mas-theme');
    const mediaQuery = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    this.applyTheme(storedTheme ? storedTheme === 'dark' : (mediaQuery?.matches ?? false));
    mediaQuery?.addEventListener('change', (event) => {
      if (!localStorage.getItem('mas-theme')) this.applyTheme(event.matches);
    });
  }

  toggleDarkMode(val?: boolean) {
    const nextTheme = val ?? !this.darkMode();
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('mas-theme', nextTheme ? 'dark' : 'light');
    this.applyTheme(nextTheme);
  }

  private applyTheme(isDark: boolean) {
    this.darkMode.set(isDark);
    if (isDark) this.renderer2.addClass(this.document.body, 'dark-theme');
    else this.renderer2.removeClass(this.document.body, 'dark-theme');
  }
}
