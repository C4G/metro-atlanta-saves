import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { WhatWeAreStore } from '@mas/frontend-shared-data-access';

type PartnerContent = { shortName: string; name: string; description: string };

@Component({
  selector: 'mas-what-we-are',
  imports: [MatButton, MatError, MatFormField, MatInput, MatLabel, MatSlideToggle, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="mb-6 max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand">Who we are</p>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-ink">Explain the collaborative</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          Update the section introduction, its link, and each partner card without changing the landing page layout.
        </p>
      </div>

      <div class="mb-6 flex items-center justify-between rounded-lg border border-outline bg-surface-subtle p-4">
        <div>
          <p class="font-medium text-ink">Who we are section visibility</p>
          <p class="text-sm text-ink-muted">Show or hide this content and the partner organization cards</p>
        </div>
        <mat-slide-toggle [checked]="!whatWeAreStore.whatWeAre()?.hidden" (change)="onToggleHidden($event.checked)">
          {{ whatWeAreStore.whatWeAre()?.hidden ? 'Hidden' : 'Visible' }}
        </mat-slide-toggle>
      </div>

      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="whatWeAreForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <mat-form-field>
            <mat-label>Eyebrow text</mat-label>
            <input matInput formControlName="eyebrow" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Section heading</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>
          <mat-form-field class="md:col-span-2">
            <mat-label>Who we are description</mat-label>
            <textarea matInput formControlName="whoWeAreDescription" rows="4" cdkFocusInitial></textarea>
            @if (
              (whatWeAreForm.get('whoWeAreDescription')?.touched || form.submitted) &&
              whatWeAreForm.get('whoWeAreDescription')?.errors?.['required']
            ) {
              <mat-error>Who we are description is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Button text</mat-label>
            <input matInput formControlName="buttonText" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Button link</mat-label>
            <input matInput formControlName="buttonLink" />
          </mat-form-field>
        </div>

        <div formArrayName="partners" class="mt-4 grid gap-4 md:grid-cols-2">
          @for (partner of partners.controls; track $index) {
            <fieldset
              class="rounded-2xl border border-outline bg-surface-subtle p-5 md:last:col-span-2"
              [formGroupName]="$index"
            >
              <legend class="px-2 text-sm font-bold text-ink">Partner card {{ $index + 1 }}</legend>
              <div class="grid gap-3 sm:grid-cols-2">
                <mat-form-field>
                  <mat-label>Short name</mat-label>
                  <input matInput formControlName="shortName" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Organization name</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>
                <mat-form-field class="sm:col-span-2">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="4"></textarea>
                </mat-form-field>
              </div>
            </fieldset>
          }
        </div>

        <button mat-raised-button color="primary" type="submit" class="ml-auto">Save who we are</button>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export default class WhatWeAreComponent {
  private readonly fb = inject(FormBuilder);
  readonly whatWeAreStore = inject(WhatWeAreStore);

  readonly whatWeAreForm = this.fb.group({
    id: this.fb.control('', { nonNullable: true }),
    eyebrow: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    title: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    whoWeAreDescription: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    buttonText: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    buttonLink: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    partners: this.fb.array([]),
  });

  get partners(): FormArray {
    return this.whatWeAreForm.controls.partners;
  }

  constructor() {
    this.whatWeAreStore.getWhatWeAre();
    effect(() => {
      const data = this.whatWeAreStore.whatWeAre();
      if (!data) return;

      untracked(() => {
        this.whatWeAreForm.patchValue(data);
        if (!this.partners.length) {
          for (const partner of this.parsePartners(data.partnersJson)) {
            this.partners.push(
              this.fb.group({
                shortName: this.fb.control(partner.shortName, {
                  validators: Validators.required,
                  nonNullable: true,
                }),
                name: this.fb.control(partner.name, { validators: Validators.required, nonNullable: true }),
                description: this.fb.control(partner.description, {
                  validators: Validators.required,
                  nonNullable: true,
                }),
              }),
            );
          }
        }
      });
    });
  }

  onToggleHidden(checked: boolean): void {
    const current = this.whatWeAreStore.whatWeAre();
    if (current) {
      this.whatWeAreStore.patchWhatWeAre({ ...current, hidden: !checked });
    }
  }

  onSubmit(): void {
    if (this.whatWeAreForm.invalid) return;

    const current = this.whatWeAreStore.whatWeAre();
    if (!current) return;

    const { partners, ...content } = this.whatWeAreForm.getRawValue();
    this.whatWeAreStore.patchWhatWeAre({
      ...current,
      ...content,
      partnersJson: JSON.stringify(partners),
    });
  }

  private parsePartners(value: string): PartnerContent[] {
    try {
      const items: unknown = JSON.parse(value);
      return Array.isArray(items) ? (items as PartnerContent[]) : [];
    } catch {
      return [];
    }
  }
}
