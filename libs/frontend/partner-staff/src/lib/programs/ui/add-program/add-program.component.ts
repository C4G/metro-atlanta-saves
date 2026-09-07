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
import { CheckpointNamesStore, PartnersStore, ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { ExtendedProgram } from '@mas/models';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

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
    EditorComponent,
    MatSelect,
    MatOption,
  ],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="program-editor">
      <header class="program-editor__header">
        <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Program operations</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          {{ data ? 'Edit program' : 'Create program' }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{
            data
              ? 'Update the details your staff and participants rely on.'
              : 'Add the core details now; you can manage the rest from the program workspace.'
          }}
        </p>
      </header>
      <form #form="ngForm" [formGroup]="programForm" (ngSubmit)="submitForm()">
        <mat-dialog-content class="program-editor__content">
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
              <editor
                apiKey="goqs3emxc9qfnlk1vk4gq4a1ciccd4vlpl7e02cruoew0y9v"
                formControlName="description"
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
                (programForm.get('description')?.touched || form.submitted) &&
                programForm.get('description')?.errors?.['required']
              ) {
                <mat-error>Description is required.</mat-error>
              }
            </div>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" class="program-editor__actions">
          <button mat-button mat-dialog-close class="program-editor__cancel">Cancel</button>
          <button mat-raised-button type="submit" class="program-editor__submit">
            {{ data ? 'Save changes' : 'Create program' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .program-editor {
        min-width: min(100vw - 2rem, 44rem);
        background: #fff;
      }
      .program-editor__header {
        padding: 1.5rem 1.5rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;
      }
      .program-editor__content {
        padding-top: 1.5rem;
      }
      .program-editor__actions {
        margin: 0;
        padding: 1rem 1.5rem 1.5rem;
        gap: 0.75rem;
      }
      .program-editor__cancel,
      .program-editor__submit {
        border-radius: 0.75rem !important;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      .program-editor__cancel {
        color: #475569 !important;
      }
      .program-editor__cancel:hover {
        background: #f1f5f9 !important;
      }
      .program-editor__submit {
        background: #0f766e !important;
        color: #ecfeff !important;
      }
      .program-editor__submit:hover {
        background: #115e59 !important;
      }
      .program-editor ::ng-deep .mat-mdc-form-field {
        --mdc-outlined-text-field-focus-outline-color: #0f766e;
        --mdc-outlined-text-field-hover-outline-color: #5eead4;
      }
      :host(.program-editor--dark) .program-editor {
        background: #151b2e;
      }
      :host(.program-editor--dark) .program-editor__header {
        border-color: rgba(148, 163, 184, 0.16);
      }
      :host(.program-editor--dark) ::ng-deep .text-slate-950 {
        color: #f1f5f9 !important;
      }
      :host(.program-editor--dark) ::ng-deep .text-slate-500 {
        color: #94a3b8 !important;
      }
      :host(.program-editor--dark) .program-editor__cancel {
        color: #cbd5e1 !important;
      }
      :host(.program-editor--dark) .program-editor__cancel:hover {
        background: #1b2940 !important;
      }
      :host(.program-editor--dark) .program-editor__submit {
        background: #2dd4bf !important;
        color: #082f2e !important;
      }
      :host(.program-editor--dark) .program-editor__submit:hover {
        background: #99f6e4 !important;
      }
      :host(.program-editor--dark) .program-editor ::ng-deep .mat-mdc-form-field {
        --mdc-outlined-text-field-outline-color: rgba(148, 163, 184, 0.3);
        --mdc-outlined-text-field-focus-outline-color: #2dd4bf;
        --mdc-outlined-text-field-label-text-color: #94a3b8;
        --mdc-outlined-text-field-input-text-color: #e2e8f0;
      }
    `,
  ],
  host: {
    class: 'block',
    '[class.program-editor--dark]': 'themeService.darkMode()',
  },
})
export class AddProgramComponent {
  private fb = inject(NonNullableFormBuilder);
  private programsStore = inject(ProgramsStore);
  private authStore = inject(AuthStore);
  themeService = inject(ThemeService);
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
