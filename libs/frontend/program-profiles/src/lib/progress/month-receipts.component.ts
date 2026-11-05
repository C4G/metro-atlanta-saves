import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MatDialog } from '@angular/material/dialog';
import { ReceiptPreviewComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { MonthReceiptsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-month-receipts',
  imports: [SpinnerComponent],
  providers: [MonthReceiptsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-5 border-t border-outline pt-4" [attr.aria-label]="monthName() + ' receipts'">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="text-sm font-semibold">{{ archive() ? 'Earlier receipts' : 'Receipts' }}</h4>
        @if (store.receipts().length) {
          <span
            role="status"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-strong"
          >
            <svg
              aria-hidden="true"
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m8 12 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9" />
            </svg>
            {{ store.receipts().length === 1 ? 'Receipt attached' : store.receipts().length + ' receipts attached' }}
          </span>
        }
      </div>
      <p class="mt-1 text-xs leading-5 text-ink-muted">
        {{
          archive()
            ? 'Previously uploaded receipts without a month association.'
            : store.receipts().length
              ? 'Select a receipt to preview it.'
              : 'Attach supporting documents for ' + monthName() + '.'
        }}
      </p>
      @if (store.loading()) {
        <p role="status" class="mt-3 text-xs text-ink-muted flex items-center gap-2">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading receipts</span>
        </p>
      }
      @if (store.loadFailed()) {
        <p role="alert" class="mt-3 text-xs text-danger">Receipts could not be loaded.</p>
        <button
          type="button"
          (click)="reload()"
          class="min-h-11 rounded-lg px-2 text-sm text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Try again
        </button>
      }
      <ul class="space-y-2" [class.mt-3]="store.receipts().length > 0">
        @for (receipt of store.receipts(); track receipt.id) {
          <li class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
            <button
              type="button"
              (click)="view(receipt.id, receipt.name)"
              [attr.aria-label]="'View ' + receipt.name"
              class="flex h-16 min-w-0 items-center gap-3 rounded-xl border border-outline bg-surface-raised px-3 text-left hover:bg-brand-soft/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong"
              >
                <svg
                  aria-hidden="true"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h4" />
                </svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-ink" [title]="receipt.name">
                  {{ receipt.name }}
                </span>
                <span class="mt-1 block text-xs font-medium text-brand-strong">View receipt</span>
              </span>
            </button>
            @if (!receipt.imageVerified || auth.isAdmin()) {
              @if (confirmingId() === receipt.id) {
                <div class="col-span-2 mt-2 rounded-xl border border-outline bg-surface p-3">
                  <p class="text-xs leading-5 text-ink-muted">
                    Delete this receipt? This permanently removes the file. Your saved progress will not change.
                  </p>
                  <div class="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      (click)="confirmingId.set(null)"
                      class="min-h-11 rounded-lg px-3 text-xs font-semibold text-ink-muted hover:bg-brand-soft/20 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Keep receipt
                    </button>
                    <button
                      type="button"
                      (click)="remove(receipt.id)"
                      class="min-h-11 rounded-lg border border-danger/30 px-3 text-xs font-semibold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Delete receipt
                    </button>
                  </div>
                </div>
              } @else {
                <button
                  type="button"
                  (click)="confirmingId.set(receipt.id)"
                  [disabled]="!!store.deletingId()"
                  [attr.aria-label]="'Delete ' + receipt.name"
                  [title]="'Delete ' + receipt.name"
                  class="inline-flex h-16 w-11 items-center justify-center rounded-xl border border-outline text-ink-muted hover:bg-danger/10 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:opacity-50"
                >
                  @if (store.deletingId() === receipt.id) {
                    <mas-spinner />
                  } @else {
                    <svg
                      aria-hidden="true"
                      class="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                    </svg>
                  }
                </button>
              }
            }
          </li>
        }
      </ul>
      @if (!archive() && !store.loading() && !store.loadFailed()) {
        <input
          #files
          type="file"
          class="sr-only"
          tabindex="-1"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          multiple
          (change)="upload(files)"
        />
        <button
          type="button"
          [disabled]="store.uploading() || !context()"
          [attr.aria-busy]="store.uploading()"
          (click)="files.click()"
          class="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-outline px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:opacity-50"
        >
          <span class="relative inline-flex items-center justify-center">
            <span [class.invisible]="store.uploading()">
              {{ store.receipts().length ? 'Add more receipts' : 'Upload receipts' }}
            </span>
            @if (store.uploading()) {
              <mas-spinner class="absolute" />
              <span class="sr-only">Uploading receipts</span>
            }
          </span>
        </button>
        <p class="mt-2 text-xs leading-5 text-ink-subtle">
          Choose one or more files · JPG, PNG, WebP, or PDF · Up to 5 MB each
        </p>
      }
      @if (store.error()) {
        <p role="alert" class="mt-2 text-xs text-danger">{{ store.error() }}</p>
      }
      @if (store.notice()) {
        <p role="status" class="mt-2 text-xs text-brand-strong">{{ store.notice() }}</p>
      }
    </section>
  `,
})
export class MonthReceiptsComponent {
  readonly programId = input.required<string>();
  readonly checkpointId = input.required<string>();
  readonly monthName = input.required<string>();
  readonly archive = input(false);
  readonly store = inject(MonthReceiptsStore);
  readonly auth = inject(AuthStore);
  readonly confirmingId = signal<string | null>(null);
  private readonly dialog = inject(MatDialog);
  readonly context = computed(() => {
    const userId = this.auth.user()?.id;
    return userId ? { programId: this.programId(), checkpointId: this.checkpointId(), userId } : null;
  });
  private loadedMonth = '';
  readonly loadEffect = effect(() => {
    const context = this.context();
    const monthName = this.monthName();
    untracked(() => {
      if (monthName !== this.loadedMonth) {
        this.loadedMonth = monthName;
        this.confirmingId.set(null);
        this.store.reset();
      }
      if (context && (context.checkpointId || this.archive())) this.store.load(context);
    });
  });
  reload(): void {
    const context = this.context();
    if (context)
      this.store.load({ ...context, checkpointId: context.checkpointId || this.store.receiptCheckpointId() });
  }
  upload(input: HTMLInputElement): void {
    const context = this.context();
    if (context && input.files)
      this.store.upload({ ...context, monthName: this.monthName(), files: Array.from(input.files) });
    input.value = '';
  }
  view(id: string, name: string): void {
    this.dialog.open(ReceiptPreviewComponent, {
      data: { id, name },
      width: '60rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaLabelledBy: 'receipt-preview-heading',
    });
  }
  remove(id: string): void {
    this.confirmingId.set(null);
    this.store.remove(id);
  }
}
