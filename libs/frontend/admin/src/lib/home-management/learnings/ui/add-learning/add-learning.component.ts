import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { LearningsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { type Learning } from '@mas/prisma-client/browser';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

@Component({
  selector: 'mas-add-learning',
  imports: [
    MatDialogModule,
    MatInput,
    MatButton,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    EditorComponent,
  ],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Learning</h2>
    <form #form="ngForm" [formGroup]="learningForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" cdkFocusInitial />
            @if (
              (learningForm.get('title')?.touched || form.submitted) && learningForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Title is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Sequence</mat-label>
            <input matInput formControlName="sequence" type="number" />
            @if (
              (learningForm.get('sequence')?.touched || form.submitted) &&
              learningForm.get('sequence')?.errors?.['required']
            ) {
              <mat-error>Sequence is required.</mat-error>
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
              (learningForm.get('body')?.touched || form.submitted) && learningForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
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
export class AddLearningComponent {
  private fb = inject(NonNullableFormBuilder);
  private learningsStore = inject(LearningsStore);

  data = inject<Learning | null>(MAT_DIALOG_DATA);
  themeService = inject(ThemeService);

  learningForm = this.fb.group({
    title: [this.data?.title ?? '', [Validators.required]],
    body: [this.data?.body ?? '', [Validators.required]],
    sequence: [this.data?.sequence ?? 999, [Validators.required]],
  });

  submitForm() {
    if (this.learningForm.invalid) {
      return;
    }

    if (this.data) {
      this.learningsStore.patchLearning({
        id: this.data.id,
        ...this.learningForm.getRawValue(),
      });

      return;
    }

    const addLearningData = this.learningForm.getRawValue();

    this.learningsStore.addLearning(addLearningData);
  }
}
