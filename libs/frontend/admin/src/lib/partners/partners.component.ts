import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { PartnersStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { AddPartnerComponent } from './ui/add-partner/add-partner.component';
import { PartnerActionsComponent } from './ui/partner-actions/partner-actions.component';

@Component({
  selector: 'mas-partners',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Partners</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="partnersStore.partners()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class PartnersComponent {
  private dialog = inject(MatDialog);
  partnersStore = inject(PartnersStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    { field: 'address', width: 250, filter: true },
    { field: 'website', width: 250, filter: true },
    { field: 'facebook', width: 250, filter: true },
    { field: 'linkedIn', width: 250, filter: true },
    { field: 'tiktok', width: 250, filter: true },
    { field: 'twitter', width: 250, filter: true },
    {
      field: 'createdAt',
      filter: true,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    { field: 'updatedAt', filter: true, valueFormatter: (params) => new Date(params.value).toLocaleString() },
    {
      field: 'actions',
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: PartnerActionsComponent,
    },
  ];

  constructor() {
    this.partnersStore.getPartners();
  }

  openModal() {
    this.dialog.open(AddPartnerComponent, { panelClass: 'w-full' });
  }
}
