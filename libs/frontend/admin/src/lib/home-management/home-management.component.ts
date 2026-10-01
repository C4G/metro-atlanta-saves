import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mas-home-management',
  imports: [RouterLink, RouterOutlet, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[76rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="pb-8">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">Landing page</p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            Home page
          </h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Shape the first experience for every visitor. Select a section to keep its message, stories, and learning
            moments current.
          </p>
        </div>
      </header>

      <section class="pt-1" aria-labelledby="area-picker-heading">
        <div class="mb-4">
          <p class="mb-1 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">Choose a section</p>
          <h2 class="text-lg font-bold tracking-tight text-[var(--text-primary)]" id="area-picker-heading">
            What do you want visitors to see?
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-3.5 min-[52rem]:grid-cols-2">
          @for (area of areas(); track area.routerLink) {
            <a
              class="group grid min-h-36 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card)] p-5 text-inherit no-underline transition duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_48%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface-card,transparent))]"
              [routerLink]="area.routerLink"
            >
              <div
                class="grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]"
              >
                <mat-icon class="!size-5 !text-xl" aria-hidden="true">{{ area.icon }}</mat-icon>
              </div>
              <div>
                <h3 class="mt-0.5 font-bold text-[var(--text-primary)]">{{ area.name }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{{ area.description }}</p>
              </div>
              <mat-icon
                class="!mt-1 !text-lg !text-[var(--primary)] transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                arrow_forward
              </mat-icon>
            </a>
          }
        </div>
      </section>
      <section class="mt-6"><router-outlet /></section>
    </main>
  `,
  host: { class: 'block' },
})
export default class HomeManagementComponent {
  areas = computed(() => [
    {
      routerLink: '/admin/home-management/stories',
      name: 'Stories',
      description: 'Highlight community experiences that make the program feel personal.',
      icon: 'format_quote',
    },
    {
      routerLink: '/admin/home-management/learnings',
      name: 'Learning',
      description: 'Curate the knowledge cards that invite people to explore further.',
      icon: 'school',
    },
    {
      routerLink: '/admin/home-management/description',
      name: 'Program description',
      description: 'Keep the core program message clear and welcoming.',
      icon: 'subject',
    },
    {
      routerLink: '/admin/home-management/introduction',
      name: 'Introduction',
      description: 'Refine the opening message and first impression.',
      icon: 'waving_hand',
    },
    {
      routerLink: '/admin/home-management/what-we-are',
      name: 'Who we are',
      description: 'Explain the purpose, people, and work behind BRP.',
      icon: 'diversity_3',
    },
  ]);
}
