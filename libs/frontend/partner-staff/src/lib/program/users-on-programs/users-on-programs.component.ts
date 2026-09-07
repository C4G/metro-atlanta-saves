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
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Participant management</p>
          <h2 class="program-list-title">Users</h2>
          <p class="program-list-description">Manage enrolled participants, progress, and program details.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            matPrefix
            mat-raised-button
            class="program-list-secondary"
            aria-label="Export users"
            (click)="usersOnProgramsStore.downloadExcel()"
          >
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button matPrefix mat-raised-button aria-label="Add user" (click)="openModal()">
            <mat-icon>add</mat-icon>
            Add user
          </button>
        </div>
      </div>
      <div class="program-list-grid">
        <mas-ag-grid class="h-[calc(100dvh-25rem)]" [rowData]="usersOnProgramsStore.users()" [columnDefs]="colDefs" />
      </div>
    </section>
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
