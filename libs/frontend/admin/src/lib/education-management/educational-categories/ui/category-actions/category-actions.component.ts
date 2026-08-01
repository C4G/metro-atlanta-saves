import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { EducationalCategoryStore } from '@mas/frontend-shared-data-access';
import { EducationalCategory } from '@mas/models';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { EducationalCategoryFormComponent } from '../educational-category-form/educational-category-form.component';

@Component({
  selector: 'mas-category-actions',
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
export class CategoryActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private categoryStore = inject(EducationalCategoryStore);
  category: EducationalCategory | null = null;

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.category = params.data;
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Educational Category`,
        content: `Are you sure you want to delete ${this.category?.category}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.category?.id;
          if (id) {
            this.categoryStore.deleteCategory(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(EducationalCategoryFormComponent, {
      data: this.category,
      panelClass: 'w-full',
    });
  }
}
