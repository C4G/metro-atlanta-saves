import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AddCheckpointComponent, AgGridComponent } from '@mas/frontend-shared-components';
import { CheckpointsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { CheckpointActionsComponent } from './ui/checkpoint-actions/checkpoint-actions.component';

@Component({
  selector: 'mas-user-checkpoint',
  imports: [AgGridComponent, MatButtonModule, MatIcon, MatDialogModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <a mat-button aria-label="Back" title="Back" routerLink="../">
        <mat-icon>arrow_back_ios</mat-icon>
        Back
      </a>
      <div class="flex flex-col">
        <div class="flex justify-between align-middle mt-4">
          <h2 class="text-2xl font-bold mb-3">
            {{ usersStore.user()?.firstName + ' ' + usersStore.user()?.lastName }}'s Checkpoints
          </h2>
          <span>
            Credit Score Change:
            <strong>{{ checkpointsStore.creditScoreChange() }}</strong>
          </span>
          <span>
            Total Savings:
            <strong>{{ checkpointsStore.savingsTotaled() }}</strong>
          </span>
          <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
            <mat-icon>add</mat-icon>
            New
          </button>
        </div>
        <mas-ag-grid
          class="h-[calc(100dvh-13rem)]"
          [rowData]="checkpointsStore.checkpoints()"
          [columnDefs]="colDefs()"
        />
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class UserCheckpointComponent {
  id = input.required<string>();
  userId = input.required<string>();
  private dialog = inject(MatDialog);
  checkpointsStore = inject(CheckpointsStore);
  usersStore = inject(UsersStore);

  colDefs = computed<ColDef[]>(() => [
    {
      field: 'name',
      filter: true,
    },
    {
      field: 'savedMoney',
      filter: true,
      valueFormatter: (params) =>
        !params.data.savedMoney ? '' : formatCurrency(params.data.savedMoney, 'en-us', '$', '1.2'),
    },
    {
      field: 'creditScore',
      filter: true,
    },
    {
      field: 'hasImage',
      headerName: 'Has Image(s)',
      filter: true,
      cellDataType: 'boolean',
      valueGetter: (params) => (params.data.images && params.data.images.length > 0 ? true : false),
    },
    {
      field: 'imageVerified',
      filter: true,
      valueGetter: (params) => (params.data.images?.some((img: any) => img.imageVerified) ? 'Yes' : 'No'),
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
      width: 80,
      cellRenderer: CheckpointActionsComponent,
      cellRendererParams: {
        programId: this.id(),
      },
    },
  ]);

  usersEffect = effect(() => {
    const userId = this.userId();

    untracked(() => {
      this.usersStore.getUser(userId);
    });
  });

  checkpointsEffect = effect(() => {
    const userId = this.userId();
    const id = this.id();

    untracked(() => {
      this.checkpointsStore.setProgramId(id);
      this.checkpointsStore.setUserId(userId);
      this.checkpointsStore.getCheckpoints();
    });
  });

  openModal() {
    this.dialog.open(AddCheckpointComponent, { data: { programId: this.id() }, panelClass: 'w-full' });
  }
}
