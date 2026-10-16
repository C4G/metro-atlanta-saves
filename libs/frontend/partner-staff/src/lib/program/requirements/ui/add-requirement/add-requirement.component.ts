import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EducationalContentStore } from '@mas/frontend-shared-data-access';
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
    MatInput,
    MatButton,
    MatFormField,
    MatHint,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Requirement</h2>
    <form #form="ngForm" [formGroup]="requirementForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (requirementForm.get('name')?.touched || form.submitted) &&
              requirementForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Educational Content</mat-label>
            <mat-select formControlName="educationalContentId">
              <mat-option [value]="null" />
              @for (contentObj of educationalContentStore.contentList(); track contentObj.id) {
                <mat-option [value]="contentObj.id">{{ contentObj.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Action Instructions</mat-label>
            <textarea matInput rows="3" formControlName="actionInstructions"></textarea>
            <mat-hint>Adding instructions lets learners mark this requirement complete from My Progress.</mat-hint>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Due Date</mat-label>
            <input matInput type="date" formControlName="dueDate" />
            <mat-hint>Shared by everyone enrolled in this program.</mat-hint>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Due Time (optional)</mat-label>
            <input matInput type="time" formControlName="dueTime" />
            <mat-hint>Defaults to the end of the selected day.</mat-hint>
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Email Reminder</mat-label>
            <mat-select formControlName="reminderDaysBefore" [disabled]="!requirementForm.controls.dueDate.value">
              <mat-option [value]="null">No reminder</mat-option>
              <mat-option [value]="1">1 day before</mat-option>
              <mat-option [value]="7">1 week before</mat-option>
            </mat-select>
            <mat-hint>Sent at 9:00 a.m. Eastern time on the selected date.</mat-hint>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">{{ data ? 'Save' : 'Add' }}</button>
      </mat-dialog-actions>
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
  data = inject<Requirement | null>(MAT_DIALOG_DATA);

  requirementForm = this.fb.group({
    name: this.fb.control(this.data?.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    educationalContentId: this.fb.control(this.data?.educationalContentId ?? null),
    actionInstructions: this.fb.control(this.data?.actionInstructions ?? '', { nonNullable: true }),
    dueDate: this.fb.control(toLocalDateTimeInput(this.data?.dueAt).date),
    dueTime: this.fb.control(toLocalDateTimeInput(this.data?.dueAt).time),
    reminderDaysBefore: this.fb.control<number | null>(this.data?.reminderDaysBefore ?? null),
  });

  constructor() {
    this.educationalContentStore.getContentList([]);
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
