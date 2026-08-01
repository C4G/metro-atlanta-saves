import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { EducationalCategoryStore } from '@mas/frontend-shared-data-access';
import { EducationalCategory } from '@prisma/client';

@Component({
  selector: 'mas-educational-resources-content-create',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Educational Category</h2>
    <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="contentForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 gap-4">
          <mat-form-field>
            <mat-label>Title</mat-label>
            <input matInput formControlName="category" />
            @if (
              (contentForm.get('category')?.touched || form.submitted) &&
              contentForm.get('category')?.errors?.['required']
            ) {
              <mat-error>Please enter a title.</mat-error>
            }
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
export class EducationalCategoryFormComponent {
  educationalCategory = inject(EducationalCategoryStore);

  private fb = inject(FormBuilder);
  data = inject<EducationalCategory | null>(MAT_DIALOG_DATA);

  contentForm = this.fb.nonNullable.group({
    category: [this.data?.category ?? '', Validators.required],
  });

  onSubmit() {
    if (this.contentForm.invalid) {
      return;
    }

    if (this.data) {
      this.educationalCategory.patchContent({
        id: this.data.id,
        category: this.contentForm.getRawValue().category,
      });

      return;
    }

    const contentFormData = this.contentForm.getRawValue();

    this.educationalCategory.addCategories(contentFormData);
  }
}
