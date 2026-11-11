import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore } from '@mas/frontend-shared-data-access';
import { type User } from '@mas/prisma-client/browser';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

type Ally = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'lastLogin' | 'bio'> & {
  userId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

@Component({
  selector: 'mas-allies-on-programs-actions',
  imports: [MatIcon, MatMenu, MatMenuItem, MatMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center h-full">
      <button
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Actions"
        title="Actions"
        [matMenuTriggerFor]="actionsMenu"
      >
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #actionsMenu="matMenu">
        <button mat-menu-item (click)="openConfirm()">
          <mat-icon class="text-danger">delete</mat-icon>
          <span>Delete</span>
        </button>
      </mat-menu>
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class AlliesOnProgramsActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private alliesStore = inject(AlliesOnProgramsStore);
  allies = signal<Ally | null>(null);

  agInit(params: ICellRendererParams<Ally, any, any>): void {
    this.allies.set(params.data ?? null);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Ally`,
        content: `Are you sure you want to delete ${this.allies()?.firstName} ${this.allies()?.lastName}?`,
        color: 'warn',
        onYesClick: () => {
          const ally = this.allies();
          const id = ally?.userId;
          if (id) {
            this.alliesStore.deleteAlly(id);
            dialogRef.close();
          }
        },
      },
    });
  }
}
