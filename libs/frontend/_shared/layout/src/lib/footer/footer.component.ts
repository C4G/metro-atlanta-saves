import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mas-footer',
  imports: [MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-slate-200 bg-white px-5 py-7 dark:border-white/10 dark:bg-[#090f1d] sm:px-8">
      <div class="mx-auto flex max-w-7xl flex-col gap-5 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
        <div class="flex items-center justify-center gap-3 sm:justify-start">
          <span
            class="flex size-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-gradient-to-br dark:from-[#12334a] dark:to-teal-700"
          >
            <img
              src="assets/Logo/brp-logo-community-no-arrow.png"
              width="28"
              height="28"
              class="size-7 object-contain dark:brightness-0 dark:invert"
              alt=""
            />
          </span>
          <div class="text-left">
            <p class="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Building Resilient Professionals
            </p>
            <p class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Financial wellbeing for stronger communities
            </p>
          </div>
        </div>
        <p class="order-3 text-center text-xs text-slate-500 dark:text-slate-400 sm:order-none sm:justify-self-center">
          © {{ currentYear() }} Building Resilient Professionals
        </p>
        <nav
          class="order-2 flex items-center justify-center gap-1 sm:order-none sm:justify-self-end"
          aria-label="Footer"
        >
          <a
            class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
            routerLink="/privacy-policy"
          >
            <mat-icon class="!size-4 !text-base !leading-4">policy</mat-icon>
            Privacy
          </a>
          <a
            class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
            routerLink="/about-us"
          >
            <mat-icon class="!size-4 !text-base !leading-4">info</mat-icon>
            About us
          </a>
          <a
            class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
            routerLink="/team"
          >
            <mat-icon class="!size-4 !text-base !leading-4">groups</mat-icon>
            C4G Team
          </a>
        </nav>
      </div>
    </footer>
  `,
  host: { class: 'block' },
})
export class FooterComponent {
  readonly currentYear = signal(new Date().getFullYear());
}
