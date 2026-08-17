import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { CheckpointNamesStore } from '@mas/frontend-shared-data-access';
import type { CheckpointName } from '@mas/prisma-client/browser';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AddCheckpointNameComponent } from '../add-checkpoint-name/add-checkpoint-name.component';

@Component({
  selector: 'mas-checkpoint-names-actions',
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
export class CheckpointNamesActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private checkpointNamesStore = inject(CheckpointNamesStore);
  checkpointName = signal<CheckpointName | null>(null);

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.checkpointName.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Checkpoint Name`,
        content: `Are you sure you want to delete ${this.checkpointName()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const name = this.checkpointName()?.name;
          if (name) {
            this.checkpointNamesStore.deleteName(name);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddCheckpointNameComponent, {
      data: this.checkpointName(),
      panelClass: 'w-full',
    });
  }
}
