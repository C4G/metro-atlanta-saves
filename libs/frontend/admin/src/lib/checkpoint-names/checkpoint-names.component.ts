import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { CheckpointNamesStore } from '@mas/frontend-shared-data-access';
import { ColDef } from 'ag-grid-community';
import { AddCheckpointNameComponent } from './ui/add-checkpoint-name/add-checkpoint-name.component';
import { CheckpointNamesActionsComponent } from './ui/checkpoint-names-actions/checkpoint-names-actions.component';

@Component({
  selector: 'mas-checkpoint-names',
  imports: [AgGridComponent, MatButtonModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex justify-between align-middle">
      <h2 class="text-2xl font-bold mb-3">Checkpoint Names</h2>
      <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
        <mat-icon>add</mat-icon>
        New
      </button>
    </div>
    <mas-ag-grid
      class="h-[calc(100dvh-9.75rem)]"
      [rowData]="checkpointNamesStore.checkpointNames()"
      [columnDefs]="colDefs"
    />
  `,
  host: {
    class: 'block p-6',
  },
})
export default class CheckpointNamesComponent {
  private dialog = inject(MatDialog);
  checkpointNamesStore = inject(CheckpointNamesStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    {
      field: 'type',
      filter: true,
    },
    {
      field: 'sequence',
      filter: true,
    },
    {
      field: 'actions',
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 120,
      cellRenderer: CheckpointNamesActionsComponent,
    },
  ];

  constructor() {
    this.checkpointNamesStore.getCheckpointNames();
  }

  openModal() {
    this.dialog.open(AddCheckpointNameComponent, { panelClass: 'w-full' });
  }
}
