import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { IntroductionStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-introduction',
  imports: [MatButton, MatError, MatFormField, MatHint, MatInput, MatLabel, MatSlideToggle, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="mb-6 max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand">Hero</p>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-ink">Set the first impression</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          The hero is the first section visitors see. Use a colon in the title to create a heading and subheading.
        </p>
      </div>
      <div class="mb-4 flex items-center justify-between rounded-lg border border-outline bg-surface-subtle p-4">
        <div>
          <p class="font-medium text-ink">Hero section visibility</p>
          <p class="text-sm text-ink-muted">Show or hide the heading and image</p>
        </div>
        <mat-slide-toggle
          [checked]="!introductionStore.introduction().hidden"
          (change)="onToggleHidden($event.checked)"
        >
          {{ introductionStore.introduction().hidden ? 'Section Hidden' : 'Section Visible' }}
        </mat-slide-toggle>
      </div>
      @if (!introductionStore.introduction().hidden) {
        <div class="mb-6 flex items-center justify-between rounded-lg border border-outline bg-surface-subtle p-4">
          <div>
            <p class="font-medium text-ink">Hero image visibility</p>
            <p class="text-sm text-ink-muted">Hide the background image while keeping the heading visible</p>
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
            <mat-label>Eyebrow text</mat-label>
            <input matInput formControlName="eyebrow" />
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Hero title</mat-label>
            <input matInput formControlName="title" />
            <mat-hint>Text after the first colon is displayed as the subheading.</mat-hint>
            @if (
              (introductionForm.get('title')?.touched || form.submitted) &&
              introductionForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Please enter a title.</mat-error>
            }
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Supporting description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Button text</mat-label>
            <input matInput formControlName="ctaText" />
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Website title suffix</mat-label>
            <input matInput formControlName="titleEnding" />
            <mat-hint>Used after page titles throughout the website.</mat-hint>
            @if (
              (introductionForm.get('titleEnding')?.touched || form.submitted) &&
              introductionForm.get('titleEnding')?.errors?.['required']
            ) {
              <mat-error>Please enter a browser title ending.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Image description</mat-label>
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
            <mat-label>Current image URL</mat-label>
            <input matInput formControlName="imageUrl" />
            @if (
              (introductionForm.get('imageUrl')?.touched || form.submitted) &&
              introductionForm.get('imageUrl')?.errors?.['required']
            ) {
              <mat-error>Image URL is required.</mat-error>
            }
          </mat-form-field>
          <div class="sm:col-span-2 h-16">
            <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose image</button>
            <input hidden (change)="onFileSelected($event)" #fileInput type="file" accept="image/*" />
            @if (selectedFileName()) {
              <span class="ml-4">{{ selectedFileName() }}</span>
            }
            @if (selectedFileError()) {
              <mat-error>{{ selectedFileError() }}</mat-error>
            }
          </div>
        </div>
        <button mat-raised-button color="primary" type="submit" class="ml-auto">Save hero</button>
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
    eyebrow: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    description: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    ctaText: this.fb.control('', { validators: Validators.required, nonNullable: true }),
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

    const { ctaText, description, eyebrow, id, imageText, imageUrl, title, titleEnding } =
      this.introductionForm.getRawValue();
    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('titleEnding', titleEnding);
    formData.append('eyebrow', eyebrow);
    formData.append('description', description);
    formData.append('ctaText', ctaText);
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
