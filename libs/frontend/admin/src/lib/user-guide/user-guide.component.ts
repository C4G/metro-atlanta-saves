import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserGuideStore } from '@mas/frontend-shared-data-access';
import { RichTextEditorComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-user-guide',
  imports: [RichTextEditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-3">User Guide</h2>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="userGuideForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <mas-rich-text-editor formControlName="body" minHeight="360px" />
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
