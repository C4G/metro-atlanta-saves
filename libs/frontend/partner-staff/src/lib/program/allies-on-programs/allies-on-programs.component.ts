import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { AddAlliesOnProgramsComponent } from './ui/add-allies-on-programs/add-allies-on-programs.component';
import { AlliesOnProgramsActionsComponent } from './ui/allies-on-programs-actions/allies-on-programs-actions.component';

@Component({
  selector: 'mas-allies-on-programs',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Allies</h2>
        <div class="flex gap-4">
          <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
            <mat-icon>add</mat-icon>
            New
          </button>
        </div>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-23rem)]" [rowData]="alliesStore.allies()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class AlliesOnProgramsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  protected alliesStore = inject(AlliesOnProgramsStore);

  colDefs: ColDef[] = [
    { field: 'email', filter: true },
    { field: 'firstName', filter: true },
    { field: 'lastName', filter: true },
    {
      field: 'lastLogin',
      filter: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
      field: 'createdAt',
      filter: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleString() : ''),
    },
    {
      field: 'actions',
      resizable: false,
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: AlliesOnProgramsActionsComponent,
    },
  ];

  userOnProgramsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.alliesStore.setProgramId(id);
      this.alliesStore.getAllies();
    });
  });

  openModal() {
    this.dialog.open(AddAlliesOnProgramsComponent, { panelClass: 'w-full' });
  }
}
