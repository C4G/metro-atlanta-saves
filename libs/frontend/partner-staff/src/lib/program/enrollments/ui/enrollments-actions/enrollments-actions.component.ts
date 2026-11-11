import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { ProgramsStore, UserAndEnrollment } from '@mas/frontend-shared-data-access';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-enrollments-actions',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 h-full">
      <button
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Approve"
        title="Approve"
        (click)="openApprove()"
      >
        <mat-icon aria-hidden="true">check</mat-icon>
      </button>
      <button
        class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
        aria-label="Reject"
        title="Reject"
        (click)="openReject()"
      >
        <mat-icon aria-hidden="true">delete</mat-icon>
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
