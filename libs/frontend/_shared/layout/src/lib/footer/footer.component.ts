import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mas-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-outline/55 text-ink">
      <div
        class="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8"
      >
        <div class="flex items-center gap-2.5">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-soft">
            <img
              src="assets/Logo/brp-logo-community-no-arrow.png"
              height="24"
              width="24"
              class="h-6 w-6 object-contain [filter:var(--mas-logo-filter)]"
              alt=""
            />
          </span>
          <p class="text-xs text-ink-muted">
            © {{ currentYear() }} Building Resilient Professionals
            <span class="hidden md:inline">· Financial wellbeing for stronger communities</span>
          </p>
        </div>

        <nav class="flex flex-wrap items-center justify-center gap-2" aria-label="Footer">
          @for (link of links; track link.path) {
            <a
              class="inline-flex min-h-8 items-center rounded-lg border border-transparent px-2 text-xs font-bold text-brand-strong transition-colors hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              [routerLink]="link.path"
            >
              {{ link.label }}
            </a>
          }
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
  readonly links = [
    { path: '/privacy-policy', label: 'Privacy policy' },
    { path: '/about-us', label: 'About us' },
    { path: '/team', label: 'C4G Team' },
  ];
}
