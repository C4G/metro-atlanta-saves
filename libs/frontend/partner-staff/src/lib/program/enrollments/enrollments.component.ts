import { formatCurrency, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { AgGridComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ProgramsStore, UserAndEnrollment } from '@mas/frontend-shared-data-access';
import { dateStringToNoTimezone, showOnlyDate } from '@mas/frontend-shared-util';
import { ColDef } from 'ag-grid-community';
import { EnrollmentsActionsComponent } from './ui/enrollments-actions/enrollments-actions.component';

@Component({
  selector: 'mas-enrollments',
  imports: [SpinnerComponent, AgGridComponent, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="min-w-0 p-5 sm:p-6" aria-label="Enrollment requests">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold tracking-tight">Enrollment requests</h3>
          <p class="mt-1 text-sm leading-6 text-ink-muted">
            Review each application before someone joins this program.
          </p>
        </div>
        <span
          class="inline-flex min-h-9 items-center rounded-lg bg-brand-soft px-3 text-sm font-semibold text-brand-strong"
        >
          {{ programsStore.enrollments().length }} awaiting review
        </span>
      </div>
      @if (programsStore.enrollmentsLoading()) {
        <p class="mb-4 text-sm text-ink-muted flex items-center gap-2" role="status">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading requests</span>
        </p>
      }
      @if (programsStore.enrollmentsLoadFailed()) {
        <div class="mb-4 text-sm text-danger" role="alert">
          Requests could not be loaded.
          <button
            type="button"
            (click)="programsStore.getEnrollments(id())"
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      }
      <div class="mt-6 overflow-hidden rounded-xl border border-outline">
        @for (enrollment of programsStore.enrollments(); track enrollment.id) {
          <article
            class="grid min-w-0 gap-4 border-b border-outline px-4 py-5 last:border-b-0 hover:bg-brand-soft/20 sm:px-5 lg:grid-cols-[minmax(12rem,0.75fr)_minmax(0,1.25fr)_auto] lg:items-center"
          >
            <div class="min-w-0">
              <p class="inline-flex items-center gap-2 text-xs font-medium text-brand-strong">
                <span class="h-2 w-2 rounded-full bg-brand" aria-hidden="true"></span>
                Awaiting review
              </p>
              <h4 class="mt-2 truncate font-semibold tracking-tight">
                {{ enrollment.firstName }} {{ enrollment.lastName }}
              </h4>
              <p class="mt-1 truncate text-sm text-ink-muted">
                {{ enrollment.placeOfEmployment || 'Employment not provided' }}
              </p>
              @if (enrollment.jobTitle) {
                <p class="mt-1 truncate text-xs text-ink-subtle">Role: {{ enrollment.jobTitle }}</p>
              }
            </div>
            <div class="min-w-0 border-l-0 border-outline lg:border-l lg:pl-5">
              <p class="flex items-center gap-1.5 text-xs font-medium text-ink-subtle">
                <mat-icon aria-hidden="true" class="text-[16px] leading-4">format_quote</mat-icon>
                Why they want to join
              </p>
              <p class="mt-1.5 line-clamp-3 text-sm leading-6 text-ink-muted">
                {{ enrollment.interest || 'No personal statement was provided.' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                (click)="reviewEnrollment(enrollment, false)"
                class="min-h-10 rounded-lg border border-outline px-3 text-sm font-semibold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Decline
              </button>
              <button
                type="button"
                (click)="reviewEnrollment(enrollment, true)"
                class="min-h-10 rounded-lg bg-brand-strong px-3 text-sm font-semibold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Approve
              </button>
            </div>
          </article>
        } @empty {
          @if (!programsStore.enrollmentsLoading() && !programsStore.enrollmentsLoadFailed()) {
            <div class="px-5 py-10 text-center sm:px-6">
              <mat-icon aria-hidden="true" class="text-[28px] text-brand-strong">task_alt</mat-icon>
              <p class="mt-3 font-medium">You’re all caught up.</p>
              <p class="mt-1 text-sm text-ink-muted">No applications are waiting for review.</p>
            </div>
          }
        }
      </div>
      <details class="mt-4 border-t border-outline">
        <summary
          class="cursor-pointer py-4 text-xs font-semibold text-ink-muted hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Full applications and filters
        </summary>
        <div class="min-w-0 border-t border-outline p-2">
          <mas-ag-grid class="h-[28rem] min-w-0" [rowData]="programsStore.enrollments()" [columnDefs]="colDefs" />
        </div>
      </details>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class EnrollmentsComponent {
  id = input.required<string>();
  programsStore = inject(ProgramsStore);
  private readonly dialog = inject(MatDialog);

  reviewEnrollment(enrollment: UserAndEnrollment, approve: boolean): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: approve ? 'Approve enrollment' : 'Decline enrollment',
        content: `${approve ? 'Approve' : 'Decline and delete'} the application from ${enrollment.firstName} ${enrollment.lastName}?`,
        color: approve ? 'primary' : 'warn',
        onYesClick: () =>
          approve
            ? this.programsStore.convertToUser({ programId: this.id(), enrollmentId: enrollment.id })
            : this.programsStore.deleteEnrollment({ programId: this.id(), enrollmentId: enrollment.id }),
      },
    });
  }

  colDefs: ColDef[] = [
    {
      field: 'firstName',
      filter: true,
    },
    {
      field: 'lastName',
      filter: true,
    },
    {
      field: 'placeOfEmployment',
      filter: true,
    },
    {
      field: 'jobTitle',
      filter: true,
    },
    {
      field: 'annualIncome',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value, 'en-us', '$', '1.2'),
    },
    {
      field: 'address',
      filter: true,
    },
    {
      field: 'zipCode',
      filter: true,
    },
    {
      field: 'birthdate',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'phone',
      filter: true,
    },
    {
      field: 'gender',
      filter: true,
    },
    {
      field: 'race',
      filter: true,
    },
    {
      field: 'meetingAvailablility',
      filter: true,
    },
    {
      field: 'employerCommitted',
      filter: true,
    },
    {
      field: 'interest',
      filter: true,
    },
    {
      field: 'gain',
      filter: true,
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
      cellRenderer: EnrollmentsActionsComponent,
    },
  ];

  enrollmentsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.programsStore.getEnrollments(id);
    });
  });
}
