import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const LANDING_SECTIONS = [
  {
    routerLink: '/admin/home-management/introduction',
    name: 'Hero',
    description: 'Main heading, background image, and search title',
    icon: 'web_asset',
  },
  {
    routerLink: '/admin/home-management/description',
    name: 'Programs overview',
    description: 'Introduction to the financial programs',
    icon: 'dashboard',
  },
  {
    routerLink: '/admin/home-management/financial-facts',
    name: 'Financial facts',
    description: 'Statistics and their source',
    icon: 'query_stats',
  },
  {
    routerLink: '/admin/home-management/what-we-are',
    name: 'Who we are',
    description: 'Organization and program purpose copy',
    icon: 'groups',
  },
] as const;

@Component({
  selector: 'mas-home-management',
  imports: [MatIcon, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand">Website content</p>
        <h1 class="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Landing page</h1>
        <p class="mt-3 text-base leading-7 text-ink-muted">
          Choose a section to update. Changes are published to the landing page when you save them.
        </p>
      </div>

      <nav class="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Landing page sections">
        @for (section of sections; track section.routerLink) {
          <a
            class="group rounded-2xl border border-outline bg-surface-raised p-4 transition-colors hover:border-brand hover:bg-brand-soft/30"
            [routerLink]="section.routerLink"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: true }"
            [class.border-brand]="rla.isActive"
            [class.bg-brand-soft]="rla.isActive"
            [attr.aria-current]="rla.isActive ? 'page' : null"
          >
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-brand-strong group-hover:bg-surface"
            >
              <mat-icon>{{ section.icon }}</mat-icon>
            </span>
            <span class="mt-4 block font-bold text-ink">{{ section.name }}</span>
            <span class="mt-1 block text-sm leading-5 text-ink-muted">{{ section.description }}</span>
          </a>
        }
      </nav>

      <section class="mt-8 overflow-hidden rounded-3xl border border-outline bg-surface-raised">
        <router-outlet />
      </section>
    </div>
  `,
  host: { class: 'block min-h-full bg-canvas' },
})
export default class EducationManagementComponent {
  readonly sections = LANDING_SECTIONS;
}
