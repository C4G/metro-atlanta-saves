import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, OnDestroy, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DocumentDropzoneComponent } from '@mas/frontend-shared-components';
import { CheckpointsStore, DocumentManagementStore, ImagesStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-receipts',
  imports: [DatePipe, DocumentDropzoneComponent, MatIcon, MatProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="receipts-heading">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your documents</p>
        <h2 id="receipts-heading" class="mt-1 text-2xl font-black tracking-tight">Receipts</h2>
        <p class="mt-2 text-sm text-ink-muted">Upload and review the documents connected to your progress.</p>
      </div>

      <div class="mt-5 rounded-3xl border border-outline bg-surface-raised p-4 sm:p-6">
        <mas-document-dropzone [programId]="id()" />
      </div>

      @if (documentManagementStore.filteredImages().length > 0) {
        <div class="mt-6 overflow-hidden rounded-3xl border border-outline bg-surface-raised">
          @if (documentManagementStore.currentImage(); as image) {
            <div
              class="flex flex-col gap-4 border-b border-outline px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wider text-brand-strong">
                  {{ image.checkpoint?.name || 'Unassigned document' }}
                </p>
                <h3 class="mt-1 truncate text-lg font-black">{{ image.name }}</h3>
                <p class="mt-1 text-sm text-ink-muted">Uploaded {{ image.createdAt | date: 'medium' }}</p>
              </div>
              <div class="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous receipt"
                  (click)="documentManagementStore.navigatePrevious()"
                  [disabled]="documentManagementStore.currentImageIndex() === 0"
                >
                  <mat-icon aria-hidden="true">chevron_left</mat-icon>
                </button>
                <span class="min-w-16 text-center text-sm font-bold text-ink-muted">
                  {{ documentManagementStore.currentImageIndex() + 1 }} /
                  {{ documentManagementStore.filteredImages().length }}
                </span>
                <button
                  type="button"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next receipt"
                  (click)="documentManagementStore.navigateNext()"
                  [disabled]="
                    documentManagementStore.currentImageIndex() === documentManagementStore.filteredImages().length - 1
                  "
                >
                  <mat-icon aria-hidden="true">chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="flex min-h-80 items-center justify-center bg-surface-subtle p-4 sm:min-h-[32rem] sm:p-6">
              @if (documentManagementStore.imageUrls()[image.id]; as url) {
                @if (image.type.includes('pdf')) {
                  <iframe [src]="url" class="h-[32rem] w-full rounded-xl bg-surface" title="Receipt preview"></iframe>
                } @else {
                  <img
                    [src]="url"
                    class="max-h-[36rem] max-w-full rounded-xl object-contain"
                    [alt]="'Preview of ' + image.name"
                  />
                }
              } @else {
                <div class="flex flex-col items-center gap-3 text-ink-muted">
                  <mat-spinner diameter="36" />
                  <span class="text-sm font-semibold">Loading preview…</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="mt-6">
          <h3 class="text-base font-black">All receipts</h3>
          <div class="mt-3 overflow-x-auto pb-2">
            <div class="flex min-w-max gap-3">
              @for (image of documentManagementStore.filteredImages(); track image.id) {
                <button
                  type="button"
                  class="w-36 rounded-2xl border border-outline bg-surface-raised p-3 text-left transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                  [class.border-brand]="documentManagementStore.currentImage().id === image.id"
                  [class.bg-brand-soft]="documentManagementStore.currentImage().id === image.id"
                  [attr.aria-label]="'View ' + image.name"
                  (click)="documentManagementStore.selectImage($index)"
                >
                  <span class="flex h-20 items-center justify-center overflow-hidden rounded-xl bg-surface-subtle">
                    @if (documentManagementStore.imageUrls()[image.id]; as url) {
                      @if (image.type.includes('pdf')) {
                        <mat-icon class="text-brand-strong" aria-hidden="true">picture_as_pdf</mat-icon>
                      } @else {
                        <img [src]="url" class="h-full w-full object-cover" alt="" />
                      }
                    } @else {
                      <mat-icon class="text-ink-subtle" aria-hidden="true">image</mat-icon>
                    }
                  </span>
                  <span class="mt-2 block truncate text-xs font-bold">
                    {{ image.checkpoint?.name || 'Unassigned' }}
                  </span>
                  <span class="mt-0.5 block text-xs text-ink-subtle">{{ image.createdAt | date: 'shortDate' }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="mt-6 rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-10 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">receipt_long</mat-icon>
          <h3 class="mt-3 text-lg font-bold">No receipts uploaded</h3>
          <p class="mt-1 text-sm text-ink-muted">Use the uploader above when you have a document to share.</p>
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class ReceiptsComponent implements OnDestroy {
  id = input.required<string>();
  documentManagementStore = inject(DocumentManagementStore);
  imagesStore = inject(ImagesStore);
  checkpointsStore = inject(CheckpointsStore);

  loadDocumentsEffect = effect(() => {
    const programId = this.id();
    untracked(() => {
      this.documentManagementStore.updateProgramId(programId);
      this.checkpointsStore.setProgramId(programId);
      this.imagesStore.getAllImages({
        programId,
        userFilter: this.documentManagementStore.selectedUserFilter(),
        checkpointFilter: this.documentManagementStore.selectedCheckpointFilter(),
      });
    });
  });

  ngOnDestroy() {
    this.documentManagementStore.cleanup();
  }
}
