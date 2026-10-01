import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { dateStringToNoTimezone, showOnlyDate } from '@mas/frontend-shared-util';
import { ColDef } from 'ag-grid-community';
import { EnrollmentsActionsComponent } from './ui/enrollments-actions/enrollments-actions.component';

@Component({
  selector: 'mas-enrollments',
  imports: [AgGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6">
      <div>
        <p class="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
          Participant intake
        </p>
        <h2 class="mt-1.5 text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-slate-100">Enrollments</h2>
        <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
          Review and respond to pending program enrollment requests.
        </p>
      </div>
      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-400/15">
        <mas-ag-grid class="h-[calc(100dvh-25rem)]" [rowData]="programsStore.enrollments()" [columnDefs]="colDefs" />
      </div>
    </section>
  `,
  host: {
    class: 'block',
  },
})
export default class EnrollmentsComponent {
  id = input.required<string>();
  programsStore = inject(ProgramsStore);

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
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    { field: 'updatedAt', filter: true, valueFormatter: (params) => new Date(params.value).toLocaleString() },
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
