import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '@mas/frontend-shared-auth';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { CheckpointName } from '@prisma/client';
import { type ColDef } from 'ag-grid-community';
import { AddProgramComponent } from './ui/add-program/add-program.component';
import { ProgramActionsComponent } from './ui/program-actions/program-actions.component';

@Component({
  selector: 'mas-programs',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Programs</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="programsStore.programs()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class ProgramsComponent {
  private dialog = inject(MatDialog);
  private authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    {
      field: 'description',
    },
    {
      field: 'startDate',
      filter: true,
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '',
    },
    {
      field: 'endDate',
      filter: true,
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value).toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '',
    },
    {
      field: 'createdAt',
      filter: true,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    { field: 'updatedAt', filter: true, valueFormatter: (params) => new Date(params.value).toLocaleString() },
    {
      headerName: 'Checkpoint Names',
      valueGetter: (params) => {
        if (params.data && params.data.checkpointNames) {
          return params.data.checkpointNames.map((cp: CheckpointName) => cp.name).join(', ');
        }
        return '';
      },
    },
    {
      field: 'actions',
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 80,
      cellRenderer: ProgramActionsComponent,
    },
  ];

  constructor() {
    this.programsStore.getPrograms(this.authStore.user()?.partnerId ?? undefined);
  }

  openModal() {
    this.dialog.open(AddProgramComponent, { panelClass: 'w-full' });
  }
}
