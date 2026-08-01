import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CohortsStore } from '@mas/frontend-shared-data-access';
import { MatDialog } from '@angular/material/dialog';
import { type ColDef } from 'ag-grid-community';
import { CohortActionsComponent } from './ui/cohort-actions/cohort-actions.component';
import { AddCohortComponent } from './ui/add-cohort/add-cohort.component';
import { AgGridComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-about-us-management',
  imports: [AgGridComponent, MatButtonModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">About Us Management</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="cohortsStore.cohorts()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class AboutUsManagementComponent {
  private dialog = inject(MatDialog);
  cohortsStore = inject(CohortsStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    {
      field: 'description',
      filter: true,
    },
    {
      field: 'imageUrl',
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
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 120,
      cellRenderer: CohortActionsComponent,
    },
  ];

  constructor() {
    this.cohortsStore.getCohorts();
  }

  openModal() {
    this.dialog.open(AddCohortComponent, { panelClass: 'w-full' });
  }
}
