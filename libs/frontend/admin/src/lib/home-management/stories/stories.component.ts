import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { StoriesStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { AddStoryComponent } from './ui/add-story/add-story.component';
import { StoryActionsComponent } from './ui/story-actions/story-actions.component';

@Component({
  selector: 'mas-stories',
  imports: [AgGridComponent, MatButtonModule, MatIcon, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex justify-between align-middle mb-4">
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      @if (storiesStore.stories().length > 0) {
        <div class="flex items-center justify-between mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p class="font-medium">Stories Section Visibility</p>
            <p class="text-sm text-gray-500">
              Toggle to show or hide the entire section on the home page
              @if (!storiesStore.sectionHiddenOverride()) {
                — {{ visibleCount() }} of {{ storiesStore.stories().length }} item(s) currently showing
              }
            </p>
          </div>
          <mat-slide-toggle
            [checked]="!storiesStore.sectionHiddenOverride()"
            (change)="storiesStore.setSectionHidden(!$event.checked)"
          >
            {{ storiesStore.sectionHiddenOverride() ? 'Section Hidden' : 'Section Visible' }}
          </mat-slide-toggle>
        </div>
      }
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="storiesStore.stories()" [columnDefs]="colDefs" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class StoriesComponent {
  private dialog = inject(MatDialog);
  storiesStore = inject(StoriesStore);

  visibleCount = computed(() => this.storiesStore.stories().filter((s) => !(s as any).hidden).length);

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
      cellRenderer: StoryActionsComponent,
    },
  ];

  constructor() {
    this.storiesStore.getStories();
  }

  openModal() {
    this.dialog.open(AddStoryComponent, { panelClass: 'w-full' });
  }
}
