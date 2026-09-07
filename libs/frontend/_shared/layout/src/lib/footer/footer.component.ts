import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-footer',
  imports: [MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-slate-200 bg-white px-5 py-7 sm:px-8">
      <div class="mx-auto flex max-w-7xl flex-col gap-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
        <div class="flex items-center justify-center gap-3 sm:justify-start">
          <span class="brand-logo-frame flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <img
              src="assets/Logo/brp-logo-community-no-arrow.png"
              width="28"
              height="28"
              class="brand-logo h-7 w-7 object-contain"
              alt=""
            />
          </span>
          <div class="text-left">
            <p class="text-xs font-bold tracking-tight text-slate-900">Building Resilient Professionals</p>
            <p class="mt-0.5 text-[11px] text-slate-500">Financial wellbeing for stronger communities</p>
          </div>
        </div>
        <p class="order-3 text-center text-xs text-slate-500 sm:order-none sm:justify-self-center">
          © {{ currentYear() }} Building Resilient Professionals
        </p>
        <div
          class="order-2 flex flex-col items-center gap-2 text-center sm:order-none sm:justify-self-end sm:items-end sm:text-right"
        >
          <div class="flex items-center justify-center gap-1 sm:justify-end">
            <a
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              routerLink="/about-us"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">info</mat-icon>
              About us
            </a>
            <a
              class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              routerLink="/team"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">groups</mat-icon>
              C4G Team
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host(.footer--dark) footer {
        border-color: rgba(255, 255, 255, 0.1);
        background: #090f1d;
      }
      :host(.footer--dark) ::ng-deep .bg-teal-50 {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.footer--dark) ::ng-deep .text-slate-900 {
        color: #f1f5f9 !important;
      }
      :host(.footer--dark) ::ng-deep .text-slate-500 {
        color: #94a3b8 !important;
      }
      :host(.footer--dark) ::ng-deep .text-teal-700 {
        color: #5eead4 !important;
      }
      :host(.footer--dark) ::ng-deep .hover\\:bg-teal-50:hover {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.footer--dark) ::ng-deep .hover\\:text-teal-900:hover {
        color: #99f6e4 !important;
      }
      :host(.footer--dark) .brand-logo-frame {
        background: linear-gradient(145deg, #12334a, #0f766e) !important;
      }
      :host(.footer--dark) .brand-logo {
        filter: brightness(0) saturate(100%) invert(89%) sepia(23%) saturate(731%) hue-rotate(119deg) brightness(101%)
          contrast(96%);
      }
    `,
  ],
  host: {
    class: 'block',
    '[class.footer--dark]': 'themeService.darkMode()',
  },
})
export class FooterComponent {
  readonly themeService = inject(ThemeService);
  readonly currentYear = signal(new Date().getFullYear());
}
