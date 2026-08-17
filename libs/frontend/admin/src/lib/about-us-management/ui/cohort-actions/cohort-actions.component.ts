import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { type Cohort } from '@mas/prisma-client/browser';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { CohortsStore } from '@mas/frontend-shared-data-access';
import { AddCohortComponent } from '../add-cohort/add-cohort.component';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-cohort-actions',
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
export class CohortActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private cohortsStore = inject(CohortsStore);
  cohort = signal<Cohort | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.cohort.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Cohort`,
        content: `Are you sure you want to delete ${this.cohort()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.cohort()?.id;
          if (id) {
            this.cohortsStore.deleteCohort(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddCohortComponent, {
      data: this.cohort(),
      panelClass: 'w-full',
    });
  }
}
