import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ImagesStore } from '@mas/frontend-shared-data-access';

import { SpinnerComponent } from '../loader/spinner.component';

@Component({
  selector: 'mas-receipt-preview',
  imports: [SpinnerComponent, MatDialogClose],
  providers: [ImagesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-h-[90dvh] min-w-0 flex-col bg-surface text-ink">
      <header class="flex items-start justify-between gap-4 border-b border-outline p-5">
        <div class="min-w-0">
          <p class="text-xs font-medium text-ink-muted">Receipt preview</p>
          <h2 id="receipt-preview-heading" class="mt-1 break-all text-lg font-semibold">{{ data.name }}</h2>
        </div>
        <button
          type="button"
          mat-dialog-close
          class="min-h-11 shrink-0 rounded-xl border border-outline px-4 text-sm font-semibold text-brand-strong hover:bg-brand-soft/20 focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Close
        </button>
      </header>
      <div class="min-h-64 min-w-0 overflow-auto bg-surface-subtle p-4">
        @if (store.previewLoading()) {
          <p role="status" class="p-6 text-center text-sm text-ink-muted flex items-center gap-2 justify-center">
            <mas-spinner class="text-brand" />
            <span class="sr-only">Loading receipt</span>
          </p>
        } @else if (store.previewError()) {
          <p role="alert" class="p-6 text-sm text-danger">We could not open this receipt.</p>
          <button
            type="button"
            (click)="store.getImage(data.id)"
            class="min-h-11 rounded-xl px-4 text-sm font-semibold text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        } @else if (safeUrl(); as url) {
          @if (store.type()?.includes('pdf')) {
            <iframe
              [src]="url"
              [title]="data.name"
              class="h-[65dvh] w-full rounded-xl border border-outline bg-surface"
            ></iframe>
          } @else {
            <img [src]="url" [alt]="data.name" class="mx-auto max-h-[65dvh] max-w-full rounded-xl object-contain" />
          }
        }
      </div>
    </div>
  `,
})
export class ReceiptPreviewComponent {
  readonly data = inject<{ id: string; name: string }>(MAT_DIALOG_DATA);
  readonly store = inject(ImagesStore);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly objectUrl = signal<string | null>(null);
  readonly safeUrl = computed(() => {
    const url = this.objectUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly urlEffect = effect((onCleanup) => {
    const blob = this.store.blob();
    if (!blob) {
      this.objectUrl.set(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    this.objectUrl.set(url);
    onCleanup(() => URL.revokeObjectURL(url));
  });
  constructor() {
    this.store.getImage(this.data.id);
  }
}
