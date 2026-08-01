import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import { type ColDef } from 'ag-grid-community';
import { BlogActionsComponent } from './ui/blog-actions/blog-actions.component';
import { AddBlogComponent } from './ui/add-blog/add-blog.component';
import { AgGridComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-admin-blogs',
  imports: [AgGridComponent, MatButton, MatIcon, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col p-6">
      <div class="flex justify-between align-middle">
        <h2 class="text-2xl font-bold mb-3">Blogs</h2>
        <button matPrefix mat-raised-button aria-label="add" color="primary" (click)="openModal()">
          <mat-icon>add</mat-icon>
          New
        </button>
      </div>
      <mas-ag-grid class="h-[calc(100dvh-9.75rem)]" [rowData]="blogsStore.blogs()" [columnDefs]="colDefs()" />
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class AdminBlogsComponent {
  private dialog = inject(MatDialog);
  blogsStore = inject(BlogsStore);

  colDefs = signal<ColDef[]>([
    {
      field: 'title',
      filter: true,
    },
    {
      field: 'subTitle',
      filter: true,
    },
    {
      field: 'slug',
      filter: true,
    },
    {
      field: 'body',
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
      cellRenderer: BlogActionsComponent,
    },
  ]);

  constructor() {
    this.blogsStore.getBlogs();
  }

  openModal() {
    this.dialog.open(AddBlogComponent, { panelClass: 'w-full' });
  }
}
