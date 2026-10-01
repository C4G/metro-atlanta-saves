import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { EducationalCategoryFormComponent } from './educational-categories/ui/educational-category-form/educational-category-form.component';
import { EducationalContentFormComponent } from './educational-content/ui/educational-content-form/educational-content-form.component';

@Component({
  selector: 'mas-education-management',
  imports: [MatIcon, RouterLink, RouterOutlet, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[76rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="flex flex-col items-stretch gap-6 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
            Content & guidance
          </p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            Educational resources
          </h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Organize the practical tools and updates members rely on. Choose a workspace below, then create or refine
            content.
          </p>
        </div>
        <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button mat-raised-button color="primary" class="!min-h-11 !rounded-xl" (click)="openContentModal()">
            <mat-icon>add</mat-icon>
            New resource
          </button>
          <button mat-button class="!min-h-11 !rounded-xl !text-[var(--primary)]" (click)="openCategoryModal()">
            <mat-icon>add</mat-icon>
            New category
          </button>
        </div>
      </header>

      <section class="pt-1" aria-labelledby="area-picker-heading">
        <div class="mb-4">
          <p class="mb-1 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">Choose an area</p>
          <h2 class="text-lg font-bold tracking-tight text-[var(--text-primary)]" id="area-picker-heading">
            What would you like to manage?
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
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
                class="!mt-1 !text-lg !text-[var(--primary)] transition-transform group-hover:translate-x-1"
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
export default class EducationManagementComponent {
  private dialog = inject(MatDialog);

  areas = computed(() => [
    {
      routerLink: '/admin/education-management/educational-content',
      name: 'Resources',
      description: 'Create and update the articles, links, and tools in your library.',
      icon: 'auto_stories',
    },
    {
      routerLink: '/admin/education-management/educational-categories',
      name: 'Categories',
      description: 'Create clear groupings that make resources easier to find.',
      icon: 'category',
    },
    {
      routerLink: '/admin/education-management/content-notifications',
      name: 'Notifications',
      description: 'Choose how to keep members informed about new content.',
      icon: 'notifications',
    },
  ]);

  openContentModal() {
    this.dialog.open(EducationalContentFormComponent, { panelClass: 'w-full' });
  }

  openCategoryModal() {
    this.dialog.open(EducationalCategoryFormComponent, { panelClass: 'w-full' });
  }
}
