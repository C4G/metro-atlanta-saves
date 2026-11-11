import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { formatDateInput, parseDateInput } from '@mas/frontend-shared-components';
import { EducationalContentStore, ProgramsStore } from '@mas/frontend-shared-data-access';
import { type Requirement } from '@mas/prisma-client/browser';
import { RequirementsStore } from '../../requirements.store';

function toLocalDateTimeInput(value: Date | string | null | undefined): { date: string; time: string } {
  if (!value) {
    return { date: '', time: '' };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  const localDateTime = date.toISOString().slice(0, 16);
  return { date: localDateTime.slice(0, 10), time: localDateTime.slice(11, 16) };
}

@Component({
  selector: 'mas-add-requirement',
  imports: [
    MatDialogModule,
    MatDatepickerModule,
    MatInput,
    MatFormField,
    MatHint,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header mat-dialog-title class="m-0 border-b border-outline px-5 py-6 sm:px-6">
      <h2 class="text-2xl font-semibold tracking-[-0.02em]">{{ data ? 'Edit requirement' : 'Add requirement' }}</h2>
      <p class="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
        Set a clear step, due date, and reminder for everyone in this program.
      </p>
    </header>
    <form #form="ngForm" [formGroup]="requirementForm" (ngSubmit)="submitForm()">
      <mat-dialog-content class="m-0 max-h-[65vh] px-5 py-6 sm:px-6">
        <div class="space-y-8">
          <section aria-labelledby="requirement-details-heading">
            <div>
              <h3 id="requirement-details-heading" class="text-base font-semibold">Requirement details</h3>
              <p class="mt-1 text-sm leading-6 text-ink-muted">Name the step and optionally link supporting content.</p>
            </div>
            <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" cdkFocusInitial />
                @if (
                  (requirementForm.get('name')?.touched || form.submitted) &&
                  requirementForm.get('name')?.errors?.['required']
                ) {
                  <mat-error>Name is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Educational content</mat-label>
                <mat-select formControlName="educationalContentId">
                  <mat-option [value]="null">No linked content</mat-option>
                  @for (contentObj of educationalContentStore.contentList(); track contentObj.id) {
                    <mat-option [value]="contentObj.id">{{ contentObj.title }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="mt-1 w-full">
              <mat-label>Action instructions</mat-label>
              <textarea matInput rows="4" formControlName="actionInstructions"></textarea>
              <mat-hint>Add instructions when participants can mark this task complete themselves.</mat-hint>
            </mat-form-field>
          </section>

          <section class="border-t border-outline pt-8" aria-labelledby="requirement-timing-heading">
            <div>
              <h3 id="requirement-timing-heading" class="text-base font-semibold">Timing and reminder</h3>
              <p class="mt-1 text-sm leading-6 text-ink-muted">
                Choose when this is due and whether to send a reminder.
              </p>
            </div>
            <mat-form-field appearance="outline" class="mt-5 w-full">
              <mat-label>Program month</mat-label>
              <mat-select formControlName="month">
                <mat-option [value]="null">Anytime</mat-option>
                @for (month of monthOptions(); track month) {
                  <mat-option [value]="month">Month {{ month }}</mat-option>
                }
              </mat-select>
              <mat-hint>Participants see this task on that month's card.</mat-hint>
            </mat-form-field>
            <div class="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <mat-form-field appearance="outline">
                <mat-label>Due date</mat-label>
                <input
                  matInput
                  [matDatepicker]="duePicker"
                  [value]="dueDateValue()"
                  (dateChange)="setDueDate($event.value)"
                  (click)="duePicker.open()"
                  autocomplete="off"
                />
                <mat-datepicker-toggle matIconSuffix [for]="duePicker" />
                <mat-datepicker #duePicker />
                <mat-hint>Shared by everyone enrolled in this program.</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Due time (optional)</mat-label>
                <input matInput type="time" formControlName="dueTime" />
                <mat-hint>Defaults to the end of the selected day.</mat-hint>
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="mt-1 w-full">
              <mat-label>Email reminder</mat-label>
              <mat-select formControlName="reminderDaysBefore" [disabled]="!requirementForm.controls.dueDate.value">
                <mat-option [value]="null">No reminder</mat-option>
                <mat-option [value]="1">1 day before</mat-option>
                <mat-option [value]="7">1 week before</mat-option>
              </mat-select>
              <mat-hint>Sent at 9:00 a.m. Eastern time on the selected date.</mat-hint>
            </mat-form-field>
          </section>
        </div>
      </mat-dialog-content>
      <footer class="flex flex-col-reverse gap-3 border-t border-outline px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          mat-dialog-close
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline px-5 text-sm font-semibold text-ink hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-semibold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {{ data ? 'Save changes' : 'Add requirement' }}
        </button>
      </footer>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class AddRequirementComponent {
  private fb = inject(FormBuilder);
  private requirementsStore = inject(RequirementsStore);
  educationalContentStore = inject(EducationalContentStore);
  private programsStore = inject(ProgramsStore);
  data = inject<Requirement | null>(MAT_DIALOG_DATA);
  readonly monthOptions = computed(() => {
    const months = (this.programsStore.program()?.checkpointNames ?? [])
      .map(({ name }) => Number(/^month\s+(\d+)$/i.exec(name.trim())?.[1] ?? 0))
      .filter((month) => month > 0);
    const current = this.data?.month;
    return [...new Set([...months, ...(current ? [current] : [])])].sort((a, b) => a - b);
  });

  requirementForm = this.fb.group({
    name: this.fb.control(this.data?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    educationalContentId: this.fb.control(this.data?.educationalContentId ?? null),
    actionInstructions: this.fb.control(this.data?.actionInstructions ?? '', { nonNullable: true }),
    dueDate: this.fb.control(toLocalDateTimeInput(this.data?.dueAt).date),
    dueTime: this.fb.control(toLocalDateTimeInput(this.data?.dueAt).time),
    reminderDaysBefore: this.fb.control<number | null>(this.data?.reminderDaysBefore ?? null),
    month: this.fb.control<number | null>(this.data?.month ?? null),
  });

  private readonly dueDateText = toSignal(this.requirementForm.controls.dueDate.valueChanges, {
    initialValue: this.requirementForm.controls.dueDate.value,
  });
  readonly dueDateValue = computed(() => parseDateInput(this.dueDateText()));

  constructor() {
    this.educationalContentStore.getContentList([]);
  }

  setDueDate(date: Date | null): void {
    this.requirementForm.controls.dueDate.setValue(formatDateInput(date));
  }

  submitForm() {
    if (this.requirementForm.invalid) {
      return;
    }

    const { actionInstructions, dueDate, dueTime, ...formValue } = this.requirementForm.getRawValue();
    const requirementValues = {
      ...formValue,
      actionInstructions: actionInstructions.trim() || null,
      dueAt: dueDate ? new Date(`${dueDate}T${dueTime || '23:59'}`).toISOString() : null,
      reminderDaysBefore: dueDate ? formValue.reminderDaysBefore : null,
    };

    if (this.data) {
      this.requirementsStore.patchRequirement({
        id: this.data.id,
        ...requirementValues,
      });

      return;
    }

    this.requirementsStore.addRequirement(requirementValues);
  }
}
