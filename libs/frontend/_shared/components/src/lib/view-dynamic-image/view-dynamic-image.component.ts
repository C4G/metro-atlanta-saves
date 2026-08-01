import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { CheckpointsStore, ImagesStore } from '@mas/frontend-shared-data-access';
import { ConfirmDialogComponent } from '../confirm-dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MatIcon } from '@angular/material/icon';

type ViewDynamicImageData = {
  imageId?: string;
  images?: Array<{ id: string; imageVerified?: boolean }>;
  checkpointId?: string;
  imageVerified?: boolean;
  cb?: () => void;
};

@Component({
  selector: 'mas-view-dynamic-image',
  imports: [MatDialogModule, MatButton, MatIconButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <button mat-icon-button mat-dialog-close class="absolute top-2 right-2 z-10">
        <mat-icon>close</mat-icon>
      </button>
      <mat-dialog-content class="max-h-[calc(100dvh-4rem)] relative">
        @if (hasMultipleImages()) {
          <div
            class="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-10"
          >
            <button
              mat-icon-button
              class="pointer-events-auto !bg-black/90 hover:bg-black text-white shadow-lg disabled:opacity-10"
              [disabled]="currentIndex() === 0"
              (click)="previousImage()"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button
              mat-icon-button
              class="pointer-events-auto !bg-black/90 hover:bg-black text-white shadow-lg disabled:opacity-10"
              [disabled]="currentIndex() === totalImages() - 1"
              (click)="nextImage()"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
        @if (currentSafeUrl(); as url) {
          @if (currentImageType()?.includes('pdf')) {
            <iframe
              [src]="url"
              class="mx-auto max-h-[calc(100dvh-7rem)] object-contain"
              width="100%"
              height="100%"
            ></iframe>
          } @else {
            <img [src]="url" class="mx-auto max-h-[calc(100dvh-7rem)] object-contain" />
          }
        }
        @if (hasMultipleImages()) {
          <div
            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm"
          >
            {{ currentIndex() + 1 }} / {{ totalImages() }}
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="h-16">
        @if (authStore.user()?.role && data.checkpointId) {
          @if (!currentImageVerified()) {
            <button mat-button color="primary" (click)="onApprove()">Approve Checkpoint</button>
            <button mat-button color="warn" (click)="onReject()">Reject Checkpoint</button>
          }
        }
        @if (authStore.isAdmin() || !currentImageVerified()) {
          <button mat-button color="warn" (click)="onDelete()">Delete</button>
        }
      </mat-dialog-actions>
    </div>
  `,
})
export class ViewDynamicImageComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  imagesStore = inject(ImagesStore);
  authStore = inject(AuthStore);
  checkpointsStore = inject(CheckpointsStore);
  data = inject<ViewDynamicImageData>(MAT_DIALOG_DATA);

  currentIndex = signal(0);
  allImages = computed(
    () =>
      this.data.images ||
      (this.data.imageId ? [{ id: this.data.imageId, imageVerified: this.data.imageVerified }] : []),
  );
  hasMultipleImages = computed(() => this.allImages().length > 1);
  totalImages = computed(() => this.allImages().length);
  currentImageData = computed(() => this.allImages()[this.currentIndex()]);
  currentImageVerified = computed(() => this.currentImageData()?.imageVerified ?? false);

  imageUrl = computed(() => {
    const blob = this.imagesStore.blob();

    return !blob ? '' : URL.createObjectURL(blob);
  });

  currentSafeUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl()));
  currentImageType = computed(() => this.imagesStore.type());

  constructor() {
    const initialImageId = this.allImages()[0]?.id;
    if (initialImageId) {
      this.imagesStore.getImage(initialImageId);
    }
  }

  nextImage() {
    const currentIdx = this.currentIndex();
    const total = this.totalImages();
    if (currentIdx < total - 1) {
      this.loadImage(currentIdx + 1);
    }
  }

  previousImage() {
    const currentIdx = this.currentIndex();
    if (currentIdx > 0) {
      this.loadImage(currentIdx - 1);
    }
  }

  private loadImage(index: number) {
    const currentUrl = this.imageUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    this.currentIndex.set(index);
    const imageId = this.allImages()[index]?.id;
    if (imageId) {
      this.imagesStore.getImage(imageId);
    }
  }

  ngOnDestroy() {
    const imageUrl = this.imageUrl();
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      this.imagesStore.reset();
    }
  }

  onApprove() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Approve Checkpoint`,
        content: `Are you sure you want to approve this checkpoint? This will approve all ${this.totalImages()} image${this.totalImages() > 1 ? 's' : ''} in this checkpoint. Once this is done you can no longer reject it and the user will receive an email that the checkpoint was approved.`,
        color: 'primary',
        onYesClick: () => {
          const { checkpointId, cb } = this.data ?? {};
          if (checkpointId) {
            this.checkpointsStore.approveCheckpoint({
              id: checkpointId,
              cb: () => {
                if (cb) cb();
                // Reload current image to get updated verification status
                const imageId = this.currentImageData()?.id;
                if (imageId) {
                  this.imagesStore.getImage(imageId);
                }
              },
            });
          }
        },
      },
    });
  }

  onReject() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Reject Checkpoint`,
        content: `Are you sure you want to reject this checkpoint? This will reject all ${this.totalImages()} image${this.totalImages() > 1 ? 's' : ''} in this checkpoint. The user will receive an email of the rejection.`,
        color: 'primary',
        onYesClick: () => {
          const { checkpointId, cb } = this.data ?? {};
          if (checkpointId) {
            this.checkpointsStore.rejectCheckpoint({
              id: checkpointId,
              cb: () => {
                if (cb) cb();
                // Reload current image to get updated verification status
                const imageId = this.currentImageData()?.id;
                if (imageId) {
                  this.imagesStore.getImage(imageId);
                }
              },
            });
          }
        },
      },
    });
  }

  onDelete() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete Image`,
        content: `Are you sure you want to delete the image?`,
        color: 'warn',
        onYesClick: () => {
          const id = this.currentImageData()?.id;
          if (id) {
            this.imagesStore.deleteImage({
              id,
              cb: () => {
                if (this.data.cb) this.data.cb();
                // If there are more images, navigate to an adjacent one
                const total = this.totalImages();
                if (total > 1) {
                  const currentIdx = this.currentIndex();
                  // If we're at the end, go to previous, otherwise stay at same index
                  const nextIdx = currentIdx === total - 1 ? currentIdx - 1 : currentIdx;
                  this.loadImage(Math.max(0, nextIdx));
                }
              },
            });
          }
        },
      },
    });
  }
}
