import { formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { type ColDef } from 'ag-grid-community';
import { CheckpointsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { AddCheckpointComponent, AgGridComponent } from '@mas/frontend-shared-components';
import { SavingsActionsComponent } from './ui/savings-actions/savings-actions.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-savings',
  imports: [AgGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block pt-6',
  },
  template: `
    <div class="flex gap-16 mb-4 justify-center">
      <p>
        Credit Increase:
        <strong>{{ usersOnProgramsStore.userCreditIncrease() }}</strong>
      </p>
    </div>
    <mas-ag-grid
      class="h-[calc(100dvh-21.5rem)]"
      [rowData]="usersOnProgramsStore.userProgramSavingsHistory()"
      [columnDefs]="colDefs()"
    />
  `,
})
export default class SavingsComponent {
  id = input.required<string>();
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  checkpointsStore = inject(CheckpointsStore);
  authStore = inject(AuthStore);

  private dialog = inject(MatDialog);

  colDefs = signal<ColDef[]>([
    {
      field: 'name',
      filter: false,
      sortable: false,
    },
    {
      field: 'createdAt',
      filter: false,
      sortable: false,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'savedMoney',
      filter: false,
      sortable: false,
      valueFormatter: (params) =>
        !params.data.savedMoney ? '' : formatCurrency(params.data.savedMoney, 'en-us', '$', '1.2'),
    },
    {
      field: 'creditScore',
      filter: false,
      sortable: false,
    },
    {
      field: 'imageId',
      headerName: 'Has Image(s)',
      filter: false,
      sortable: false,
      valueFormatter: (params) => (params.data.images && params.data.images.length > 0 ? 'Yes' : 'No'),
    },
    {
      field: 'imageVerified',
      filter: false,
      sortable: false,
      valueGetter: (params) => (params.data.images?.some((img: any) => img.imageVerified) ? 'Yes' : 'No'),
    },
    {
      field: 'actions',
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 85,
      cellRenderer: SavingsActionsComponent,
    },
  ]);

  userOnProgramsEffect = effect(() => {
    const id = this.id();
    const userId = this.authStore.user()?.id;

    untracked(() => {
      this.checkpointsStore.setProgramId(id);
      if (userId) {
        this.checkpointsStore.setUserId(userId);
      }
    });
  });

  addCheckpoint() {
    this.dialog.open(AddCheckpointComponent, {
      panelClass: 'w-full',
    });
  }
}
