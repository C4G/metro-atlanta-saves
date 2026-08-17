import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { StoriesStore } from '@mas/frontend-shared-data-access';
import type { Story } from '@mas/prisma-client/browser';

@Component({
  selector: 'mas-add-story',
  imports: [MatDialogModule, MatInput, MatButton, MatFormField, MatLabel, ReactiveFormsModule, MatError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Story</h2>
    <form #form="ngForm" [formGroup]="storyForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if ((storyForm.get('name')?.touched || form.submitted) && storyForm.get('name')?.errors?.['required']) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Description</mat-label>
            <input matInput formControlName="description" />
            @if (
              (storyForm.get('description')?.touched || form.submitted) &&
              storyForm.get('description')?.errors?.['required']
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
export class AddStoryComponent {
  private fb = inject(NonNullableFormBuilder);
  private storiesStore = inject(StoriesStore);

  data = inject<Story | null>(MAT_DIALOG_DATA);

  fileChanged = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal(this.data?.imageUrl ?? '');
  selectedFileError = signal('');
  storyForm = this.fb.group({
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
      if (this.storyForm.invalid) {
        return;
      }
      if (!this.fileChanged()) {
        this.storiesStore.setEditStoryId(this.data.id);
        this.storiesStore.patchStory(this.storyForm.getRawValue());
      } else {
        const file = this.selectedFile();
        if (!file) {
          this.selectedFileError.set('Image is required');
          return;
        }
        if (this.storyForm.invalid) {
          return;
        }

        const { name, description } = this.storyForm.getRawValue();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('file', file);
        this.storiesStore.setEditStoryId(this.data.id);
        this.storiesStore.patchStory(formData);
      }
      return;
    }
    // In Add Mode
    const file = this.selectedFile();
    if (!file) {
      this.selectedFileError.set('Image is required');
      return;
    }
    if (this.storyForm.invalid) {
      return;
    }

    const { name, description } = this.storyForm.getRawValue();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);
    this.storiesStore.addStory(formData);
  }
}
