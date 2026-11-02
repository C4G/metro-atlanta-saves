import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent, ConfirmDialogComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { Requirement } from '@mas/prisma-client/browser';
import { type ColDef } from 'ag-grid-community';
import { RequirementsStore } from './requirements.store';
import { AddRequirementComponent } from './ui/add-requirement/add-requirement.component';
import { RequirementActionsComponent } from './ui/requirement-actions/requirement-actions.component';

@Component({
  selector: 'mas-requirements',
  imports: [SpinnerComponent, AgGridComponent, DatePipe, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="requirements-heading">
      <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="requirements-heading" class="text-2xl font-semibold tracking-tight">Requirements</h2>
          <p class="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            Build the shared plan for what participants need to complete and when it is due.
          </p>
        </div>
        <button
          type="button"
          (click)="openModal()"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-strong px-4 text-sm font-semibold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <mat-icon aria-hidden="true" class="text-xl leading-[19px]">add</mat-icon>
          Add requirement
        </button>
      </header>
      @if (requirementsStore.loading()) {
        <p class="mb-4 text-sm text-ink-muted flex items-center gap-2" role="status">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading requirements</span>
        </p>
      }
      @if (requirementsStore.loadFailed()) {
        <div class="mb-4 text-sm text-danger" role="alert">
          Requirements could not be loaded.
          <button
            type="button"
            (click)="requirementsStore.getRequirements()"
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      }
      <div class="overflow-hidden rounded-2xl border border-outline bg-surface-raised">
        @for (requirement of requirementsStore.requirements(); track requirement.id) {
          <article
            [id]="requirement.id"
            class="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-b border-outline px-4 py-5 last:border-b-0 hover:bg-brand-soft/20 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-x-5 sm:px-6"
          >
            <div class="pt-0.5 text-center" aria-label="Due date">
              @if (requirement.dueAt) {
                <p class="text-xs font-semibold text-brand-strong">{{ requirement.dueAt | date: 'MMM' }}</p>
                <p class="mt-0.5 text-2xl font-semibold leading-none tracking-tight">
                  {{ requirement.dueAt | date: 'd' }}
                </p>
                <p class="mt-1 text-xs text-ink-subtle">{{ requirement.dueAt | date: 'y' }}</p>
              } @else {
                <span
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle text-ink-muted"
                >
                  <mat-icon aria-hidden="true">event_available</mat-icon>
                </span>
                <p class="mt-1 text-xs font-medium text-ink-subtle">Any time</p>
              }
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2 py-1 text-xs font-medium text-brand-strong"
                >
                  <mat-icon aria-hidden="true" class="text-base leading-[15px]">
                    {{ requirement.actionInstructions ? 'bolt' : 'checklist' }}
                  </mat-icon>
                  {{ requirement.actionInstructions ? 'Action task' : 'Program requirement' }}
                </span>
                <span class="text-xs text-ink-subtle">
                  {{ requirement.dueAt ? 'Due ' + (requirement.dueAt | date: "MMM d, y 'at' h:mm a") : 'No due date' }}
                </span>
              </div>
              <h3 class="mt-3 text-lg font-semibold tracking-tight">{{ requirement.name }}</h3>
              @if (requirement.actionInstructions) {
                <p class="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-ink-muted">
                  {{ requirement.actionInstructions }}
                </p>
              }
              @if (requirement.EducationalContent; as content) {
                <a
                  [href]="content.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <mat-icon aria-hidden="true" class="text-lg leading-[18px]">menu_book</mat-icon>
                  {{ content.title }}
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              }
            </div>
            <footer
              class="col-start-2 mt-4 flex items-center gap-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:items-start sm:justify-end"
            >
              <button
                type="button"
                (click)="editRequirement(requirement)"
                [attr.aria-label]="'Edit ' + requirement.name"
                title="Edit requirement"
                class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-brand-soft hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <mat-icon aria-hidden="true">edit</mat-icon>
              </button>
              <button
                type="button"
                (click)="removeRequirement(requirement)"
                [attr.aria-label]="'Delete ' + requirement.name"
                class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <mat-icon aria-hidden="true">delete_outline</mat-icon>
              </button>
            </footer>
          </article>
        } @empty {
          @if (!requirementsStore.loading() && !requirementsStore.loadFailed()) {
            <div class="rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-10 text-center">
              <mat-icon aria-hidden="true" class="text-2xl text-brand-strong">checklist</mat-icon>
              <p class="mt-3 font-medium">Your program plan starts here.</p>
              <p class="mt-1 text-sm text-ink-muted">Add the first step for your participants.</p>
            </div>
          }
        }
      </div>
      <details class="mt-5 border-t border-outline">
        <summary
          class="cursor-pointer py-4 text-xs font-semibold text-ink-muted hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Detailed records and filters
        </summary>
        <div class="min-w-0 border-t border-outline p-2">
          <mas-ag-grid class="h-[28rem] min-w-0" [rowData]="requirementsStore.requirements()" [columnDefs]="colDefs" />
        </div>
      </details>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class RequirementsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  requirementsStore = inject(RequirementsStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    {
      headerName: 'Educational Content',
      valueGetter: (params) => params.data?.EducationalContent?.title ?? '',
    },
    {
      field: 'createdAt',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'updatedAt',
      filter: true,
      valueFormatter: (params) => (params.value ? formatDate(params.value, 'medium', 'en-US') : ''),
    },
    {
      field: 'actions',
      resizable: false,
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: RequirementActionsComponent,
    },
  ];

  requirementsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });

  openModal() {
    this.dialog.open(AddRequirementComponent, { maxWidth: 'calc(100vw - 2rem)', width: '44rem' });
  }

  editRequirement(requirement: Requirement): void {
    this.dialog.open(AddRequirementComponent, { data: requirement, maxWidth: 'calc(100vw - 2rem)', width: '44rem' });
  }

  removeRequirement(requirement: Requirement): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete requirement',
        content: `Delete ${requirement.name}?`,
        color: 'warn',
        onYesClick: () => this.requirementsStore.deleteRequirement(requirement.id),
      },
    });
  }
}
