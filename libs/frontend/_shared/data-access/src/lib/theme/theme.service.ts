import { DOCUMENT, inject, Injectable, RendererFactory2, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private renderer2 = inject(RendererFactory2).createRenderer(null, null);

  darkMode = signal(true);

  init() {
    this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.toggleDarkMode(event.matches);
    });
  }

  toggleDarkMode(val?: boolean) {
    if (val !== undefined) {
      this.darkMode.set(val);
    } else {
      this.darkMode.update((val) => !val);
    }
    if (!this.darkMode()) {
      this.renderer2.removeClass(this.document.body, 'dark-theme');
    } else {
      this.renderer2.addClass(this.document.body, 'dark-theme');
    }
  }
}
