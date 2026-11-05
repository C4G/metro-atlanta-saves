import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { type AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { AuthStore } from '@mas/frontend-shared-auth';
import { RichTextEditorComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { CheckpointNamesStore, PartnersStore, ProgramsStore } from '@mas/frontend-shared-data-access';
import { ExtendedProgram } from '@mas/models';
import { Program } from '@mas/prisma-client/browser';

function dateRangeValidator(control: AbstractControl) {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;
  return startDate && endDate && new Date(startDate) >= new Date(endDate) ? { dateRange: true } : null;
}

@Component({
  selector: 'mas-add-program',
  imports: [
    SpinnerComponent,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDialogClose,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    MatSuffix,
    ReactiveFormsModule,
    RichTextEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface text-ink">
      <header class="border-b border-outline px-5 py-6 sm:px-6 sm:py-7">
        <h2 class="text-2xl font-semibold tracking-[-0.02em] text-ink">
          {{ inline() ? 'Program settings' : data() ? 'Edit program' : 'Create program' }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          {{
            data()
              ? 'Update the details your staff and participants rely on.'
              : 'Add the core details now; you can manage the rest from the program workspace.'
          }}
        </p>
      </header>

      <form #form="ngForm" [formGroup]="programForm" (ngSubmit)="submitForm()">
        <div class="px-5 py-6 sm:px-6" [class]="inline() ? '' : 'max-h-[65vh] overflow-y-auto'">
          <div class="space-y-8">
            <section aria-labelledby="program-identity-heading">
              <div class="max-w-2xl">
                <h3 id="program-identity-heading" class="text-base font-semibold">Program identity</h3>
                <p class="mt-1 text-sm leading-6 text-ink-muted">
                  Give the program a clear name and assign its partner.
                </p>
              </div>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <mat-form-field appearance="outline">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" autocomplete="off" cdkFocusInitial />
                  @if (
                    (programForm.controls.name.touched || form.submitted) &&
                    programForm.controls.name.errors?.['required']
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
              </div>
            </section>

            <section class="border-t border-outline pt-8" aria-labelledby="program-schedule-heading">
              <div class="max-w-2xl">
                <h3 id="program-schedule-heading" class="text-base font-semibold">Schedule</h3>
                <p class="mt-1 text-sm leading-6 text-ink-muted">
                  Set the dates participants can expect this program to run.
                </p>
              </div>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
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
              </div>
              @if (
                programForm.errors?.['dateRange'] &&
                (programForm.controls.startDate.touched || programForm.controls.endDate.touched || form.submitted)
              ) {
                <p class="mt-1 text-sm font-medium text-danger" role="alert">Start date must be before the end date.</p>
              }
            </section>

            <section class="border-t border-outline pt-8" aria-labelledby="program-learning-heading">
              <div class="max-w-2xl">
                <h3 id="program-learning-heading" class="text-base font-semibold">Learning plan</h3>
                <p class="mt-1 text-sm leading-6 text-ink-muted">
                  Choose the checkpoints participants will work through.
                </p>
              </div>
              <mat-form-field appearance="outline" class="mt-5 w-full">
                <mat-label>Checkpoints</mat-label>
                <mat-select formControlName="checkpointNames" [compareWith]="compareCheckpoints" multiple>
                  @for (checkpoint of checkpointNamesStore.checkpointNames(); track checkpoint.name) {
                    <mat-option [value]="checkpoint">{{ checkpoint.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </section>

            <section class="border-t border-outline pt-8" aria-labelledby="program-description-heading">
              <div class="max-w-2xl">
                <h3 id="program-description-heading" class="text-base font-semibold">Program description</h3>
                <p class="mt-1 text-sm leading-6 text-ink-muted">
                  Explain what participants can expect from this program.
                </p>
              </div>
              <div class="mt-5">
                <mas-rich-text-editor formControlName="description" minHeight="220px" />
                @if (
                  (programForm.controls.description.touched || form.submitted) &&
                  programForm.controls.description.errors?.['required']
                ) {
                  <p class="mt-2 text-sm font-medium text-danger" role="alert">Description is required.</p>
                }
              </div>
            </section>
          </div>
        </div>

        <footer
          class="flex flex-col-reverse gap-3 border-t border-outline px-5 py-5 sm:flex-row sm:justify-end sm:px-6"
        >
          @if (inline()) {
            <button
              type="button"
              [disabled]="programsStore.programSaving()"
              (click)="resetForm()"
              class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
            >
              Reset changes
            </button>
          } @else {
            <button
              type="button"
              mat-dialog-close
              class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              Cancel
            </button>
          }
          <button
            type="submit"
            [disabled]="programsStore.programSaving()"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
          >
            <span class="relative inline-flex items-center justify-center">
              <span [class.invisible]="programsStore.programSaving()">
                {{ data() ? 'Save changes' : 'Create program' }}
              </span>
              @if (programsStore.programSaving()) {
                <mas-spinner class="absolute" />
                <span class="sr-only">{{ data() ? 'Save changes' : 'Create program' }}</span>
              }
            </span>
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
  readonly programsStore = inject(ProgramsStore);
  readonly checkpointNamesStore = inject(CheckpointNamesStore);
  private readonly dialogData = inject<ExtendedProgram | null>(MAT_DIALOG_DATA, { optional: true });
  readonly program = input<(Program & { checkpointNames?: { name: string }[] }) | null>(null);
  readonly inline = input(false);
  readonly data = computed(() => this.program() ?? this.dialogData);
  readonly partnerId = this.authStore.user()?.partnerId;
  readonly partnersStore = inject(PartnersStore);
  readonly programForm = this.fb.group(
    {
      name: [this.dialogData?.name ?? '', Validators.required],
      partnerId: [this.dialogData?.partnerId ?? '', Validators.required],
      description: [this.dialogData?.description ?? '', Validators.required],
      startDate: [this.dialogData?.startDate ?? null],
      endDate: [this.dialogData?.endDate ?? null],
      checkpointNames: this.fb.control<{ name: string }[]>(this.dialogData?.checkpointNames ?? []),
      isTemplate: [this.dialogData?.isTemplate ?? false],
    },
    { validators: dateRangeValidator },
  );

  readonly programEffect = effect(() => {
    const program = this.program();
    if (program) untracked(() => this.resetForm());
  });

  resetForm(): void {
    const program = this.data();
    if (!program) return;
    this.programForm.reset({
      name: program.name,
      partnerId: program.partnerId,
      description: program.description ?? '',
      startDate: program.startDate ? new Date(program.startDate) : null,
      endDate: program.endDate ? new Date(program.endDate) : null,
      checkpointNames: program.checkpointNames ?? [],
      isTemplate: program.isTemplate,
    });
  }

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
      if (this.inline()) return;
      this.programForm.controls.checkpointNames.setValue(
        this.data()?.checkpointNames ?? this.checkpointNamesStore.checkpointNames(),
      );
    });
  }

  readonly compareCheckpoints = (first: { name?: string }, second: { name?: string }) => first?.name === second?.name;

  submitForm(): void {
    if (this.programsStore.programSaving()) return;
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();
      return;
    }

    const program = this.programForm.getRawValue();
    const data = this.data();
    if (data) {
      this.programsStore.patchProgram({ id: data.id, ...program, keepOpen: this.inline() });
      return;
    }
    this.programsStore.addProgram(program);
  }
}
