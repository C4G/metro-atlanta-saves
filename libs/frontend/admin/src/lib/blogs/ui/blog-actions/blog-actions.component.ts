import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { BlogsStore } from '@mas/frontend-shared-data-access';
import { type Blog } from '@prisma/client';
import { AddBlogComponent } from '../add-blog/add-blog.component';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'mas-blog-actions',
  imports: [MatIcon, MatIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 h-full">
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Edit"
        title="Edit"
        (click)="openEdit()"
      >
        <mat-icon color="accent">edit</mat-icon>
      </button>
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Delete"
        title="Delete"
        (click)="openConfirm()"
      >
        <mat-icon color="warn">delete</mat-icon>
      </button>
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class BlogActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private blogsStore = inject(BlogsStore);
  blog = signal<Blog | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.blog.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Blog`,
        content: `Are you sure you want to delete ${this.blog()?.title}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.blog()?.id;
          if (id) {
            this.blogsStore.deleteBlog(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddBlogComponent, {
      data: this.blog(),
      panelClass: 'w-full',
    });
  }
}
