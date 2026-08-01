import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AddUserComponent, AgGridComponent } from '@mas/frontend-shared-components';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { PartnerNameComponent } from './ui/partner-name/partner-name.component';
import { UsersActionsComponent } from './ui/users-actions/users-actions.component';

@Component({
  selector: 'mas-users',
  imports: [AgGridComponent, MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Users</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="usersStore.users()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class UsersComponent {
  private dialog = inject(MatDialog);
  usersStore = inject(UsersStore);

  colDefs: ColDef[] = [
    {
      field: 'email',
      filter: true,
    },
    { field: 'firstName', filter: true },
    { field: 'lastName', filter: true },
    {
      field: 'lastLogin',
      filter: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
      field: 'role',
      width: 390,
      filter: true,
    },
    {
      field: 'partnerId',
      headerName: 'Partner',
      width: 250,
      filter: true,
      cellRenderer: PartnerNameComponent,
      filterValueGetter: (params) => params.data.partner?.name ?? '',
      valueFormatter: (params) => params.data.partner?.name ?? '',
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
      cellRenderer: UsersActionsComponent,
    },
  ];

  constructor() {
    this.usersStore.getUsers();
  }

  openModal() {
    this.dialog.open(AddUserComponent, { panelClass: 'w-full' });
  }
}
