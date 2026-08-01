import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { AddUsersOnProgramsComponent } from '../add-users-on-programs/add-users-on-programs.component';

@Component({
  selector: 'mas-users-on-programs-actions',
  imports: [MatIcon, RouterLink, MatMenuModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center h-full">
      <button
        class="!flex !justify-center !content-center"
        mat-icon-button
        aria-label="Actions"
        title="Actions"
        [matMenuTriggerFor]="actionsMenu"
      >
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #actionsMenu="matMenu">
        <a mat-menu-item [routerLink]="'./' + usersOnPrograms()?.userId">
          <mat-icon color="primary">checklist</mat-icon>
          <span>Checklists</span>
        </a>
        <button mat-menu-item (click)="openEdit()">
          <mat-icon color="accent">edit</mat-icon>
          <span>Edit</span>
        </button>
        <button mat-menu-item (click)="openConfirm()">
          <mat-icon color="warn">delete</mat-icon>
          <span>Delete</span>
        </button>
      </mat-menu>
    </div>
  `,
  host: {
    class: 'block h-full',
  },
})
export class UsersOnProgramsActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private usersOnProgramsStore = inject(UsersOnProgramsStore);
  usersOnPrograms = signal<UsersOnProgramsWithName | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.usersOnPrograms.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Program User`,
        content: `Are you sure you want to delete ${this.usersOnPrograms()?.firstName} ${
          this.usersOnPrograms()?.lastName
        }?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.usersOnPrograms()?.userId;
          if (id) {
            this.usersOnProgramsStore.deleteUser(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddUsersOnProgramsComponent, {
      data: this.usersOnPrograms(),
      panelClass: 'w-full',
    });
  }
}
