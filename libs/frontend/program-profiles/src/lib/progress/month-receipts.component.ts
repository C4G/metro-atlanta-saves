import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ReceiptPreviewComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { MonthReceiptsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-month-receipts',
  imports: [MatIcon, SpinnerComponent],
  providers: [MonthReceiptsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-3" [attr.aria-label]="monthName() + ' receipts'">
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="text-sm font-bold">{{ archive() ? 'Earlier receipts' : 'Receipts' }}</h3>
        @if (store.receipts().length) {
          <span role="status" class="text-xs tabular-nums text-ink-muted">
            {{ store.receipts().length === 1 ? '1 file' : store.receipts().length + ' files' }}
          </span>
        }
      </div>
      @if (archive()) {
        <p class="text-xs leading-5 text-ink-muted">Previously uploaded receipts without a month association.</p>
      }
      @if (store.loading()) {
        <p role="status" class="flex items-center gap-2 text-xs text-ink-muted">
          <mas-spinner class="text-brand" />
          <span class="sr-only">Loading receipts</span>
        </p>
      }
      @if (store.loadFailed()) {
        <p role="alert" class="text-xs text-danger">Receipts could not be loaded.</p>
        <button
          type="button"
          (click)="reload()"
          class="min-h-10 self-start rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-ink transition-colors hover:border-brand/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Try again
        </button>
      }
      @if (store.receipts().length) {
        <ul class="flex flex-col gap-2">
          @for (receipt of store.receipts(); track receipt.id) {
            <li class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
              <button
                type="button"
                (click)="view(receipt.id, receipt.name)"
                [attr.aria-label]="'View ' + receipt.name"
                class="flex min-h-[3.25rem] min-w-0 items-center gap-3 rounded-xl border border-brand/25 bg-surface-raised/70 py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft/70 text-brand-strong"
                  aria-hidden="true"
                >
                  <mat-icon class="mas-icon-md">receipt_long</mat-icon>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-bold text-ink" [title]="receipt.name">
                    {{ receipt.name }}
                  </span>
                  <span class="block text-xs text-ink-muted">
                    {{ receipt.imageVerified ? 'Verified' : 'View receipt' }}
                  </span>
                </span>
              </button>
              @if (!receipt.imageVerified || auth.isAdmin()) {
                @if (confirmingId() === receipt.id) {
                  <div class="col-span-2 mt-2 rounded-xl border border-outline/65 bg-surface/60 p-3">
                    <p class="text-xs leading-5 text-ink-muted">
                      Delete this receipt? This permanently removes the file. Your saved progress will not change.
                    </p>
                    <div class="mt-2 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        (click)="confirmingId.set(null)"
                        class="min-h-10 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-ink transition-colors hover:border-brand/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        Keep receipt
                      </button>
                      <button
                        type="button"
                        (click)="remove(receipt.id)"
                        class="min-h-10 rounded-xl border border-danger/40 px-3 text-xs font-bold text-danger transition-colors hover:border-danger/70 hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
                    class="inline-flex min-h-[3.25rem] w-11 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink-muted transition-colors hover:border-danger/45 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                  >
                    @if (store.deletingId() === receipt.id) {
                      <mas-spinner />
                    } @else {
                      <mat-icon class="mas-icon-md" aria-hidden="true">delete</mat-icon>
                    }
                  </button>
                }
              }
            </li>
          }
        </ul>
      }
      @if (!archive() && !store.loading() && !store.loadFailed()) {
        <div class="flex flex-col items-center gap-1 rounded-xl border border-dashed border-brand/45 p-3 text-center">
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
            class="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-sm font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
          >
            <span class="relative inline-flex items-center justify-center gap-2">
              <span class="inline-flex items-center gap-2" [class.invisible]="store.uploading()">
                <mat-icon class="mas-icon-sm" aria-hidden="true">upload</mat-icon>
                {{ store.receipts().length ? 'Add more receipts' : 'Upload receipts' }}
              </span>
              @if (store.uploading()) {
                <mas-spinner class="absolute" />
                <span class="sr-only">Uploading receipts</span>
              }
            </span>
          </button>
          <p class="text-xs leading-5 text-ink-muted">JPG, PNG, WebP or PDF · up to 5 MB each</p>
        </div>
      }
      @if (store.error()) {
        <p role="alert" class="text-xs text-danger">{{ store.error() }}</p>
      }
      @if (store.notice()) {
        <p role="status" class="text-xs text-brand-strong">{{ store.notice() }}</p>
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
