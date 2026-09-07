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
    <section class="program-list-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="program-list-kicker">Program setup</p>
          <h2 class="program-list-title">Requirements</h2>
          <p class="program-list-description">Define the steps participants need to complete.</p>
        </div>
        <button matPrefix mat-raised-button aria-label="Add requirement" (click)="openModal()">
          <mat-icon>add</mat-icon>
          Add requirement
        </button>
      </div>
      <div class="program-list-grid">
        <mas-ag-grid
          class="h-[calc(100dvh-25rem)]"
          [rowData]="requirementsStore.requirements()"
          [columnDefs]="colDefs"
        />
      </div>
    </section>
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
