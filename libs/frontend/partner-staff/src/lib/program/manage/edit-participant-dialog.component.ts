import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { DateInputComponent } from '@mas/frontend-shared-components';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { toDateInput } from '../monthly-progress/monthly-plan-editor.store';
import { RequirementsStore } from '../requirements/requirements.store';
import { AVATAR, CONTROL, CONTROL_SM, CONTROL_SOLID, FIELD, ICON_TILE, LABEL, ROW } from '../ui/staff-ui';
import { WindowFrameComponent } from '../ui/window-frame.component';
import { initialsOf } from './manage-program.store';
import { ParticipantPaymentsStore } from './participant-payments.store';

export type EditParticipantData = {
  record: UsersOnProgramsWithName;
  recordPayment: () => void;
};

export const FLAGS = [
  { key: 'married', label: 'Married' },
  { key: 'militaryStatus', label: 'Military status' },
  { key: 'creditScoreIncentive', label: 'Credit score incentive' },
  { key: 'graduated', label: 'Graduated' },
  { key: 'inactive', label: 'Inactive' },
] as const;

export type FlagKey = (typeof FLAGS)[number]['key'];

export const toDateValue = (value: string) => (value ? new Date(`${value}T00:00`) : undefined);

export const toNumber = (value: string) => {
  const parsed = Number(value.replace(/[$,\s]/g, ''));
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
};

@Component({
  selector: 'mas-edit-participant-dialog',
  imports: [CurrencyPipe, DateInputComponent, DatePipe, MatIcon, ReactiveFormsModule, WindowFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <mas-window-frame
        [heading]="'Edit ' + name"
        headingId="edit-participant-heading"
        [subtitle]="'Participant in ' + programs.programName()"
      >
        <span windowLead [class]="avatarClass" aria-hidden="true">{{ initials }}</span>
        <div class="flex flex-col divide-y divide-outline/45 px-4 sm:px-5">
          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-dates-heading">
            <h3 id="edit-dates-heading" class="text-sm font-bold">Program dates</h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="edit-start" [class]="labelClass">Start date</label>
                <mas-date-input inputId="edit-start" formControlName="start" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-end" [class]="labelClass">End date</label>
                <mas-date-input inputId="edit-end" formControlName="end" [min]="form.value.start ?? ''" />
              </div>
            </div>
          </section>

          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-requirements-heading">
            <h3 id="edit-requirements-heading" class="text-sm font-bold">Completed requirements</h3>
            @if (requirements.programRequirement().length) {
              <div class="flex flex-wrap gap-2" role="group" aria-labelledby="edit-requirements-heading">
                @for (requirement of requirements.programRequirement(); track requirement.id) {
                  @let picked = completed().includes(requirement.id);
                  <button
                    type="button"
                    class="inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [class]="picked ? chipOnClass : chipOffClass"
                    [attr.aria-pressed]="picked"
                    (click)="toggleRequirement(requirement.id)"
                  >
                    @if (picked) {
                      <mat-icon class="mas-icon-sm" aria-hidden="true">check</mat-icon>
                    }
                    {{ requirement.name }}
                  </button>
                }
              </div>
            } @else {
              <p class="text-sm text-ink-muted">This program has no requirements yet.</p>
            }
          </section>

          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-work-heading">
            <h3 id="edit-work-heading" class="text-sm font-bold">Work and income</h3>
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label for="edit-employer" [class]="labelClass">Place of employment</label>
                <input id="edit-employer" formControlName="placeOfEmployment" [class]="fieldClass" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-job" [class]="labelClass">Job title</label>
                <input id="edit-job" formControlName="jobTitle" [class]="fieldClass" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-education" [class]="labelClass">Education status</label>
                <input id="edit-education" formControlName="educationStatus" [class]="fieldClass" />
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="edit-income" [class]="labelClass">Annual income</label>
                <span class="relative block">
                  <span
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    id="edit-income"
                    formControlName="annualIncome"
                    inputmode="decimal"
                    [class]="fieldClass + ' pl-7 tabular-nums'"
                  />
                </span>
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-months" [class]="labelClass">Months employed</label>
                <input
                  id="edit-months"
                  formControlName="monthsEmployed"
                  inputmode="numeric"
                  [class]="fieldClass + ' tabular-nums'"
                />
              </div>
            </div>
          </section>

          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-personal-heading">
            <h3 id="edit-personal-heading" class="text-sm font-bold">Personal details</h3>
            <div class="flex flex-col gap-1.5">
              <label for="edit-address" [class]="labelClass">Address</label>
              <input id="edit-address" formControlName="address" [class]="fieldClass" autocomplete="off" />
            </div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label for="edit-birthdate" [class]="labelClass">Birth date</label>
                <mas-date-input inputId="edit-birthdate" formControlName="birthdate" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-phone" [class]="labelClass">Phone number</label>
                <input id="edit-phone" formControlName="phone" type="tel" [class]="fieldClass" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="edit-gender" [class]="labelClass">Gender</label>
                <input id="edit-gender" formControlName="gender" [class]="fieldClass" />
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label for="edit-race" [class]="labelClass">Race</label>
                <input id="edit-race" formControlName="race" [class]="fieldClass" />
              </div>
            </div>
          </section>

          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-status-heading">
            <h3 id="edit-status-heading" class="text-sm font-bold">Status</h3>
            <div class="grid gap-2 sm:grid-cols-2">
              @for (flag of flags; track flag.key) {
                @let on = flagValue(flag.key);
                <button
                  type="button"
                  role="switch"
                  [class]="
                    rowClass +
                    ' flex min-h-11 items-center justify-between gap-3 px-3 text-left text-sm font-bold transition-colors hover:border-brand/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand'
                  "
                  [attr.aria-checked]="on"
                  (click)="toggleFlag(flag.key)"
                >
                  {{ flag.label }}
                  <span
                    class="relative h-5 w-9 shrink-0 rounded-full border transition-colors"
                    [class]="on ? 'border-brand-strong bg-brand-strong' : 'border-brand/40 bg-surface-subtle'"
                    aria-hidden="true"
                  >
                    <span
                      class="absolute top-0.5 h-3.5 w-3.5 rounded-full transition-[left] motion-reduce:transition-none"
                      [class]="on ? 'left-[1.125rem] bg-brand-on' : 'left-0.5 bg-ink-subtle'"
                    ></span>
                  </span>
                </button>
              }
            </div>
          </section>

          <section class="flex flex-col gap-3 py-4" aria-labelledby="edit-payments-heading">
            <h3 id="edit-payments-heading" class="text-sm font-bold">Payments</h3>
            <div [class]="rowClass + ' flex flex-wrap items-center gap-3 p-2'">
              <span [class]="iconTileClass" aria-hidden="true">
                <mat-icon class="mas-icon-sm">payments</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                @if (payments(); as paid) {
                  <span class="block text-sm font-bold tabular-nums">{{ paid.total | currency }} paid</span>
                  <span class="block text-xs text-ink-muted">
                    {{ paid.count }} {{ paid.count === 1 ? 'payment' : 'payments' }}, last on
                    {{ paid.lastPaidAt | date: 'MMM d, y' }}
                  </span>
                } @else {
                  <span class="block text-sm font-bold">No payments yet</span>
                  <span class="block text-xs text-ink-muted">Payments and check photos are recorded separately</span>
                }
              </span>
              <button type="button" [class]="controlSmClass" (click)="recordPayment()">Record payment</button>
            </div>
          </section>
        </div>

        <button windowFooter type="button" [class]="controlClass" (click)="dialogRef.close()">Cancel</button>
        <button windowFooter type="submit" [class]="solidClass">Save changes</button>
      </mas-window-frame>
    </form>
  `,
})
export class EditParticipantDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EditParticipantDialogComponent>);
  private readonly data = inject<EditParticipantData>(MAT_DIALOG_DATA);
  private readonly participants = inject(UsersOnProgramsStore);
  private readonly paymentsStore = inject(ParticipantPaymentsStore);
  readonly programs = inject(ProgramsStore);
  readonly requirements = inject(RequirementsStore);
  readonly flags = FLAGS;
  readonly labelClass = LABEL;
  readonly fieldClass = FIELD;
  readonly rowClass = ROW;
  readonly avatarClass = AVATAR;
  readonly iconTileClass = ICON_TILE;
  readonly controlClass = CONTROL;
  readonly controlSmClass = CONTROL_SM;
  readonly solidClass = CONTROL_SOLID;
  readonly chipOnClass = 'border-brand/70 bg-surface-raised text-brand-strong';
  readonly chipOffClass = 'border-brand/25 bg-surface-raised/70 text-ink-muted hover:border-brand/70 hover:text-ink';

  private readonly record = this.data.record;
  readonly name = `${this.record.firstName} ${this.record.lastName}`.trim();
  readonly initials = initialsOf(this.record.firstName, this.record.lastName);
  readonly payments = computed(() => this.paymentsStore.byParticipant().get(this.record.userId) ?? null);

  readonly form = inject(FormBuilder).nonNullable.group({
    start: toDateInput(this.record.start),
    end: toDateInput(this.record.end),
    requirementStatus: [this.record.requirementStatus ?? []],
    placeOfEmployment: this.record.placeOfEmployment ?? '',
    jobTitle: this.record.jobTitle ?? '',
    educationStatus: this.record.educationStatus ?? '',
    annualIncome:
      this.record.annualIncome === null || this.record.annualIncome === undefined
        ? ''
        : String(this.record.annualIncome),
    monthsEmployed:
      this.record.monthsEmployed === null || this.record.monthsEmployed === undefined
        ? ''
        : String(this.record.monthsEmployed),
    address: this.record.address ?? '',
    birthdate: toDateInput(this.record.birthdate),
    phone: this.record.phone ?? '',
    gender: this.record.gender ?? '',
    race: this.record.race ?? '',
    married: this.record.married ?? false,
    militaryStatus: this.record.militaryStatus ?? false,
    creditScoreIncentive: this.record.creditScoreIncentive ?? false,
    graduated: this.record.graduated ?? false,
    inactive: this.record.inactive ?? false,
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly completed = computed(() => this.formValue().requirementStatus ?? []);

  constructor() {
    this.requirements.setProgramId(this.record.programId);
    this.requirements.getRequirements();
  }

  flagValue(key: FlagKey): boolean {
    return !!this.formValue()[key];
  }

  toggleFlag(key: FlagKey): void {
    this.form.controls[key].setValue(!this.form.controls[key].value);
  }

  toggleRequirement(id: string): void {
    const current = this.form.controls.requirementStatus.value;
    this.form.controls.requirementStatus.setValue(
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  recordPayment(): void {
    this.dialogRef.close();
    this.data.recordPayment();
  }

  save(): void {
    const value = this.form.getRawValue();
    this.participants.patchUser({
      userId: this.record.userId,
      programId: this.record.programId,
      requirementStatus: value.requirementStatus,
      placeOfEmployment: value.placeOfEmployment.trim(),
      jobTitle: value.jobTitle.trim(),
      educationStatus: value.educationStatus.trim(),
      annualIncome: toNumber(value.annualIncome),
      monthsEmployed: toNumber(value.monthsEmployed),
      address: value.address.trim(),
      phone: value.phone.trim(),
      gender: value.gender.trim(),
      race: value.race.trim(),
      married: value.married,
      militaryStatus: value.militaryStatus,
      creditScoreIncentive: value.creditScoreIncentive,
      graduated: value.graduated,
      inactive: value.inactive,
      start: toDateValue(value.start),
      end: toDateValue(value.end),
      birthdate: toDateValue(value.birthdate),
    });
  }
}
