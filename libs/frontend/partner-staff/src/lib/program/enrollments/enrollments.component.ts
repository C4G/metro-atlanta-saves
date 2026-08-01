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
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Enrollments</h2>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-23rem)]" [rowData]="programsStore.enrollments()" [columnDefs]="colDefs" />
    </div>
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
