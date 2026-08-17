import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AddUserComponent } from '@mas/frontend-shared-components';
import { type User } from '@mas/prisma-client/browser';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-users-actions',
  imports: [MatIcon, MatButtonModule],
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
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class UsersActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  user = signal<User | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.user.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openEdit() {
    this.dialog.open(AddUserComponent, {
      data: this.user(),
      panelClass: 'w-full',
    });
  }
}
