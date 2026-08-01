import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { type Requirement } from '@prisma/client';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { RequirementsStore } from '../../requirements.store';
import { AddRequirementComponent } from '../add-requirement/add-requirement.component';

@Component({
  selector: 'mas-requirement-actions',
  imports: [MatIcon],
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
export class RequirementActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private requirementsStore = inject(RequirementsStore);
  requirement = signal<Requirement | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.requirement.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Requirement`,
        content: `Are you sure you want to delete ${this.requirement()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.requirement()?.id;
          if (id) {
            this.requirementsStore.deleteRequirement(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddRequirementComponent, {
      data: this.requirement(),
      panelClass: 'w-full',
    });
  }
}
