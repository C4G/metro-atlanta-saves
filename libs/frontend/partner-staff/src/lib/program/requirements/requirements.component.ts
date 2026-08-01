import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { type ColDef } from 'ag-grid-community';
import { RequirementsStore } from './requirements.store';
import { AddRequirementComponent } from './ui/add-requirement/add-requirement.component';
import { RequirementActionsComponent } from './ui/requirement-actions/requirement-actions.component';

@Component({
  selector: 'mas-requirements',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Requirements</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-23rem)]" [rowData]="requirementsStore.requirements()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class RequirementsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  requirementsStore = inject(RequirementsStore);

  colDefs: ColDef[] = [
    {
      field: 'name',
      filter: true,
    },
    {
      headerName: 'Educational Content',
      cellRenderer: (params: any) => {
        const { EducationalContent } = params.data;

        if (!EducationalContent) {
          return null;
        }

        return `<a class="underline" href="${EducationalContent.link}" target="_blank">${EducationalContent.title}</a>`;
      },
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
      cellRenderer: RequirementActionsComponent,
    },
  ];

  requirementsEffect = effect(() => {
    const id = this.id();

    untracked(() => {
      this.requirementsStore.setProgramId(id);
      this.requirementsStore.getRequirements();
    });
  });

  openModal() {
    this.dialog.open(AddRequirementComponent, { panelClass: 'w-full' });
  }
}
