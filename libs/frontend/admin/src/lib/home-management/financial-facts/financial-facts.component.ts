import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { DescriptionStore } from '@mas/frontend-shared-data-access';

type FinancialFact = { statistic: string; description: string };

@Component({
  selector: 'mas-financial-facts',
  imports: [MatButton, MatFormField, MatInput, MatLabel, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <div class="mb-6 max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand">Financial facts</p>
        <h2 class="mt-2 font-serif text-2xl font-semibold text-ink">Update the supporting statistics</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          Keep the source concise and verify every statistic before publishing it.
        </p>
      </div>

      <form class="flex flex-col gap-5" [formGroup]="factsForm" (ngSubmit)="onSubmit()">
        <div class="grid gap-4 md:grid-cols-2">
          <mat-form-field>
            <mat-label>Eyebrow text</mat-label>
            <input matInput formControlName="factsEyebrow" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Source label</mat-label>
            <input matInput formControlName="factsSource" />
          </mat-form-field>
          <mat-form-field class="md:col-span-2">
            <mat-label>Section heading</mat-label>
            <input matInput formControlName="factsTitle" />
          </mat-form-field>
        </div>

        <div formArrayName="facts" class="grid gap-4 md:grid-cols-3">
          @for (fact of facts.controls; track $index) {
            <fieldset class="rounded-2xl border border-outline bg-surface-subtle p-5" [formGroupName]="$index">
              <legend class="px-2 text-sm font-bold text-ink">Fact {{ $index + 1 }}</legend>
              <mat-form-field class="w-full">
                <mat-label>Statistic</mat-label>
                <input matInput formControlName="statistic" />
              </mat-form-field>
              <mat-form-field class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="5"></textarea>
              </mat-form-field>
            </fieldset>
          }
        </div>

        <button mat-raised-button color="primary" type="submit" class="ml-auto">Save financial facts</button>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export default class FinancialFactsComponent {
  private readonly descriptionStore = inject(DescriptionStore);
  private readonly fb = inject(FormBuilder);

  readonly factsForm = this.fb.group({
    factsEyebrow: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    factsTitle: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    factsSource: this.fb.control('', { validators: Validators.required, nonNullable: true }),
    facts: this.fb.array([]),
  });

  get facts(): FormArray {
    return this.factsForm.controls.facts;
  }

  constructor() {
    this.descriptionStore.getDescription();
    effect(() => {
      const content = this.descriptionStore.description();
      if (!content) return;

      untracked(() => {
        this.factsForm.patchValue(content);
        if (!this.facts.length) {
          for (const fact of this.parseFacts(content.factsJson)) {
            this.facts.push(
              this.fb.group({
                statistic: this.fb.control(fact.statistic, { validators: Validators.required, nonNullable: true }),
                description: this.fb.control(fact.description, {
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

  onSubmit(): void {
    if (this.factsForm.invalid) return;

    const current = this.descriptionStore.description();
    if (!current) return;

    const { facts, factsEyebrow, factsSource, factsTitle } = this.factsForm.getRawValue();
    this.descriptionStore.patchDescription({
      ...current,
      factsEyebrow,
      factsJson: JSON.stringify(facts),
      factsSource,
      factsTitle,
    });
  }

  private parseFacts(value: string): FinancialFact[] {
    try {
      const items: unknown = JSON.parse(value);
      return Array.isArray(items) ? (items as FinancialFact[]) : [];
    } catch {
      return [];
    }
  }
}
