import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { LearningsStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { AddLearningComponent } from './ui/add-learning/add-learning.component';
import { LearningActionsComponent } from './ui/learning-actions/learning-actions.component';

@Component({
  selector: 'mas-admin-learnings',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle mb-4">
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      @if (learningsStore.learnings().length > 0) {
        <div class="flex items-center justify-between mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p class="font-medium">Learn More Section Visibility</p>
            <p class="text-sm text-gray-500">
              Toggle to show or hide the entire section on the home page
              @if (!learningsStore.sectionHiddenOverride()) {
                — {{ visibleCount() }} of {{ learningsStore.learnings().length }} item(s) currently showing
              }
            </p>
          </div>
          <mat-slide-toggle
            [checked]="!learningsStore.sectionHiddenOverride()"
            (change)="learningsStore.setSectionHidden(!$event.checked)"
          >
            {{ learningsStore.sectionHiddenOverride() ? 'Section Hidden' : 'Section Visible' }}
          </mat-slide-toggle>
        </div>
      }
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="learningsStore.learnings()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class AdminLearningsComponent {
  private dialog = inject(MatDialog);
  learningsStore = inject(LearningsStore);

  visibleCount = computed(() => this.learningsStore.learnings().filter((l) => !(l as any).hidden).length);

  colDefs: ColDef[] = [
    {
      field: 'title',
      filter: true,
    },
    {
      field: 'body',
      filter: true,
    },
    {
      field: 'sequence',
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
      resizable: false,
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: LearningActionsComponent,
    },
  ];

  constructor() {
    this.learningsStore.getLearnings();
  }

  openModal() {
    this.dialog.open(AddLearningComponent, { panelClass: 'w-full' });
  }
}
