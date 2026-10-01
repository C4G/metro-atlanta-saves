import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { type Requirement } from '@mas/prisma-client/browser';
import { RequirementsStore } from './requirements.store';
import { AddRequirementComponent } from './ui/add-requirement/add-requirement.component';

@Component({
  selector: 'mas-requirements',
  imports: [MatButtonModule, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Program setup
          </p>
          <h2 class="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-slate-100">Requirements</h2>
          <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
            A simple checklist of the steps participants complete during the program.
          </p>
        </div>
        <button
          mat-raised-button
          class="!rounded-xl !bg-teal-700 !text-[0.8125rem] !font-bold !text-cyan-50 dark:!bg-teal-400 dark:!text-teal-950"
          aria-label="Add requirement"
          (click)="openModal()"
        >
          <mat-icon>add</mat-icon>
          Add requirement
        </button>
      </div>
      <div class="mt-6 grid gap-2.5" aria-label="Program requirements">
        @for (requirement of requirementsStore.requirements(); track requirement.id; let index = $index) {
          <article
            class="flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-400/15 dark:bg-[#111a2c] program-requirement-record"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[0.8125rem] font-extrabold text-teal-800 dark:bg-teal-400/15 dark:text-teal-200"
            >
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ requirement.name }}</h3>
              @if (requirement.EducationalContent; as content) {
                <a
                  class="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 [&_.mat-icon]:!size-4 [&_.mat-icon]:!text-base dark:text-teal-300"
                  [href]="content.link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <mat-icon>menu_book</mat-icon>
                  {{ content.title }}
                </a>
              } @else {
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">No educational resource connected yet</p>
              }
            </div>
            <div class="ml-auto flex items-center gap-0.5">
              <button mat-button (click)="openEdit(requirement)">Edit</button>
              <button
                mat-icon-button
                class="!rounded-xl !text-teal-700 dark:!text-teal-300"
                aria-label="Delete requirement"
                (click)="confirmDelete(requirement)"
              >
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </article>
        } @empty {
          <div
            class="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-slate-300 px-6 py-11 text-center text-[0.8125rem] text-slate-500 [&_.mat-icon]:text-teal-700 dark:border-slate-400/25 dark:text-slate-400 dark:[&_.mat-icon]:text-teal-300"
          >
            <mat-icon>checklist</mat-icon>
            <p>No requirements yet. Add the first step participants need to complete.</p>
          </div>
        }
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export default class RequirementsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  requirementsStore = inject(RequirementsStore);
  requirementsEffect = effect(() => {
    const id = this.id();
    untracked(() => {
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });
  openModal() {
    this.dialog.open(AddRequirementComponent, { panelClass: 'w-full' });
  }
  openEdit(requirement: Requirement) {
    this.dialog.open(AddRequirementComponent, { data: requirement, panelClass: 'w-full' });
  }
  confirmDelete(requirement: Requirement) {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete requirement',
        content: `Are you sure you want to delete ${requirement.name}?`,
        color: 'warn',
        onYesClick: () => this.requirementsStore.deleteRequirement(requirement.id),
      },
    });
  }
}
