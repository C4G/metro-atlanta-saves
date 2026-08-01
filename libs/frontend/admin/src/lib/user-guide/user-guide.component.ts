import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService, UserGuideStore } from '@mas/frontend-shared-data-access';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'mas-user-guide',
  imports: [EditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-3">User Guide</h2>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="userGuideForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
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
              (userGuideForm.get('body')?.touched || form.submitted) && userGuideForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
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
export default class UserGuideComponent {
  private fb = inject(NonNullableFormBuilder);
  userGuideStore = inject(UserGuideStore);
  themeService = inject(ThemeService);

  userGuideForm = this.fb.group({
    id: ['', Validators.required],
    body: ['', Validators.required],
  });

  constructor() {
    this.userGuideStore.getUserGuide();
    effect(() => {
      const userGuideData = this.userGuideStore.userGuide();
      if (userGuideData) {
        this.userGuideForm.patchValue(userGuideData);
      }
    });
  }

  onSubmit() {
    if (this.userGuideForm.invalid) {
      return;
    }

    this.userGuideStore.patchUserGuide(this.userGuideForm.getRawValue());
  }
}
