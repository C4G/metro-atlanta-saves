import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { type AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
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
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'mas-add-program',
  imports: [
    MatDialogModule,
    MatInput,
    MatButton,
    MatFormFieldModule,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatSelect,
    MatOption,
    MatDatepickerModule,
    MatHint,
    RichTextEditorComponent,
    MatSelect,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-w-[min(100vw-2rem,44rem)] bg-white [--mdc-outlined-text-field-focus-outline-color:#0f766e] [--mdc-outlined-text-field-hover-outline-color:#5eead4] dark:bg-[#151b2e] dark:[--mdc-outlined-text-field-input-text-color:#e2e8f0] dark:[--mdc-outlined-text-field-label-text-color:#94a3b8] dark:[--mdc-outlined-text-field-outline-color:rgba(148,163,184,0.3)] dark:[--mdc-outlined-text-field-focus-outline-color:#2dd4bf]"
    >
      <header class="border-b border-slate-200 px-6 pb-5 pt-6 dark:border-slate-400/15">
        <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Program operations</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
          {{ data ? 'Edit program' : 'Create program' }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {{
            data
              ? 'Update the details your staff and participants rely on.'
              : 'Add the core details now; you can manage the rest from the program workspace.'
          }}
        </p>
      </header>
      <form #form="ngForm" [formGroup]="programForm" (ngSubmit)="submitForm()">
        <mat-dialog-content class="!pt-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" cdkFocusInitial />
              @if (
                (programForm.get('name')?.touched || form.submitted) && programForm.get('name')?.errors?.['required']
              ) {
                <mat-error>Name is required.</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="startDatePicker" />
              <mat-datepicker #startDatePicker />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endDatePicker" formControlName="endDate" />
              <mat-hint>MM/DD/YYYY</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="endDatePicker" />
              <mat-datepicker #endDatePicker />
            </mat-form-field>
            @if (
              programForm.errors?.['dateRange'] &&
              (programForm.get('startDate')?.touched || programForm.get('endDate')?.touched || form.submitted)
            ) {
              <div class="sm:col-span-2">
                <mat-error>Start date must be before end date.</mat-error>
              </div>
            }
            @if (!partnerId) {
              <mat-form-field appearance="outline">
                <mat-label>Partner</mat-label>
                <mat-select formControlName="partnerId">
                  @for (partner of partnersStore.partners(); track partner.id) {
                    <mat-option [value]="partner.id">{{ partner.name }}</mat-option>
                  }
                </mat-select>
                @if (
                  (programForm.get('partnerId')?.touched || form.submitted) &&
                  programForm.get('partnerId')?.errors?.['required']
                ) {
                  <mat-error>Partner is required.</mat-error>
                }
              </mat-form-field>
            }
            <mat-form-field appearance="outline">
              <mat-label>Checkpoint Name</mat-label>
              <mat-select formControlName="checkpointNames" [compareWith]="compareCheckpoints" multiple>
                <!-- Checkpoint Options -->
                @for (checkpoint of checkpointNamesStore.checkpointNames(); track checkpoint) {
                  <mat-option [value]="checkpoint">{{ checkpoint.name }}</mat-option>
                }
              </mat-select>
              @if (
                (programForm.get('checkpointNames')?.touched || form.submitted) &&
                programForm.get('checkpointNames')?.errors?.['required']
              ) {
                <mat-error>Checkpoint name is required.</mat-error>
              }
            </mat-form-field>
            <div class="sm:col-span-2">
              <mat-label>Description</mat-label>
              <mas-rich-text-editor formControlName="description" minHeight="220px" />
              @if (
                (programForm.get('description')?.touched || form.submitted) &&
                programForm.get('description')?.errors?.['required']
              ) {
                <mat-error>Description is required.</mat-error>
              }
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="!m-0 !gap-3 !px-6 !pb-6 !pt-4">
          <button
            mat-button
            mat-dialog-close
            class="!rounded-xl !text-[0.8125rem] !font-bold !text-slate-600 hover:!bg-slate-100 dark:!text-slate-300 dark:hover:!bg-[#1b2940]"
          >
            Cancel
          </button>
          <button
            mat-raised-button
            type="submit"
            class="!rounded-xl !bg-teal-700 !text-[0.8125rem] !font-bold !text-cyan-50 hover:!bg-teal-800 dark:!bg-teal-400 dark:!text-teal-950 dark:hover:!bg-teal-200"
          >
            {{ data ? 'Save changes' : 'Create program' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export class AddProgramComponent {
  private fb = inject(NonNullableFormBuilder);
  private programsStore = inject(ProgramsStore);
  private authStore = inject(AuthStore);
  partnersStore = inject(PartnersStore);
  partnerId = this.authStore.user()?.partnerId;
  data = inject<ExtendedProgram | null>(MAT_DIALOG_DATA);
  checkpointNamesStore = inject(CheckpointNamesStore);

  programForm = this.fb.group(
    {
      name: [this.data?.name ?? '', { validators: [Validators.required] }],
      partnerId: [this.data?.partnerId ?? '', { validators: [Validators.required] }],
      description: [this.data?.description ?? '', { validators: [Validators.required] }],
      startDate: [this.data?.startDate ?? null],
      endDate: [this.data?.endDate ?? null],
      checkpointNames: [this.data?.checkpointNames ?? []],
      isTemplate: [this.data?.isTemplate ?? false],
    },
    { validators: [dateRangeValidator] },
  );

  constructor() {
    this.partnersStore.getPartners();
    this.checkpointNamesStore.getCheckpointNames();

    afterNextRender(() => {
      this.programForm.controls.checkpointNames.setValue(
        this.data?.checkpointNames ? this.data.checkpointNames : this.checkpointNamesStore.checkpointNames(),
      );
    });
  }

  partnerEffect = effect(() => {
    const user = this.authStore.user();

    untracked(() => {
      if (user?.['partnerId']) {
        this.programForm.controls.partnerId.patchValue(user['partnerId']);
      }
    });
  });

  checkpointNameValueChanges = toSignal(this.programForm.controls.checkpointNames.valueChanges);

  compareCheckpoints = (a: any, b: any) => a?.name === b?.name;

  submitForm() {
    if (this.programForm.invalid) {
      return;
    }

    const addProgramData = this.programForm.getRawValue();

    if (this.data) {
      this.programsStore.patchProgram({
        id: this.data.id,
        ...addProgramData,
      });

      return;
    }

    this.programsStore.addProgram(addProgramData);
  }
}
