import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WhatWeAreStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-what-we-are',
  imports: [ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <p class="font-medium">Who We Are / What We Do Section Visibility</p>
          <p class="text-sm text-gray-500">Toggle to show or hide this section on the home page</p>
        </div>
        <mat-slide-toggle [checked]="!whatWeAreStore.whatWeAre()?.hidden" (change)="onToggleHidden($event.checked)">
          {{ whatWeAreStore.whatWeAre()?.hidden ? 'Hidden' : 'Visible' }}
        </mat-slide-toggle>
      </div>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="whatWeAreForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 gap-4">
          <mat-form-field>
            <mat-label>Who We Are Description</mat-label>
            <textarea matInput formControlName="whoWeAreDescription" rows="4" cdkFocusInitial></textarea>
            @if (
              (whatWeAreForm.get('whoWeAreDescription')?.touched || form.submitted) &&
              whatWeAreForm.get('whoWeAreDescription')?.errors?.['required']
            ) {
              <mat-error>Who We Are description is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>What We Do Description</mat-label>
            <textarea matInput formControlName="whatWeDoDescription" rows="4"></textarea>
            @if (
              (whatWeAreForm.get('whatWeDoDescription')?.touched || form.submitted) &&
              whatWeAreForm.get('whatWeDoDescription')?.errors?.['required']
            ) {
              <mat-error>What We Do description is required.</mat-error>
            }
          </mat-form-field>
        </div>
        <button mat-raised-button color="primary" type="submit" class="w-10 ml-auto">Save</button>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class WhatWeAreComponent {
  private fb = inject(FormBuilder);
  whatWeAreStore = inject(WhatWeAreStore);

  whatWeAreForm = this.fb.group({
    id: this.fb.control('', { nonNullable: true }),
    whoWeAreDescription: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    whatWeDoDescription: this.fb.control('', { validators: Validators.required, nonNullable: true }),
  });

  constructor() {
    this.whatWeAreStore.getWhatWeAre();
    effect(() => {
      const data = this.whatWeAreStore.whatWeAre();
      if (data) {
        this.whatWeAreForm.patchValue(data);
      }
    });
  }

  onToggleHidden(checked: boolean): void {
    const current = this.whatWeAreStore.whatWeAre();
    if (current) {
      this.whatWeAreStore.patchWhatWeAre({ ...current, hidden: !checked });
    }
  }

  onSubmit() {
    if (this.whatWeAreForm.invalid) {
      return;
    }
    const current = this.whatWeAreStore.whatWeAre();
    if (current) {
      this.whatWeAreStore.patchWhatWeAre({ ...current, ...this.whatWeAreForm.getRawValue() });
    }
  }
}
