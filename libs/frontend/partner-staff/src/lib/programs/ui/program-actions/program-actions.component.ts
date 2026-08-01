import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { type Program } from '@prisma/client';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { AddProgramComponent } from '../add-program/add-program.component';
import { CloneDialogComponent } from './clone-dialog/clone-dialog.component';

@Component({
  selector: 'mas-program-actions',
  imports: [MatIcon, MatIconButton, RouterLink, MatMenuModule, MatButtonModule],
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
        <a mat-menu-item [routerLink]="'./' + program()?.id">
          <mat-icon color="primary">visibility</mat-icon>
          <span>View</span>
        </a>
        @if (program()?.isTemplate) {
          <button mat-menu-item (click)="openCloneConfirm()">
            <mat-icon color="blue-50">content_copy</mat-icon>
            <span>Clone</span>
          </button>
        }
        <button mat-menu-item (click)="openEdit()">
          <mat-icon color="accent">edit</mat-icon>
          <span>Edit</span>
        </button>
        <button mat-menu-item (click)="openDeleteConfirm()">
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
export class ProgramActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private programsStore = inject(ProgramsStore);
  program = signal<Program | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.program.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openDeleteConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Program`,
        content: `Are you sure you want to delete ${this.program()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.program()?.id;
          if (id) {
            this.programsStore.deleteProgram(id);
          }
        },
      },
    });
  }

  openCloneConfirm() {
    const id = this.program()?.id;

    this.dialog.open(CloneDialogComponent, {
      data: {
        id,
        name: this.program()?.name,
        onYesClick: (name: string) => {
          if (id) {
            this.programsStore.cloneProgram([id, name]);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddProgramComponent, {
      data: this.program(),
      panelClass: 'w-full',
    });
  }
}
