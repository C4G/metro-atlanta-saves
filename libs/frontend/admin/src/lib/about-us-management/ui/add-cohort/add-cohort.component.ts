import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CohortsStore } from '@mas/frontend-shared-data-access';
import type { Cohort } from '@prisma/client';

@Component({
  selector: 'mas-add-cohort',
  imports: [MatDialogModule, MatInput, MatButton, MatFormField, MatLabel, ReactiveFormsModule, MatError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Cohort</h2>
    <form #form="ngForm" [formGroup]="cohortForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if ((cohortForm.get('name')?.touched || form.submitted) && cohortForm.get('name')?.errors?.['required']) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Description</mat-label>
            <input matInput formControlName="description" />
            @if (
              (cohortForm.get('description')?.touched || form.submitted) &&
              cohortForm.get('description')?.errors?.['required']
            ) {
              <mat-error>Description is required.</mat-error>
            }
          </mat-form-field>
          <div class="sm:col-span-2 h-16">
            <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose File</button>
            <input hidden (change)="onFileSelected($event)" #fileInput type="file" />
            @if (selectedFileName()) {
              <span class="ml-4">{{ selectedFileName() }}</span>
            }
            @if (selectedFileError()) {
              <mat-error>{{ selectedFileError() }}</mat-error>
            }
          </div>
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
export class AddCohortComponent {
  private fb = inject(NonNullableFormBuilder);
  private cohortsStore = inject(CohortsStore);

  data = inject<Cohort | null>(MAT_DIALOG_DATA);

  fileChanged = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal(this.data?.imageUrl ?? '');
  selectedFileError = signal('');
  cohortForm = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? '', [Validators.required]],
  });

  onFileSelected(event: any): void {
    this.fileChanged.set(true);
    if (!event.target.files[0]) {
      this.selectedFileError.set('Image is required');
      return;
    }
    if (!/(jpg|jpeg|png|webp)$/.test(event.target.files[0].type)) {
      this.selectedFileError.set('Only supported types: jpg, jpeg, png, webp');
      return;
    }
    this.selectedFileError.set('');
    this.selectedFile.set(event.target.files[0] ?? null);
    this.selectedFileName.set(event.target.files[0].name);
  }

  submitForm() {
    // In Edit Mode
    if (this.data) {
      if (this.cohortForm.invalid) {
        return;
      }
      if (!this.fileChanged()) {
        this.cohortsStore.setEditCohortId(this.data.id);
        this.cohortsStore.patchCohort(this.cohortForm.getRawValue());
      } else {
        const file = this.selectedFile();
        if (!file) {
          this.selectedFileError.set('Image is required');
          return;
        }
        if (this.cohortForm.invalid) {
          return;
        }

        const { name, description } = this.cohortForm.getRawValue();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('file', file);
        this.cohortsStore.setEditCohortId(this.data.id);
        this.cohortsStore.patchCohort(formData);
      }
      return;
    }
    // In Add Mode
    const file = this.selectedFile();
    if (!file) {
      this.selectedFileError.set('Image is required');
      return;
    }
    if (this.cohortForm.invalid) {
      return;
    }

    const { name, description } = this.cohortForm.getRawValue();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);
    this.cohortsStore.addCohort(formData);
  }
}
