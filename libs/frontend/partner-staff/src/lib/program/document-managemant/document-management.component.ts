import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import {
  ConfirmDialogComponent,
  DocumentDropzoneComponent,
  ReceiptPreviewComponent,
  SpinnerComponent,
} from '@mas/frontend-shared-components';
import {
  CheckpointsStore,
  DocumentManagementStore,
  ImagesStore,
  ProgramsStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-document-management',
  imports: [SpinnerComponent, DatePipe, DocumentDropzoneComponent, FormsModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Program documents" class="min-w-0 space-y-5">
      <div class="flex items-center gap-3">
        <label class="relative block min-w-0 flex-1 sm:max-w-lg">
          <span class="sr-only">Search participants, months, or filenames</span>
          <mat-icon
            aria-hidden="true"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
          >
            search
          </mat-icon>
          <input
            type="search"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search participants, months, or filenames"
            class="min-h-11 w-full rounded-xl border border-outline bg-surface py-2 pl-11 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        @if (imagesStore.loading()) {
          <p class="text-sm text-ink-muted flex items-center gap-2" role="status">
            <mas-spinner class="text-brand" />
            <span class="sr-only">Loading documents</span>
          </p>
        }
        <button
          type="button"
          (click)="uploadOpen.set(!uploadOpen())"
          [attr.aria-expanded]="uploadOpen()"
          aria-controls="program-document-upload"
          class="ml-auto inline-flex shrink-0 min-h-11 items-center gap-2 rounded-xl bg-brand-strong px-4 text-sm font-semibold text-brand-on hover:bg-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <mat-icon aria-hidden="true">upload</mat-icon>
          Upload documents
        </button>
      </div>
      @if (uploadOpen()) {
        <div
          id="program-document-upload"
          class="mt-4 w-full rounded-2xl border border-dashed border-outline bg-surface-raised p-3 sm:p-4"
        >
          <mas-document-dropzone [programId]="id()" />
        </div>
      }
      @if (imagesStore.loadFailed()) {
        <div role="alert" class="text-sm text-danger">
          Documents could not be loaded.
          <button
            type="button"
            (click)="
              imagesStore.getAllImages({
                programId: id(),
                userFilter: documentManagementStore.selectedUserFilter(),
                checkpointFilter: documentManagementStore.selectedCheckpointFilter(),
              })
            "
            class="min-h-11 rounded-lg px-3 font-bold underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      }
      <div class="space-y-3">
        @for (month of receiptMonths(); track month.name) {
          <details class="group overflow-hidden rounded-2xl border border-outline bg-surface-raised">
            <summary
              class="flex min-h-20 cursor-pointer list-none items-center gap-4 px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden"
            >
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"
              >
                <mat-icon aria-hidden="true">receipt_long</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">{{ month.name }}</span>
                <span class="mt-1 block text-xs text-ink-muted">
                  {{ month.receipts.length }} {{ month.receipts.length === 1 ? 'receipt' : 'receipts' }} attached
                </span>
              </span>
              <mat-icon aria-hidden="true" class="shrink-0 text-ink-muted group-open:rotate-180">expand_more</mat-icon>
            </summary>
            <div class="overflow-x-auto border-t border-outline">
              @if (imagesStore.loading() || usersOnProgramsStore.usersLoading()) {
                <p class="p-5 text-sm text-ink-muted flex items-center gap-2" role="status">
                  <mas-spinner class="text-brand" />
                  <span class="sr-only">Loading receipts and participants</span>
                </p>
              } @else if (imagesStore.loadFailed() || usersOnProgramsStore.usersLoadFailed()) {
                <p class="p-5 text-sm text-danger" role="alert">
                  The full receipt list could not be loaded. Refresh to try again.
                </p>
              } @else {
                <table class="w-full min-w-[38rem] text-left text-sm">
                  <caption class="sr-only">{{ month.name }} participant receipts and review status</caption>
                  <thead class="bg-surface-subtle text-xs text-ink-muted">
                    <tr>
                      <th scope="col" class="px-5 py-3 font-semibold">User</th>
                      <th scope="col" class="px-5 py-3 font-semibold">Receipt status</th>
                      <th scope="col" class="px-5 py-3 font-semibold">Date attached</th>
                      <th scope="col" class="px-5 py-3 text-center font-semibold">Reviewed</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline">
                    @for (row of month.participants; track row.userId) {
                      <tr class="hover:bg-brand-soft/10">
                        <th scope="row" class="px-5 py-4 font-normal">
                          <span class="block font-semibold">{{ row.name }}</span>
                        </th>
                        <td class="px-5 py-4">
                          <div class="space-y-2">
                            @for (receipt of row.receipts; track receipt.id) {
                              <button
                                type="button"
                                (click)="viewReceipt(receipt.id, receipt.name)"
                                [attr.aria-label]="'View ' + receipt.name + ' from ' + row.name"
                                class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-outline px-3 py-2 text-xs font-medium text-ink-muted hover:bg-brand-soft/20 hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                              >
                                <mat-icon aria-hidden="true">description</mat-icon>
                                View receipt
                              </button>
                            } @empty {
                              <span
                                class="inline-flex items-center gap-2 rounded-lg border border-dashed border-outline px-3 py-2 text-xs text-ink-muted"
                              >
                                No receipt attached
                              </span>
                            }
                          </div>
                        </td>
                        <td class="px-5 py-4 text-xs text-ink-muted">
                          @for (receipt of row.receipts; track receipt.id) {
                            <p class="flex min-h-11 items-center">{{ receipt.createdAt | date: 'MMM d, y' }}</p>
                          } @empty {
                            <span aria-label="Not attached">—</span>
                          }
                        </td>
                        <td class="px-5 py-4 text-center">
                          <label class="inline-flex min-h-11 min-w-11 items-center justify-center">
                            <span class="sr-only">Reviewed receipts for {{ row.name }} in {{ month.name }}</span>
                            <input
                              type="checkbox"
                              [checked]="row.reviewed"
                              [disabled]="!row.checkpointIds.length || row.saving"
                              (change)="documentManagementStore.setReceiptReview(row.checkpointIds, !row.reviewed)"
                              class="peer sr-only"
                            />
                            @if (row.saving) {
                              <span
                                role="status"
                                class="inline-flex h-6 w-6 items-center justify-center text-brand-strong"
                              >
                                <span
                                  aria-hidden="true"
                                  class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                ></span>
                                <span class="sr-only">Updating receipt review</span>
                              </span>
                            } @else {
                              <mat-icon
                                aria-hidden="true"
                                class="rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand peer-disabled:opacity-40"
                                [class.text-brand-strong]="row.reviewed"
                                [class.text-ink-muted]="!row.reviewed"
                              >
                                {{ row.reviewed ? 'task_alt' : 'radio_button_unchecked' }}
                              </mat-icon>
                            }
                          </label>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="px-5 py-6 text-ink-muted">No participants match these filters.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </details>
        } @empty {
          @if (searchQuery().trim() && !imagesStore.loading() && !usersOnProgramsStore.usersLoading()) {
            <p class="rounded-2xl border border-dashed border-outline p-6 text-sm text-ink-muted" role="status">
              No participants or receipts match your search.
            </p>
          }
        }
      </div>
      @if (reviewing()) {
        @if (documentManagementStore.currentImage(); as image) {
          <button
            type="button"
            (click)="reviewing.set(false)"
            class="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft/20 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Close document review
          </button>
          <div class="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <article class="min-w-0 overflow-hidden rounded-2xl border border-outline bg-surface-raised">
              <header class="flex flex-wrap items-center justify-between gap-3 border-b border-outline p-5">
                <div class="min-w-0">
                  <h3 class="break-all font-bold">{{ image.name }}</h3>
                  <p class="mt-1 text-xs text-ink-muted">
                    {{ documentManagementStore.currentImageIndex() + 1 }} of
                    {{ documentManagementStore.filteredImages().length }} documents
                  </p>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="viewReceipt(image.id, image.name)"
                    class="min-h-11 rounded-xl border border-outline px-3 text-sm font-semibold text-brand-strong hover:bg-brand-soft/20 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    View receipt
                  </button>
                  <button
                    type="button"
                    aria-label="Previous document"
                    (click)="documentManagementStore.navigatePrevious()"
                    [disabled]="documentManagementStore.currentImageIndex() === 0"
                    class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-outline text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
                  >
                    <mat-icon aria-hidden="true">chevron_left</mat-icon>
                  </button>
                  <button
                    type="button"
                    aria-label="Next document"
                    (click)="documentManagementStore.navigateNext()"
                    [disabled]="
                      documentManagementStore.currentImageIndex() >= documentManagementStore.filteredImages().length - 1
                    "
                    class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-outline text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
                  >
                    <mat-icon aria-hidden="true">chevron_right</mat-icon>
                  </button>
                </div>
              </header>
              <div class="flex min-h-64 items-center justify-center bg-surface-subtle p-4">
                @if (documentManagementStore.imageUrls()[image.id]; as url) {
                  @if (image.type.includes('pdf')) {
                    <iframe
                      [src]="url"
                      [title]="image.name"
                      class="h-[32rem] w-full rounded-xl border border-outline"
                    ></iframe>
                  } @else {
                    <img [src]="url" [alt]="image.name" class="max-h-[32rem] max-w-full rounded-xl object-contain" />
                  }
                } @else {
                  <p role="status" class="text-sm text-ink-muted">Preparing preview…</p>
                }
              </div>
            </article>
            <aside
              class="min-w-0 rounded-2xl border border-outline bg-surface-raised p-5"
              aria-label="Document details"
            >
              <h3 class="font-bold">Document details</h3>
              <dl class="mt-4 space-y-3 text-sm">
                <div>
                  <dt class="text-xs text-ink-subtle">Participant</dt>
                  <dd class="mt-1 break-words">{{ documentManagementStore.currentImageUser() }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-subtle">Checkpoint</dt>
                  <dd class="mt-1">{{ image.checkpoint?.name || 'Unassigned' }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-subtle">Uploaded</dt>
                  <dd class="mt-1">{{ image.createdAt | date: 'medium' }}</dd>
                </div>
              </dl>
              <div class="mt-5 space-y-4 border-t border-outline pt-5">
                <h4 class="text-sm font-bold">Update assignment</h4>
                <label class="block text-sm font-semibold">
                  Participant
                  <select
                    [ngModel]="documentManagementStore.pendingUpdates().userId"
                    (ngModelChange)="documentManagementStore.setSelectedUser($event)"
                    class="mt-2 min-h-11 w-full rounded-xl border border-outline bg-surface px-3 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option [ngValue]="null" disabled>Choose participant</option>
                    @for (user of usersOnProgramsStore.users(); track user.userId) {
                      <option [value]="user.userId">{{ user.firstName }} {{ user.lastName }}</option>
                    }
                  </select>
                </label>
                @if (documentManagementStore.pendingUpdates().userId) {
                  <label class="block text-sm font-semibold">
                    Checkpoint
                    <select
                      [ngModel]="documentManagementStore.pendingUpdates().checkpointId"
                      (ngModelChange)="documentManagementStore.setSelectedCheckpoint($event)"
                      class="mt-2 min-h-11 w-full rounded-xl border border-outline bg-surface px-3 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option [ngValue]="null" disabled>Choose checkpoint</option>
                      @for (checkpoint of documentManagementStore.userCheckpoints(); track checkpoint.id) {
                        <option [value]="checkpoint.id">{{ checkpoint.name }}</option>
                      }
                    </select>
                  </label>
                }
                <button
                  type="button"
                  (click)="documentManagementStore.saveChanges()"
                  [disabled]="!documentManagementStore.hasPendingChanges()"
                  class="min-h-11 w-full rounded-xl bg-brand-strong px-4 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40"
                >
                  Save assignment
                </button>
                <button
                  type="button"
                  (click)="deleteDocument(image.id, image.name)"
                  class="min-h-11 w-full rounded-xl border border-outline px-4 text-sm font-semibold text-danger hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  Delete document
                </button>
              </div>
            </aside>
          </div>
          <div class="border-t border-outline pt-5">
            <h3 class="mb-4 font-bold">Document library</h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              @for (document of documentManagementStore.filteredImages(); track document.id) {
                <button
                  type="button"
                  (click)="documentManagementStore.selectImage($index)"
                  [attr.aria-pressed]="image.id === document.id"
                  [class.border-brand]="image.id === document.id"
                  class="min-w-0 rounded-xl border border-outline bg-surface p-3 text-left hover:bg-brand-soft/35 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <mat-icon class="text-brand-strong" aria-hidden="true">
                    {{ document.type.includes('pdf') ? 'picture_as_pdf' : 'image' }}
                  </mat-icon>
                  <span class="mt-2 block truncate text-xs font-bold">{{ document.name }}</span>
                  <span class="mt-1 block truncate text-xs text-ink-muted">
                    {{ document.checkpoint?.name || 'Unassigned' }}
                  </span>
                </button>
              }
            </div>
          </div>
        } @else {
          @if (!imagesStore.loading() && !imagesStore.loadFailed()) {
            <p
              class="rounded-2xl border border-dashed border-outline bg-surface-raised p-8 text-center text-sm text-ink-muted"
            >
              No documents match these filters. Upload a file or adjust the filters.
            </p>
          }
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class DocumentManagementComponent implements OnDestroy {
  readonly id = input.required<string>();
  readonly documentManagementStore = inject(DocumentManagementStore);
  readonly imagesStore = inject(ImagesStore);
  readonly checkpointsStore = inject(CheckpointsStore);
  readonly usersOnProgramsStore = inject(UsersOnProgramsStore);
  private readonly programsStore = inject(ProgramsStore);
  readonly reviewing = signal(false);
  readonly uploadOpen = signal(false);
  readonly searchQuery = signal('');
  readonly receiptMonths = computed(() => {
    const images = this.documentManagementStore.filteredImages();
    const names = new Set(this.programsStore.program()?.checkpointNames?.map((month) => month.name) ?? []);
    for (const image of images) names.add(image.checkpoint?.name || 'Unassigned');
    return [...names]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((name) => ({
        name,
        receipts: images.filter((image) => (image.checkpoint?.name || 'Unassigned') === name),
        participants: this.usersOnProgramsStore
          .users()
          .filter((user) => {
            const selected = this.documentManagementStore.selectedUserFilter();
            return !selected || selected === user.userId;
          })
          .map((user) => {
            const receipts = images.filter(
              (image) => image.userId === user.userId && (image.checkpoint?.name || 'Unassigned') === name,
            );
            const checkpointIds = [
              ...new Set(receipts.flatMap((image) => (image.checkpointId ? [image.checkpointId] : []))),
            ];
            return {
              userId: user.userId,
              name: user.firstName + ' ' + user.lastName,
              email: user.email,
              receipts,
              checkpointIds,
              reviewed: receipts.length > 0 && receipts.every((image) => image.imageVerified),
              saving: checkpointIds.some((id) => this.documentManagementStore.reviewingCheckpointIds().includes(id)),
            };
          }),
        withoutReceipts: this.usersOnProgramsStore.users().filter((user) => {
          const selected = this.documentManagementStore.selectedUserFilter();
          return (
            (!selected || selected === user.userId) &&
            !images.some((image) => image.userId === user.userId && (image.checkpoint?.name || 'Unassigned') === name)
          );
        }),
      }))
      .map((month) => {
        const query = this.searchQuery().trim().toLowerCase();
        return {
          ...month,
          participants: month.participants.filter(
            (user) =>
              !query ||
              month.name.toLowerCase().includes(query) ||
              `${user.name} ${user.email}`.toLowerCase().includes(query) ||
              user.receipts.some((receipt) => receipt.name.toLowerCase().includes(query)),
          ),
        };
      })
      .filter(
        (month) =>
          !this.searchQuery().trim() ||
          month.participants.length ||
          month.name.toLowerCase().includes(this.searchQuery().trim().toLowerCase()),
      );
  });
  reviewDocument(id: string): void {
    const index = this.documentManagementStore.filteredImages().findIndex((image) => image.id === id);
    this.documentManagementStore.selectImage(index);
    this.reviewing.set(true);
  }
  private readonly dialog = inject(MatDialog);
  readonly programEffect = effect(() => {
    const programId = this.id();
    untracked(() => {
      this.documentManagementStore.updateProgramId(programId);
      this.documentManagementStore.clearFilters();
      this.usersOnProgramsStore.setProgramId(programId);
      this.usersOnProgramsStore.getUsers();
      this.checkpointsStore.setProgramId(programId);
    });
  });
  deleteDocument(id: string, name: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete document',
        content: `Delete ${name}? This cannot be undone.`,
        color: 'warn',
        onYesClick: () => this.documentManagementStore.deleteImage(id),
      },
    });
  }
  viewReceipt(id: string, name: string): void {
    this.dialog.open(ReceiptPreviewComponent, {
      data: { id, name },
      width: '60rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaLabelledBy: 'receipt-preview-heading',
    });
  }

  ngOnDestroy(): void {
    this.documentManagementStore.cleanup();
  }
}
