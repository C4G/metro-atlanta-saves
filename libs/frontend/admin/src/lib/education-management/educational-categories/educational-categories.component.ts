import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AgGridComponent } from '@mas/frontend-shared-components';
import { EducationalCategoryStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { CategoryActionsComponent } from './ui/category-actions/category-actions.component';

@Component({
  selector: 'mas-educational-categories',
  imports: [AgGridComponent, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <mas-ag-grid
        class="h-[calc(100dvh-9.75rem)]"
        [rowData]="educationalCategoryStore.categoryList()"
        [columnDefs]="colDefs"
      />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class EducationalCategoriesComponent {
  private dialog = inject(MatDialog);
  educationalCategoryStore = inject(EducationalCategoryStore);

  colDefs: ColDef[] = [
    {
      field: 'category',
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
      cellRenderer: CategoryActionsComponent,
    },
  ];

  constructor() {
    this.educationalCategoryStore.getCategoryList();
  }
}
