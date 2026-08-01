import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { EducationalContentStore } from '@mas/frontend-shared-data-access';
import { EducationalContentWithCategories } from '@mas/models';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { EducationalContentFormComponent } from '../educational-content-form/educational-content-form.component';

@Component({
  selector: 'mas-content-actions',
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
export class ContentActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private contentStore = inject(EducationalContentStore);
  content: EducationalContentWithCategories | null = null;

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.content = params.data;
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Educational Content`,
        content: `Are you sure you want to delete ${this.content?.title}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.content?.id;
          if (id) {
            this.contentStore.deleteContent(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(EducationalContentFormComponent, {
      data: this.content,
      panelClass: 'w-full',
    });
  }
}
