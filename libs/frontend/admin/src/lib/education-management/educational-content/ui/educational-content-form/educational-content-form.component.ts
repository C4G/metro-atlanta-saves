import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { EducationalCategoryStore, EducationalContentStore } from '@mas/frontend-shared-data-access';
import { URL_REGEX } from '@mas/frontend-shared-util';

@Component({
  selector: 'mas-educational-resources-content-create',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Educational Content</h2>
    <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="contentForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
            @if (
              (contentForm.get('title')?.touched || form.submitted) && contentForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Please enter a title.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description"></textarea>
            @if (
              (contentForm.get('description')?.touched || form.submitted) &&
              contentForm.get('description')?.errors?.['required']
            ) {
              <mat-error>Please enter a description.</mat-error>
            }
          </mat-form-field>
          <div class="sm:col-span-2 h-16">
            <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose Image</button>
            <input hidden (change)="onFileSelected($event, true)" #fileInput type="file" />
            @if (selectedImageName()) {
              <span class="ml-4">{{ selectedImageName() }}</span>
            }
            @if (selectedImageError()) {
              <mat-error>{{ selectedImageError() }}</mat-error>
            }
          </div>
          <div class="flex flex-col gap-2 w-full">
            <mat-button-toggle-group
              name="linkToggle"
              [value]="useFileUploadValue"
              (change)="useFileUploadValue = $event.value"
              class="flex justify-center w-full"
            >
              <mat-button-toggle [value]="false" class="flex-1 text-center h-12">Enter Link</mat-button-toggle>
              <mat-button-toggle [value]="true" class="flex-1 text-center h-12">Upload File</mat-button-toggle>
            </mat-button-toggle-group>

            <div class="grid grid-cols-1">
              <p class="text-sm text-center mb-2">A link or an uploaded file is required.</p>
              @if (!useFileUploadValue) {
                <mat-form-field class="w-full">
                  <mat-label>Link</mat-label>
                  <input matInput formControlName="link" [required]="!useFileUploadValue" />
                  @if (
                    (contentForm.get('link')?.touched || form.submitted) && !contentForm.get('link')?.value?.trim()
                  ) {
                    <mat-error>Please enter a link.</mat-error>
                  } @else if (contentForm.get('link')?.touched && contentForm.get('link')?.errors?.['pattern']) {
                    <mat-error>Please enter a valid URL.</mat-error>
                  }
                </mat-form-field>
              }
              @if (useFileUploadValue) {
                <div class="flex flex-col items-center w-full min-h-[72px]">
                  <button
                    type="button"
                    mat-raised-button
                    color="accent"
                    (click)="fileUploadInput.click()"
                    class="w-4/5 h-12 flex items-center justify-center"
                  >
                    Choose File
                  </button>
                  <input hidden (change)="onFileSelected($event, false)" #fileUploadInput type="file" />
                  <span class="mt-2 min-h-[20px] flex items-center">
                    {{ selectedFileName() }}
                  </span>
                </div>
              }
              @if (requireLinkOrFileError()) {
                <div class="flex justify-center w-full">
                  <mat-error>{{ requireLinkOrFileError() }}</mat-error>
                </div>
              }
            </div>
          </div>
          <mat-form-field>
            <mat-label>Categories</mat-label>
            <mat-select formControlName="categories" multiple>
              @for (categoryObj of educationalCategory.categoryList(); track categoryObj.id) {
                <mat-option [value]="categoryObj.id">{{ categoryObj.category }}</mat-option>
              }
            </mat-select>
            @if (
              (contentForm.get('categories')?.touched || form.submitted) &&
              contentForm.get('categories')?.errors?.['required']
            ) {
              <mat-error>Please select a category.</mat-error>
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
export class EducationalContentFormComponent {
  educationalContentStore = inject(EducationalContentStore);
  educationalCategory = inject(EducationalCategoryStore);

  private fb = inject(FormBuilder);
  data = inject<any | null>(MAT_DIALOG_DATA);

  fileChanged = signal(false);

  selectedImage = signal<File | null>(null);
  selectedImageName = signal(this.data?.image ?? '');
  selectedImageError = signal('');

  selectedFile = signal<File | null>(null);
  selectedFileName = signal(this.data?.file ?? '');
  requireLinkOrFileError = signal('');

  useFileUpload = signal(false);

  contentForm = this.fb.nonNullable.group({
    title: [this.data?.title ?? '', Validators.required],
    description: [this.data?.description ?? '', Validators.required],
    link: [this.data?.link ?? '', [Validators.pattern(URL_REGEX)]],
    categories: [
      this.data?.EducationalCategoryContentMapping.map(({ categoryId }: any) => categoryId) ?? [],
      Validators.required,
    ],
  });

  get useFileUploadValue() {
    return this.useFileUpload();
  }

  set useFileUploadValue(value: boolean) {
    this.useFileUpload.set(value);
  }

  onFileSelected(event: any, isImage = false): void {
    this.fileChanged.set(true);
    const file = event.target.files[0];

    if (!file) return;

    if (isImage) {
      if (!/(jpg|jpeg|png|webp)$/.test(file.type)) {
        this.selectedImageError.set('Only supported types: jpg, jpeg, png, webp');
        return;
      }
      this.selectedImageError.set('');
      this.selectedImage.set(file);
      this.selectedImageName.set(file.name);
    } else {
      this.requireLinkOrFileError.set('');
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
    }
  }

  onSubmit() {
    if (this.hasResource()) {
      this.requireLinkOrFileError.set('');
    }

    // In Edit Mode

    if (this.data) {
      const image = this.selectedImage();
      const file = this.selectedFile();

      if (this.contentForm.invalid || !this.hasResource()) {
        if (!this.hasResource()) {
          this.requireLinkOrFileError.set('A file or link to a resource is required.');
        }
        return;
      }
      const contentFormData = new FormData();
      if (this.contentForm.value.title) {
        contentFormData.append('title', this.contentForm.value.title);
      }
      if (this.contentForm.value.description) {
        contentFormData.append('description', this.contentForm.value.description);
      }
      if (this.contentForm.value.link) {
        contentFormData.append('link', this.contentForm.value.link);
      }
      if (this.contentForm.value.categories) {
        contentFormData.append('categories', JSON.stringify(this.contentForm.value.categories));
      }
      if (file) {
        contentFormData.append('fileBlob', file);
        contentFormData.append('file', file.name);
      }
      if (image) {
        contentFormData.append('imageBlob', image);
        contentFormData.append('image', image.name);
      }

      return this.educationalContentStore.patchContent([this.data.id, contentFormData]);
    } else {
      // In Add Mode
      const image = this.selectedImage();
      const file = this.selectedFile();
      if (this.contentForm.invalid || !this.hasResource()) {
        if (!this.hasResource()) {
          this.requireLinkOrFileError.set('A file or link to a resource is required.');
        }
        return;
      }

      const contentFormData = new FormData();
      if (image) {
        contentFormData.append('imageBlob', image);
        contentFormData.append('image', image.name);
      }

      if (file) {
        contentFormData.append('fileBlob', file);
        contentFormData.append('file', file.name);
      }

      if (this.contentForm.value.title) {
        contentFormData.append('title', this.contentForm.value.title);
      }
      if (this.contentForm.value.description) {
        contentFormData.append('description', this.contentForm.value.description);
      }
      if (this.contentForm.value.link) {
        contentFormData.append('link', this.contentForm.value.link);
      }
      if (this.contentForm.value.categories) {
        contentFormData.append('categories', JSON.stringify(this.contentForm.value.categories));
      }
      return this.educationalContentStore.addContent(contentFormData);
    }
  }

  private hasResource() {
    const hasFile = !!this.selectedFile();
    const hasLink = !!this.contentForm.value.link?.trim();
    const hasExistingFile = !!this.data?.file;
    return hasFile || hasLink || hasExistingFile;
  }
}
