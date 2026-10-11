import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { DescriptionStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-description',
  imports: [MatButton, MatError, MatFormField, MatInput, MatLabel, MatSlideToggle, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="mb-6 max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand">Programs overview</p>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-ink">Introduce the programs</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          This heading and description appear directly above the program cards on the landing page.
        </p>
      </div>
      <div class="mb-6 flex items-center justify-between rounded-lg border border-outline bg-surface-subtle p-4">
        <div>
          <p class="font-medium text-ink">Programs section visibility</p>
          <p class="text-sm text-ink-muted">Show or hide the programs overview and program cards</p>
        </div>
        <mat-slide-toggle [checked]="!descriptionStore.description()?.hidden" (change)="onToggleHidden($event.checked)">
          {{ descriptionStore.description()?.hidden ? 'Hidden' : 'Visible' }}
        </mat-slide-toggle>
      </div>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="descriptionForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 gap-4">
          <mat-form-field>
            <mat-label>Eyebrow text</mat-label>
            <input matInput formControlName="eyebrow" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Section heading</mat-label>
            <input matInput formControlName="title" />
            @if (
              (descriptionForm.get('title')?.touched || form.submitted) &&
              descriptionForm.get('title')?.errors?.['required']
            ) {
              <mat-error>Please enter a section heading.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Section description</mat-label>
            <textarea matInput formControlName="body" rows="4"></textarea>
            @if (
              (descriptionForm.get('body')?.touched || form.submitted) &&
              descriptionForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Please enter a section description.</mat-error>
            }
          </mat-form-field>
          <div formArrayName="programs" class="mt-4 grid gap-4 md:grid-cols-2">
            @for (program of programs.controls; track $index) {
              <fieldset class="rounded-2xl border border-outline bg-surface-subtle p-5" [formGroupName]="$index">
                <legend class="px-2 text-sm font-bold text-ink">Program card {{ $index + 1 }}</legend>
                <mat-form-field class="w-full">
                  <mat-label>Program name</mat-label>
                  <input matInput formControlName="title" />
                </mat-form-field>
                <mat-form-field class="w-full">
                  <mat-label>Program description</mat-label>
                  <textarea matInput formControlName="description" rows="6"></textarea>
                </mat-form-field>
              </fieldset>
            }
          </div>
        </div>
        <button mat-raised-button color="primary" type="submit" class="ml-auto">Save programs overview</button>
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

  descriptionForm = this.fb.group({
    id: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    title: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    body: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    eyebrow: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    programs: this.fb.array([]),
  });

  get programs(): FormArray {
    return this.descriptionForm.controls.programs;
  }

  constructor() {
    this.descriptionStore.getDescription();
    effect(() => {
      const descriptionData = this.descriptionStore.description();
      if (descriptionData) {
        untracked(() => {
          this.descriptionForm.patchValue(descriptionData);
          if (!this.programs.length) {
            for (const program of this.parseItems(descriptionData.programsJson)) {
              this.programs.push(
                this.fb.group({
                  title: this.fb.control(program.title, { validators: Validators.required, nonNullable: true }),
                  description: this.fb.control(program.description, {
                    validators: Validators.required,
                    nonNullable: true,
                  }),
                }),
              );
            }
          }
        });
      }
    });
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

    const current = this.descriptionStore.description();
    if (!current) return;

    const { body, eyebrow, programs, title } = this.descriptionForm.getRawValue();
    this.descriptionStore.patchDescription({
      ...current,
      body,
      eyebrow,
      programsJson: JSON.stringify(programs),
      title,
    });
  }

  private parseItems(value: string): { title: string; description: string }[] {
    try {
      const items: unknown = JSON.parse(value);
      return Array.isArray(items) ? (items as { title: string; description: string }[]) : [];
    } catch {
      return [];
    }
  }
}
