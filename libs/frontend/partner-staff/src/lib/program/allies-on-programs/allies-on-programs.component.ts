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
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Support network</p>
          <h2 class="program-list-title">Allies</h2>
          <p class="program-list-description">Connect staff and partners who support this program.</p>
        </div>
        <div class="flex gap-2">
          <button matPrefix mat-raised-button aria-label="Add ally" (click)="openModal()">
            <mat-icon>add</mat-icon>
            Add ally
          </button>
        </div>
      </div>
      <div class="program-list-grid">
        <mas-ag-grid class="h-[calc(100dvh-25rem)]" [rowData]="alliesStore.allies()" [columnDefs]="colDefs" />
      </div>
    </section>
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
