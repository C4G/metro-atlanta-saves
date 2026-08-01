import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { dateStringToNoTimezone, showOnlyDate } from '@mas/frontend-shared-util';
import { type ColDef } from 'ag-grid-community';
import { AddUsersOnProgramsComponent } from './ui/add-users-on-programs/add-users-on-programs.component';
import { RequirementBadgeComponent } from './ui/requirement-badge/requirement-badge.component';
import { UsersOnProgramsActionsComponent } from './ui/users-on-programs-actions/users-on-programs-actions.component';

@Component({
  selector: 'mas-users-on-programs',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Users</h2>
        <div class="flex gap-4">
          <button matPrefix mat-raised-button aria-label="download" (click)="usersOnProgramsStore.downloadExcel()">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
            <mat-icon>add</mat-icon>
            New
          </button>
        </div>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-23rem)]" [rowData]="usersOnProgramsStore.users()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class UsersOnProgramsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  usersOnProgramsStore = inject(UsersOnProgramsStore);

  colDefs: ColDef[] = [
    {
      field: 'email',
      filter: true,
    },
    {
      field: 'firstName',
      filter: true,
    },
    {
      field: 'lastName',
      filter: true,
    },
    {
      field: 'lastLogin',
      filter: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
      field: 'totalAmountSaved',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value ?? 0, 'en-us', '$', '1.2'),
    },
    {
      field: 'requirementStatus',
      width: 390,
      filter: true,
      cellRenderer: RequirementBadgeComponent,
      filterValueGetter: (params) => params.data.checkpoints?.join(' ') ?? '',
    },
    {
      field: 'married',
      filter: true,
    },
    {
      field: 'educationStatus',
      filter: true,
    },
    {
      field: 'militaryStatus',
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
      field: 'start',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'end',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
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
      field: 'creditScoreIncentive',
      filter: true,
    },
    {
      field: 'totalAmountPaidOut',
      filter: true,
      valueFormatter: (params) => formatCurrency(params.value, 'en-us', '$', '1.2'),
    },
    {
      field: 'paidDate',
      filter: true,
      valueFormatter: (params) => (params.value ? showOnlyDate(dateStringToNoTimezone(params.value)) : ''),
    },
    {
      field: 'graduated',
      filter: true,
    },
    {
      field: 'inactive',
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
      cellRenderer: UsersOnProgramsActionsComponent,
    },
  ];

  userOnProgramsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.usersOnProgramsStore.setProgramId(id);
      this.usersOnProgramsStore.getUsers();
    });
  });

  openModal() {
    this.dialog.open(AddUsersOnProgramsComponent, { panelClass: 'w-full' });
  }
}
