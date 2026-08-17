import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ConfirmDialogComponent } from '@mas/frontend-shared-components';
import { PartnersStore } from '@mas/frontend-shared-data-access';
import { type Partner } from '@mas/prisma-client/browser';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';
import { AddPartnerComponent } from '../add-partner/add-partner.component';

@Component({
  selector: 'mas-partner-actions',
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
export class PartnerActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private partnersStore = inject(PartnersStore);
  partner = signal<Partner | null>(null);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.partner.set(params.data);
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Partner`,
        content: `Are you sure you want to delete ${this.partner()?.name}?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.partner()?.id;
          if (id) {
            this.partnersStore.deletePartner(id);
          }
        },
      },
    });
  }

  openEdit() {
    this.dialog.open(AddPartnerComponent, {
      data: this.partner(),
      panelClass: 'w-full',
    });
  }
}
