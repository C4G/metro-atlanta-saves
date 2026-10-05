import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { type AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatError, MatHint, MatInput, MatLabel } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { AuthStore } from '@mas/frontend-shared-auth';
import { RichTextEditorComponent } from '@mas/frontend-shared-components';
import { CheckpointNamesStore, PartnersStore, ProgramsStore } from '@mas/frontend-shared-data-access';
import { ExtendedProgram } from '@mas/models';

function dateRangeValidator(control: AbstractControl) {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  return startDate && endDate && new Date(startDate) >= new Date(endDate) ? { dateRange: true } : null;
}

@Component({
  selector: 'mas-add-program',
  imports: [
    MatDatepickerModule,
    MatDialogClose,
    MatDialogContent,
    MatError,
    MatFormFieldModule,
    MatHint,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
    RichTextEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface text-ink">
      <header class="border-b border-outline px-5 pb-5 pt-6 sm:px-6">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Program operations</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-ink">
          {{ data ? 'Edit program' : 'Create program' }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          {{
            data
              ? 'Update the details your staff and participants rely on.'
              : 'Add the core details now; you can manage the rest from the program workspace.'
          }}
        </p>
      </header>

      <form #form="ngForm" [formGroup]="programForm" (ngSubmit)="submitForm()">
        <mat-dialog-content>
          <div class="grid gap-x-4 pt-2 sm:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" autocomplete="off" cdkFocusInitial />
              @if (
                (programForm.controls.name.touched || form.submitted) && programForm.controls.name.errors?.['required']
              ) {
                <mat-error>Name is required.</mat-error>
              }
            </mat-form-field>

            @if (!partnerId) {
              <mat-form-field appearance="outline">
                <mat-label>Partner</mat-label>
                <mat-select formControlName="partnerId">
                  @for (partner of partnersStore.partners(); track partner.id) {
                    <mat-option [value]="partner.id">{{ partner.name }}</mat-option>
                  }
                </mat-select>
                @if (
                  (programForm.controls.partnerId.touched || form.submitted) &&
                  programForm.controls.partnerId.errors?.['required']
                ) {
                  <mat-error>Partner is required.</mat-error>
                }
              </mat-form-field>
            }

            <mat-form-field appearance="outline">
              <mat-label>Start date</mat-label>
              <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="startDatePicker" />
              <mat-datepicker #startDatePicker />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End date</mat-label>
              <input matInput [matDatepicker]="endDatePicker" formControlName="endDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="endDatePicker" />
              <mat-datepicker #endDatePicker />
            </mat-form-field>

            @if (
              programForm.errors?.['dateRange'] &&
              (programForm.controls.startDate.touched || programForm.controls.endDate.touched || form.submitted)
            ) {
              <p class="mb-4 text-sm font-semibold text-danger sm:col-span-2" role="alert">
                Start date must be before the end date.
              </p>
            }

            <mat-form-field appearance="outline" class="sm:col-span-2">
              <mat-label>Checkpoint names</mat-label>
              <mat-select formControlName="checkpointNames" [compareWith]="compareCheckpoints" multiple>
                @for (checkpoint of checkpointNamesStore.checkpointNames(); track checkpoint.name) {
                  <mat-option [value]="checkpoint">{{ checkpoint.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="sm:col-span-2">
              <p class="mb-2 text-sm font-semibold text-ink">Description</p>
              <mas-rich-text-editor formControlName="description" minHeight="220px" />
              @if (
                (programForm.controls.description.touched || form.submitted) &&
                programForm.controls.description.errors?.['required']
              ) {
                <p class="mt-2 text-sm font-semibold text-danger" role="alert">Description is required.</p>
              }
            </div>
          </div>
        </mat-dialog-content>

        <footer
          class="flex flex-col-reverse gap-3 border-t border-outline px-5 py-5 sm:flex-row sm:justify-end sm:px-6"
        >
          <button
            type="button"
            mat-dialog-close
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
          >
            {{ data ? 'Save changes' : 'Create program' }}
          </button>
        </footer>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export class AddProgramComponent {
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly programsStore = inject(ProgramsStore);
  readonly checkpointNamesStore = inject(CheckpointNamesStore);
  readonly data = inject<ExtendedProgram | null>(MAT_DIALOG_DATA, { optional: true });
  readonly partnerId = this.authStore.user()?.partnerId;
  readonly partnersStore = inject(PartnersStore);
  readonly programForm = this.fb.group(
    {
      name: [this.data?.name ?? '', Validators.required],
      partnerId: [this.data?.partnerId ?? '', Validators.required],
      description: [this.data?.description ?? '', Validators.required],
      startDate: [this.data?.startDate ?? null],
      endDate: [this.data?.endDate ?? null],
      checkpointNames: [this.data?.checkpointNames ?? []],
      isTemplate: [this.data?.isTemplate ?? false],
    },
    { validators: dateRangeValidator },
  );

  readonly partnerEffect = effect(() => {
    const partnerId = this.authStore.user()?.partnerId;
    untracked(() => {
      if (partnerId) this.programForm.controls.partnerId.patchValue(partnerId);
    });
  });

  constructor() {
    this.partnersStore.getPartners();
    this.checkpointNamesStore.getCheckpointNames();

    afterNextRender(() => {
      this.programForm.controls.checkpointNames.setValue(
        this.data?.checkpointNames ?? this.checkpointNamesStore.checkpointNames(),
      );
    });
  }

  readonly compareCheckpoints = (first: { name?: string }, second: { name?: string }) => first?.name === second?.name;

  submitForm(): void {
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();
      return;
    }

    const program = this.programForm.getRawValue();
    if (this.data) {
      this.programsStore.patchProgram({ id: this.data.id, ...program });
      return;
    }
    this.programsStore.addProgram(program);
  }
}
