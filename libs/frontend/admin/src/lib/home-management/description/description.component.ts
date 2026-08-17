import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DescriptionStore, ThemeService } from '@mas/frontend-shared-data-access';
import { URL_REGEX } from '@mas/frontend-shared-util';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'mas-description',
  imports: [
    EditorComponent,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatError,
    MatSlideToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <p class="font-medium">Description Section Visibility</p>
          <p class="text-sm text-gray-500">Toggle to show or hide the logo and description section on the home page</p>
        </div>
        <mat-slide-toggle [checked]="!descriptionStore.description()?.hidden" (change)="onToggleHidden($event.checked)">
          {{ descriptionStore.description()?.hidden ? 'Hidden' : 'Visible' }}
        </mat-slide-toggle>
      </div>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="descriptionForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field class="sm:col-span-2">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" />
            @if (
              (descriptionForm.get('title')?.touched || form.submitted) &&
              descriptionForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Please enter a title.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Button Text</mat-label>
            <input matInput formControlName="buttonText" />
            @if (
              (descriptionForm.get('buttonText')?.touched || form.submitted) &&
              descriptionForm.get('buttonText')?.errors?.['required']
            ) {
              <mat-error>Please enter text for the button.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Button Link</mat-label>
            <input matInput formControlName="buttonLink" />
            @if (
              (descriptionForm.get('buttonLink')?.touched || form.submitted) &&
              descriptionForm.get('buttonLink')?.errors?.['required']
            ) {
              <mat-error>Please enter a button link.</mat-error>
            }
            @if (
              (descriptionForm.get('buttonLink')?.touched || form.submitted) &&
              descriptionForm.get('buttonLink')?.errors?.['pattern']
            ) {
              <mat-error>Please enter a valid URL.</mat-error>
            }
          </mat-form-field>
          <div class="sm:col-span-2">
            <mat-label>Body</mat-label>
            <editor
              apiKey="goqs3emxc9qfnlk1vk4gq4a1ciccd4vlpl7e02cruoew0y9v"
              formControlName="body"
              [init]="{
                license_key: 'gpl',
                base_url: '/tinymce',
                suffix: '.min',
                plugins: 'lists link table code help wordcount',
                toolbar:
                  'undo redo | blocks | bold italic | numlist bullist | alignleft aligncenter alignright alignjustify | outdent indent',
                promotion: false,
                skin: themeService.darkMode() ? 'oxide-dark' : undefined,
                content_css: themeService.darkMode() ? 'dark' : undefined,
              }"
            />
            @if (
              (descriptionForm.get('body')?.touched || form.submitted) &&
              descriptionForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
            }
          </div>
          <div class="sm:col-span-2">
            <p class="text-sm font-medium mb-2">Logo Image</p>
            @if (currentLogoUrl()) {
              <img [src]="currentLogoUrl()" alt="Current logo" class="mb-3 max-h-24 object-contain" />
            }
            <div class="flex items-center gap-4 h-10">
              <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose Logo</button>
              <input hidden (change)="onFileSelected($event)" #fileInput type="file" accept="image/*" />
              @if (selectedFileName()) {
                <span class="text-sm">{{ selectedFileName() }}</span>
              }
            </div>
            @if (selectedFileError()) {
              <mat-error class="mt-1">{{ selectedFileError() }}</mat-error>
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
export default class DescriptionComponent {
  private fb = inject(FormBuilder);
  descriptionStore = inject(DescriptionStore);
  themeService = inject(ThemeService);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  selectedFileError = signal('');
  currentLogoUrl = signal('');

  descriptionForm = this.fb.group({
    id: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    title: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    body: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    buttonText: [''],
    buttonLink: ['', Validators.pattern(URL_REGEX)],
  });

  constructor() {
    this.descriptionStore.getDescription();
    effect(() => {
      const descriptionData = this.descriptionStore.description();
      if (descriptionData) {
        this.descriptionForm.patchValue(descriptionData);
        if (descriptionData.logoUrl) {
          this.currentLogoUrl.set(descriptionData.logoUrl);
        }
      }
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
    const current = this.descriptionStore.description();
    if (current) {
      this.descriptionStore.patchDescription({ ...current, hidden: !checked });
    }
  }

  onSubmit() {
    if (this.descriptionForm.invalid) {
      return;
    }

    const { id, title, body, buttonText, buttonLink } = this.descriptionForm.getRawValue();
    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('body', body);
    if (buttonText) formData.append('buttonText', buttonText);
    if (buttonLink) formData.append('buttonLink', buttonLink);

    const file = this.selectedFile();
    if (file) {
      formData.append('file', file);
    }

    this.descriptionStore.patchDescription(formData);
  }
}
