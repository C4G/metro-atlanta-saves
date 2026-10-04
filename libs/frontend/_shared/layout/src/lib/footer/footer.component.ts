import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mas-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-outline bg-surface px-5 py-7 text-ink sm:px-8">
      <div class="mx-auto grid max-w-7xl gap-5 text-center md:grid-cols-[1fr_auto_1fr] md:items-center md:text-left">
        <div>
          <p class="text-sm font-bold tracking-tight">Building Resilient Professionals</p>
          <p class="mt-1 text-xs text-ink-muted">Financial wellbeing for stronger communities</p>
        </div>

        <p class="text-xs text-ink-muted md:text-center">© {{ currentYear() }} Building Resilient Professionals</p>

        <nav class="flex flex-wrap items-center justify-center gap-1 md:justify-end" aria-label="Footer">
          <a
            class="rounded-lg px-2.5 py-2 text-xs font-bold text-brand-strong transition-colors hover:bg-brand-soft/55 hover:text-brand focus-visible:bg-brand-soft/55 focus-visible:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            routerLink="/privacy-policy"
          >
            Privacy policy
          </a>
          <a
            class="rounded-lg px-2.5 py-2 text-xs font-bold text-brand-strong transition-colors hover:bg-brand-soft/55 hover:text-brand focus-visible:bg-brand-soft/55 focus-visible:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            routerLink="/about-us"
          >
            About us
          </a>
          <a
            class="rounded-lg px-2.5 py-2 text-xs font-bold text-brand-strong transition-colors hover:bg-brand-soft/55 hover:text-brand focus-visible:bg-brand-soft/55 focus-visible:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            routerLink="/team"
          >
            C4G Team
          </a>
        </nav>
      </div>
    </footer>
  `,
  host: {
    class: 'block',
  },
})
export class FooterComponent {
  readonly currentYear = signal(new Date().getFullYear());
}
