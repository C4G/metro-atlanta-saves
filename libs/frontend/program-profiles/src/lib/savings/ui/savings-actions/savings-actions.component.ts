import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AddCheckpointComponent, AddImageComponent, ViewDynamicImageComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { ExtendedCheckpoint } from '@mas/models';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'mas-savings-actions',
  imports: [MatIcon, MatIconButton, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center h-full',
  },
  template: `
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
      @if (!hasVerifiedImage()) {
        <button mat-menu-item (click)="openEdit()">
          <mat-icon color="primary">edit</mat-icon>
          <span>Edit</span>
        </button>
      }
      @if (hasImages()) {
        <button mat-menu-item (click)="viewImage()">
          <mat-icon color="accent">image</mat-icon>
          <span>View Image(s)</span>
        </button>
      } @else {
        <button mat-menu-item (click)="addImage()">
          <mat-icon color="accent">add</mat-icon>
          <span>Add Image(s)</span>
        </button>
      }
    </mat-menu>
  `,
})
export class SavingsActionsComponent implements ICellRendererAngularComp {
  private dialog = inject(MatDialog);
  private usersOnProgramsStore = inject(UsersOnProgramsStore);

  data = signal<ExtendedCheckpoint | undefined>(undefined);
  hasImages = computed(() => {
    const images = this.data()?.images;
    return images && Array.isArray(images) && images.length > 0;
  });
  hasVerifiedImage = computed(() => {
    const images = this.data()?.images;
    return images && Array.isArray(images) && images.some((img: any) => img.imageVerified);
  });
  firstImage = computed(() => {
    const images = this.data()?.images;
    return images && Array.isArray(images) ? images[0] : undefined;
  });

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.data.set(params.data);
  }
  refresh(): boolean {
    return false;
  }

  viewImage() {
    const images = this.data()?.images;
    if (images && Array.isArray(images) && images.length > 0) {
      this.dialog.open(ViewDynamicImageComponent, {
        width: '100dvw',
        height: '100dvh',
        maxWidth: '100dvw',
        maxHeight: '100dvw',
        data: {
          images: images,
          checkpointId: this.data()?.id,
          cb: () => {
            this.usersOnProgramsStore.getUserOnProgram();
          },
        },
      });
    }
  }

  addImage() {
    const dialogData = this.data()?.id;
    if (dialogData)
      this.dialog.open(AddImageComponent, {
        data: {
          id: dialogData,
          programId: this.data()?.programId,
          cb: () => {
            this.usersOnProgramsStore.getUserOnProgram();
          },
        },
        panelClass: 'w-full',
      });
  }

  openEdit() {
    this.dialog.open(AddCheckpointComponent, {
      data: { checkpoint: this.data(), programId: this.data()?.programId },
      panelClass: 'w-full',
    });
  }
}
