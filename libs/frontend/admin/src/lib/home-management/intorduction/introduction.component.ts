import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IntroductionStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-introduction',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <p class="font-medium">Hero Section Visibility</p>
          <p class="text-sm text-gray-500">Hide the entire hero section (heading + image) from the home page</p>
        </div>
        <mat-slide-toggle
          [checked]="!introductionStore.introduction().hidden"
          (change)="onToggleHidden($event.checked)"
        >
          {{ introductionStore.introduction().hidden ? 'Section Hidden' : 'Section Visible' }}
        </mat-slide-toggle>
      </div>
      @if (!introductionStore.introduction().hidden) {
        <div class="flex items-center justify-between mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div>
            <p class="font-medium">Hero Image Visibility</p>
            <p class="text-sm text-gray-500">Hide only the background image — the heading text will still show</p>
          </div>
          <mat-slide-toggle
            [checked]="!introductionStore.introduction().imageHidden"
            (change)="onToggleImageHidden($event.checked)"
          >
            {{ introductionStore.introduction().imageHidden ? 'Image Hidden' : 'Image Visible' }}
          </mat-slide-toggle>
        </div>
      }
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="introductionForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field class="sm:col-span-2">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
            <mat-hint>Use sentence or title case and describe the page topic.</mat-hint>
            @if (
              (introductionForm.get('title')?.touched || form.submitted) &&
              introductionForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Please enter a title.</mat-error>
            }
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Browser Title Ending</mat-label>
            <input matInput formControlName="titleEnding" />
            <mat-hint>Added after every page title, separated by a vertical bar.</mat-hint>
            @if (
              (introductionForm.get('titleEnding')?.touched || form.submitted) &&
              introductionForm.get('titleEnding')?.errors?.['required']
            ) {
              <mat-error>Please enter a browser title ending.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Image Alt Text</mat-label>
            <input matInput formControlName="imageText" />
            <mat-hint>Briefly describe the image's meaningful content.</mat-hint>
            @if (
              (introductionForm.get('imageText')?.touched || form.submitted) &&
              introductionForm.get('imageText')?.errors?.['required']
            ) {
              <mat-error>Please enter text for the image.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Image URL</mat-label>
            <input matInput formControlName="imageUrl" />
            @if (
              (introductionForm.get('imageUrl')?.touched || form.submitted) &&
              introductionForm.get('imageUrl')?.errors?.['required']
            ) {
              <mat-error>Image URL is required.</mat-error>
            }
          </mat-form-field>
          <div class="sm:col-span-2 h-16">
            <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose Image</button>
            <input hidden (change)="onFileSelected($event)" #fileInput type="file" />
            @if (selectedFileName()) {
              <span class="ml-4">{{ selectedFileName() }}</span>
            }
            @if (selectedFileError()) {
              <mat-error>{{ selectedFileError() }}</mat-error>
            }
          </div>
        </div>
        <button mat-raised-button color="primary" type="submit" class="w-10 ml-auto">Save</button>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class IntroductionComponent {
  private fb = inject(FormBuilder);
  introductionStore = inject(IntroductionStore);

  // Signals for file selection
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  selectedFileError = signal('');

  introductionForm = this.fb.group({
    id: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    title: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    titleEnding: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    imageText: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    imageUrl: this.fb.control('', { validators: Validators.required, nonNullable: true }),
  });

  constructor() {
    this.introductionStore.getIntroduction();
    effect(() => {
      const introductionData = this.introductionStore.introduction();
      untracked(() => {
        if (introductionData) {
          this.introductionForm.patchValue({
            ...introductionData,
            imageText: introductionData.imageText ?? '',
          });
          this.selectedFileName.set(introductionData.imageUrl ?? '');
        }
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.selectedFileError.set('Image is required');
      return;
    }
    if (!/(jpg|jpeg|png|webp)$/.test(file.type)) {
      this.selectedFileError.set('Only supported types: jpg, jpeg, png, webp');
      return;
    }

    this.selectedFileError.set('');
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
  }

  onToggleHidden(checked: boolean): void {
    const current = this.introductionStore.introduction();
    this.introductionStore.patchIntroduction({ ...current, hidden: !checked });
  }

  onToggleImageHidden(checked: boolean): void {
    const current = this.introductionStore.introduction();
    this.introductionStore.patchIntroduction({ ...current, imageHidden: !checked });
  }

  onSubmit() {
    if (this.introductionForm.invalid) {
      return;
    }

    const { id, title, titleEnding, imageText, imageUrl } = this.introductionForm.getRawValue();
    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('titleEnding', titleEnding);
    formData.append('imageText', imageText ?? '');

    const file = this.selectedFile();
    if (file) {
      formData.append('file', file);
    } else {
      formData.append('imageUrl', imageUrl);
    }

    this.introductionStore.patchIntroduction(formData);
  }
}
