import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { CohortsStore } from '@mas/frontend-shared-data-access';
import type { Cohort } from '@mas/prisma-client/browser';
import { AddCohortComponent } from './ui/add-cohort/add-cohort.component';

@Component({
  selector: 'mas-about-us-management',
  imports: [DatePipe, MatButton, MatIcon, MatIconButton, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[76rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="mb-8 flex flex-col items-stretch gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
            Content & guidance
          </p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
            About us
          </h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Introduce the people and cohorts behind BRP with clear, welcoming stories that build trust.
          </p>
        </div>
        <button
          mat-raised-button
          color="primary"
          class="!min-h-[2.85rem] !w-full !rounded-[0.8rem] !whitespace-nowrap sm:!w-auto"
          (click)="openModal()"
        >
          <mat-icon>add</mat-icon>
          Add cohort
        </button>
      </header>

      @if (cohortsStore.cohorts().length) {
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="About us cohorts">
          @for (cohort of cohortsStore.cohorts(); track cohort.id) {
            <article
              class="overflow-hidden rounded-[1.1rem] border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card)] transition duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)]"
            >
              <div class="aspect-[16/7] overflow-hidden bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]">
                <img class="size-full object-cover" [src]="cohort.imageUrl" [alt]="cohort.name" />
              </div>
              <div class="p-5">
                <div class="flex items-center justify-between gap-4">
                  <h2 class="text-xl font-bold tracking-[-0.035em] text-[var(--text-primary)]">{{ cohort.name }}</h2>
                  <span
                    class="rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.05em] text-[var(--primary)]"
                  >
                    About us
                  </span>
                </div>
                <p class="my-3 line-clamp-3 leading-relaxed text-[var(--text-secondary)]">{{ cohort.description }}</p>
                <footer class="flex items-center justify-between gap-4">
                  <time
                    class="text-xs text-[var(--text-secondary)]"
                    [attr.datetime]="cohort.updatedAt | date: 'yyyy-MM-dd'"
                  >
                    Updated {{ cohort.updatedAt | date: 'MMM d, y' }}
                  </time>
                  <div class="flex gap-0.5">
                    <button
                      mat-icon-button
                      matTooltip="Edit cohort"
                      aria-label="Edit cohort"
                      class="!text-[var(--text-secondary)]"
                      (click)="openEdit(cohort)"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Delete cohort"
                      aria-label="Delete cohort"
                      class="!text-[var(--text-secondary)] hover:!bg-red-500/10 hover:!text-red-700 dark:hover:!text-red-300"
                      (click)="openConfirm(cohort)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </footer>
              </div>
            </article>
          }
        </section>
      } @else {
        <section
          class="grid min-h-80 place-content-center rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--primary)_38%,transparent)] p-8 text-center"
        >
          <mat-icon class="!mx-auto !mb-3 !size-9 !text-4xl !text-[var(--primary)]" aria-hidden="true">groups</mat-icon>
          <h2 class="text-xl font-bold tracking-[-0.035em] text-[var(--text-primary)]">Start telling your story.</h2>
          <p class="mx-auto mb-4 mt-2 max-w-md text-[var(--text-secondary)]">
            Add a cohort to introduce the people and purpose behind BRP.
          </p>
          <button mat-raised-button color="primary" (click)="openModal()">Add your first cohort</button>
        </section>
      }
    </main>
  `,
  host: { class: 'block' },
})
export default class AboutUsManagementComponent {
  private dialog = inject(MatDialog);
  cohortsStore = inject(CohortsStore);
  constructor() {
    this.cohortsStore.getCohorts();
  }
  openModal() {
    this.dialog.open(AddCohortComponent, { panelClass: 'w-full' });
  }
  openEdit(cohort: Cohort) {
    this.dialog.open(AddCohortComponent, { data: cohort, panelClass: 'w-full' });
  }
  openConfirm(cohort: Cohort) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete cohort',
        content: `Are you sure you want to delete ${cohort.name}?`,
        color: 'warn',
        onYesClick: () => this.cohortsStore.deleteCohort(cohort.id),
      },
    });
  }
}
