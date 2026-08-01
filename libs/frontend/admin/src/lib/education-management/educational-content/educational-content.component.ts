import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { EducationalContentStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { CategoryBadgeComponent } from './ui/category-badge/category-badge.component';
import { ContentActionsComponent } from './ui/content-actions/content-actions.component';
import { DescriptionCellRendererComponent } from './ui/description-cell-renderer/description-cell-renderer.component';

@Component({
  selector: 'mas-educational-content',
  imports: [AgGridComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <mas-ag-grid
        class="h-[calc(100dvh-9.75rem)]"
        [rowData]="educationalContentStore.contentList()"
        [columnDefs]="colDefs"
      />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class EducationalContentComponent {
  private dialog = inject(MatDialog);
  educationalContentStore = inject(EducationalContentStore);

  constructor() {
    this.educationalContentStore.getContentList([]);
  }

  colDefs: ColDef[] = [
    {
      field: 'title',
      filter: true,
    },
    { field: 'description', cellRenderer: DescriptionCellRendererComponent },
    {
      field: 'categories',
      width: 385,
      filter: true,
      cellRenderer: CategoryBadgeComponent,
    },
    { field: 'image', filter: true },
    {
      field: 'link',
      filter: true,
    },
    {
      field: 'file',
      filter: true,
    },
    { field: 'createdAt', filter: true, valueFormatter: (params) => new Date(params.value).toLocaleString() },
    { field: 'updatedAt', filter: true, valueFormatter: (params) => new Date(params.value).toLocaleString() },
    {
      field: 'actions',
      filter: false,
      sortable: false,
      pinned: 'right',
      width: 100,
      cellRenderer: ContentActionsComponent,
    },
  ];
}
