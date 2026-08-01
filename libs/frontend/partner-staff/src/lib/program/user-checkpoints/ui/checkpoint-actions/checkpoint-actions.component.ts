import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import {
  AddCheckpointComponent,
  AddImageComponent,
  ConfirmDialogComponent,
  ViewDynamicImageComponent,
} from '@mas/frontend-shared-components';
import { CheckpointsStore } from '@mas/frontend-shared-data-access';
import { ExtendedCheckpoint } from '@mas/models';
import { type ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-checkpoint-actions',
  imports: [MatIcon, MatMenu, MatMenuItem, RouterModule, MatMenuTrigger, MatButtonModule],
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
        <button mat-menu-item (click)="hasImages() ? openImage() : addImage()">
          <mat-icon color="accent">image</mat-icon>
          <span>{{ hasImages() ? 'View Image(s)' : 'Add Image(s)' }}</span>
        </button>
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
export class CheckpointActionsComponent {
  id = input.required<string>();
  private dialog = inject(MatDialog);
  private checkpointsStore = inject(CheckpointsStore);
  private locale = inject(LOCALE_ID);
  private programId = <string | null>null;
  checkpoint = signal<ExtendedCheckpoint | null>(null);
  hasImages = computed(() => {
    const images = this.checkpoint()?.images;
    return images && Array.isArray(images) && images.length > 0;
  });
  firstImage = computed(() => {
    const images = this.checkpoint()?.images;
    return images && Array.isArray(images) ? images[0] : undefined;
  });

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.checkpoint.set(params.data);
    this.programId = params.data.programId;
  }

  refresh(): boolean {
    return false;
  }

  openConfirm() {
    const createdAt = this.checkpoint()?.createdAt;
    const id = this.checkpoint()?.id;
    if (createdAt && id) {
      this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: `Delete Checkpoint`,
          content: `Are you sure you want to delete the checkpoint on ${formatDate(
            createdAt,
            'MM-dd-yyyy',
            this.locale,
          )}?`,
          color: 'warn',
          onYesClick: () => {
            this.checkpointsStore.deleteCheckpoint(id);
          },
        },
      });
    }
  }

  openEdit() {
    this.dialog.open(AddCheckpointComponent, {
      data: { checkpoint: this.checkpoint(), programId: this.programId },
      panelClass: 'w-full',
    });
  }

  addImage() {
    const dialogData = this.checkpoint()?.id;
    if (dialogData)
      this.dialog.open(AddImageComponent, {
        data: {
          id: dialogData,
          programId: this.programId,
          cb: () => {
            this.checkpointsStore.getCheckpoints();
          },
        },
        panelClass: 'w-full',
      });
  }

  openImage() {
    const images = this.checkpoint()?.images;
    if (images && Array.isArray(images) && images.length > 0) {
      this.dialog.open(ViewDynamicImageComponent, {
        width: '100dvw',
        height: '100dvh',
        maxWidth: '100dvw',
        maxHeight: '100dvw',
        data: {
          images: images,
          checkpointId: this.checkpoint()?.id,
          cb: () => {
            this.checkpointsStore.getCheckpoints();
          },
        },
      });
    }
  }
}
