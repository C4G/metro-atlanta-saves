import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { LearningsStore } from '@mas/frontend-shared-data-access';
import { type Learning } from '@prisma/client';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { AddLearningComponent } from '../add-learning/add-learning.component';

@Component({
  selector: 'mas-learning-actions',
  imports: [MatIcon, MatIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 h-full">
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        [title]="$any(learning())?.hidden ? 'Show on home page' : 'Hide from home page'"
        (click)="toggleHidden()"
      >
        <mat-icon>{{ $any(learning())?.hidden ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>
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
export class LearningActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private learningsStore = inject(LearningsStore);
  learning = signal<Learning | null>(null);

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.learning.set(params.data);
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.learning.set(params.data);
    return true;
  }

  toggleHidden(): void {
    const item = this.learning();
    if (item) {
      this.learningsStore.patchLearning({ id: item.id, hidden: !(item as any).hidden });
    }
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Learning`,
        content: `Are you sure you want to delete ${this.learning()?.title}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.learning()?.id;
          if (id) {
            this.learningsStore.deleteLearning(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddLearningComponent, {
      data: this.learning(),
      panelClass: 'w-full',
    });
  }
}
