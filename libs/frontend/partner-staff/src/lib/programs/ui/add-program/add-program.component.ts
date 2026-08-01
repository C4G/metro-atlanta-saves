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
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Program</h2>
    <form #form="ngForm" [formGroup]="programForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (programForm.get('name')?.touched || form.submitted) && programForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startDatePicker" formControlName="startDate" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="startDatePicker" />
            <mat-datepicker #startDatePicker />
          </mat-form-field>
          <mat-form-field>
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
            <mat-form-field>
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
          <mat-form-field>
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
