import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EducationalContentStore } from '@mas/frontend-shared-data-access';
import { type Requirement } from '@prisma/client';
import { RequirementsStore } from '../../requirements.store';

@Component({
  selector: 'mas-add-requirement',
  imports: [
    MatDialogModule,
    MatInput,
    MatButton,
    MatFormField,
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
  });

  constructor() {
    this.educationalContentStore.getContentList([]);
  }

  submitForm() {
    if (this.requirementForm.invalid) {
      return;
    }

    if (this.data) {
      this.requirementsStore.patchRequirement({
        id: this.data.id,
        ...this.requirementForm.getRawValue(),
      });

      return;
    }

    const addRequirementData = this.requirementForm.getRawValue();

    this.requirementsStore.addRequirement(addRequirementData);
  }
}
