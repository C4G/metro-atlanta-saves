import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateInputComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { toDateInput } from '../monthly-progress/monthly-plan-editor.store';
import {
  AVATAR,
  CONTROL,
  CONTROL_PRIMARY,
  CONTROL_SM,
  CONTROL_SOLID,
  FIELD,
  ICON_TILE,
  LABEL,
  ROW,
} from '../ui/staff-ui';
import { WindowFrameComponent } from '../ui/window-frame.component';
import { AMOUNT_PATTERN, normalizeAmount, ParticipantPaymentsStore } from './participant-payments.store';

export type RecordPaymentData = { userId: string; name: string; initials: string };

export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export const proofProblem = (file: File) =>
  !PROOF_TYPES.includes(file.type)
    ? 'Choose a JPG, PNG, WebP, HEIC or PDF file.'
    : file.size > MAX_PROOF_BYTES
      ? 'Choose a file smaller than 5 MB.'
      : '';

export const fileSizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

@Component({
  selector: 'mas-record-payment-dialog',
  imports: [DateInputComponent, MatIcon, ReactiveFormsModule, SpinnerComponent, WindowFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mas-window-frame
        heading="Record payment"
        headingId="record-payment-heading"
        [subtitle]="data.name + ' · Participant in ' + programs.programName()"
        [busy]="payments.saving()"
      >
        <span windowLead [class]="avatarClass" aria-hidden="true">{{ data.initials }}</span>
        <div class="flex flex-col gap-3.5 p-4 sm:p-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="payment-amount" [class]="labelClass">Amount paid</label>
              <span class="relative block">
                <span
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted"
                  aria-hidden="true"
                >
                  $
                </span>
                <input
                  id="payment-amount"
                  formControlName="amount"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="0.00"
                  [class]="fieldClass + ' pl-7 tabular-nums'"
                  [attr.aria-invalid]="showErrors() && !!amountProblem()"
                  [attr.aria-describedby]="showErrors() && amountProblem() ? 'payment-amount-error' : null"
                />
              </span>
              @if (showErrors() && amountProblem()) {
                <p id="payment-amount-error" class="text-xs font-bold text-danger">{{ amountProblem() }}</p>
              }
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="payment-date" [class]="labelClass">Date paid</label>
              <mas-date-input inputId="payment-date" formControlName="paidAt" [max]="today" />
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="payment-check" [class]="labelClass">Check number</label>
              <input
                id="payment-check"
                formControlName="checkNumber"
                placeholder="Optional"
                autocomplete="off"
                [class]="fieldClass"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="payment-by" [class]="labelClass">Paid by</label>
              <input id="payment-by" formControlName="paidBy" autocomplete="organization" [class]="fieldClass" />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <span id="payment-proof-label" [class]="labelClass">Photo of the check</span>
            @if (proof(); as file) {
              <div [class]="rowClass + ' flex items-center gap-3 p-2'">
                @if (preview()) {
                  <img [src]="preview()" alt="" class="h-11 w-11 shrink-0 rounded-lg object-cover" />
                } @else {
                  <span [class]="iconTileClass" aria-hidden="true">
                    <mat-icon class="mas-icon-sm">picture_as_pdf</mat-icon>
                  </span>
                }
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-bold">{{ file.name }}</span>
                  <span class="block text-xs text-ink-muted">{{ sizeLabel(file.size) }} · Ready to upload</span>
                </span>
                <label [class]="controlSmClass + ' cursor-pointer focus-within:ring-2 focus-within:ring-brand'">
                  Replace
                  <input type="file" class="sr-only" [accept]="accept" (change)="pick($event)" />
                </label>
                <button
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/25 text-ink-muted transition-colors hover:border-danger hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Remove photo"
                  (click)="clearProof()"
                >
                  <mat-icon class="mas-icon-sm" aria-hidden="true">close</mat-icon>
                </button>
              </div>
            } @else {
              <div
                class="flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed p-4 text-center transition-colors"
                [class]="
                  dragging()
                    ? 'border-brand bg-brand-soft/40'
                    : showErrors() && !proof()
                      ? 'border-danger bg-danger/5'
                      : 'border-brand/55 bg-brand-soft/20'
                "
                role="group"
                aria-labelledby="payment-proof-label"
                (dragover)="$event.preventDefault(); dragging.set(true)"
                (dragleave)="dragging.set(false)"
                (drop)="drop($event)"
              >
                <span [class]="iconTileClass + ' !h-11 !w-11 !rounded-xl'" aria-hidden="true">
                  <mat-icon class="mas-icon-md">add_a_photo</mat-icon>
                </span>
                <span class="text-sm font-bold">
                  <span class="sm:hidden">Add a photo of the check</span>
                  <span class="hidden sm:inline">Drop a photo here</span>
                </span>
                <span class="text-xs text-ink-muted">JPG, PNG, HEIC or PDF, up to 5 MB</span>
                <span class="mt-1.5 flex flex-wrap justify-center gap-2">
                  <label
                    [class]="primarySmClass + ' cursor-pointer focus-within:ring-2 focus-within:ring-brand sm:hidden'"
                  >
                    <mat-icon class="mas-icon-sm" aria-hidden="true">photo_camera</mat-icon>
                    Take photo
                    <input type="file" class="sr-only" accept="image/*" capture="environment" (change)="pick($event)" />
                  </label>
                  <label [class]="controlSmClass + ' cursor-pointer focus-within:ring-2 focus-within:ring-brand'">
                    Choose file
                    <input type="file" class="sr-only" [accept]="accept" (change)="pick($event)" />
                  </label>
                </span>
              </div>
            }
            @if (proofError()) {
              <p class="text-xs font-bold text-danger" role="alert">{{ proofError() }}</p>
            } @else if (showErrors() && !proof()) {
              <p class="text-xs font-bold text-danger" role="alert">Add a photo of the check as proof of payment</p>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="payment-note" [class]="labelClass">Note</label>
            <input
              id="payment-note"
              formControlName="note"
              placeholder="Optional, for example what the payment is for"
              [class]="fieldClass"
            />
          </div>

          @if (payments.error()) {
            <p class="flex items-center gap-1.5 text-xs font-bold text-danger" role="alert">
              <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
              {{ payments.error() }}
            </p>
          }
        </div>

        <button
          windowFooter
          type="button"
          [class]="controlClass"
          [disabled]="payments.saving()"
          (click)="dialogRef.close()"
        >
          Cancel
        </button>
        <button windowFooter type="submit" [class]="solidClass" [disabled]="payments.saving()">
          @if (payments.saving()) {
            <mas-spinner />
          }
          Record payment
        </button>
      </mas-window-frame>
    </form>
  `,
})
export class RecordPaymentDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RecordPaymentDialogComponent>);
  readonly data = inject<RecordPaymentData>(MAT_DIALOG_DATA);
  readonly payments = inject(ParticipantPaymentsStore);
  readonly programs = inject(ProgramsStore);
  private readonly snackBar = inject(MatSnackBar);
  readonly labelClass = LABEL;
  readonly fieldClass = FIELD;
  readonly rowClass = ROW;
  readonly avatarClass = AVATAR;
  readonly iconTileClass = ICON_TILE;
  readonly controlClass = CONTROL;
  readonly controlSmClass = CONTROL_SM;
  readonly primarySmClass = CONTROL_PRIMARY.replace('min-h-10', 'min-h-8').replace('px-3', 'px-2.5');
  readonly solidClass = CONTROL_SOLID;
  readonly accept = PROOF_TYPES.join(',');
  readonly sizeLabel = fileSizeLabel;
  readonly today = toDateInput(new Date());

  readonly proof = signal<File | null>(null);
  readonly preview = signal('');
  readonly proofError = signal('');
  readonly dragging = signal(false);
  readonly showErrors = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    amount: '',
    paidAt: this.today,
    checkNumber: '',
    paidBy: this.programs.program()?.partner?.name ?? '',
    note: '',
  });
  private readonly amount = toSignal(this.form.controls.amount.valueChanges, { initialValue: '' });
  readonly amountProblem = computed(() =>
    AMOUNT_PATTERN.test(normalizeAmount(this.amount())) ? '' : 'Enter the amount paid, for example 250.00',
  );

  constructor() {
    this.payments.clearError();
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.useFile(file);
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.useFile(file);
  }

  clearProof(): void {
    this.revokePreview();
    this.proof.set(null);
  }

  save(): void {
    this.showErrors.set(true);
    const proof = this.proof();
    if (this.amountProblem() || !proof || !this.form.value.paidAt) return;
    const value = this.form.getRawValue();
    this.payments.record({
      userId: this.data.userId,
      amount: value.amount,
      paidAt: value.paidAt,
      checkNumber: value.checkNumber,
      paidBy: value.paidBy,
      note: value.note,
      proof,
      onSaved: () => {
        this.snackBar.open(`Payment to ${this.data.name} recorded`);
        this.dialogRef.close(true);
      },
    });
  }

  private useFile(file: File): void {
    const problem = proofProblem(file);
    this.proofError.set(problem);
    if (problem) return;
    this.revokePreview();
    this.proof.set(file);
    if (file.type.startsWith('image/') && file.type !== 'image/heic') this.preview.set(URL.createObjectURL(file));
  }

  private revokePreview(): void {
    if (this.preview()) URL.revokeObjectURL(this.preview());
    this.preview.set('');
  }
}
