import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { ProgramsStore, UserAndEnrollment } from '@mas/frontend-shared-data-access';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-enrollments-actions',
  imports: [MatIcon, MatIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 h-full">
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Approve"
        title="Approve"
        (click)="openApprove()"
      >
        <mat-icon class="text-green-500">check</mat-icon>
      </button>
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Reject"
        title="Reject"
        (click)="openReject()"
      >
        <mat-icon color="warn">delete</mat-icon>
      </button>
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class EnrollmentsActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private programsStore = inject(ProgramsStore);
  enrollment = signal<UserAndEnrollment | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.enrollment.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openApprove() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Approve User`,
        content: `Are you sure you want to approve ${this.enrollment()?.firstName} ${this.enrollment()?.lastName} and add them to the program?`,
        color: 'primary',
        onYesClick: () => {
          const enrollmentId = this.enrollment()?.id;
          const programId = this.enrollment()?.programId;
          if (programId && enrollmentId) {
            this.programsStore.convertToUser({ programId, enrollmentId });
          }
        },
      },
    });
  }

  openReject() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Reject User`,
        content: `Are you sure you want to reject and delete ${this.enrollment()?.firstName} ${this.enrollment()?.lastName}?`,
        color: 'warn',
        onYesClick: () => {
          const enrollmentId = this.enrollment()?.id;
          const programId = this.enrollment()?.programId;
          if (programId && enrollmentId) {
            this.programsStore.deleteEnrollment({ programId, enrollmentId });
          }
        },
      },
    });
  }
}
