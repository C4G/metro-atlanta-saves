import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AuthStore } from '@mas/frontend-shared-auth';
import { DateInputComponent, RichTextEditorComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { PartnersStore, ProgramsStore, TaskReviewStore } from '@mas/frontend-shared-data-access';
import { htmlToText } from '@mas/frontend-shared-util';
import { toDateInput } from '../monthly-progress/monthly-plan-editor.store';
import { CONTROL, CONTROL_SOLID, FIELD, LABEL } from '../ui/staff-ui';
import { WindowFrameComponent } from '../ui/window-frame.component';

const datesInOrder = ({ value }: { value: { startDate?: string | null; endDate?: string | null } }) =>
  value.startDate && value.endDate && value.endDate < value.startDate ? { dateOrder: true } : null;

export const toProgramDate = (value: string) => (value ? new Date(`${value}T00:00`) : null);

@Component({
  selector: 'mas-program-settings-dialog',
  imports: [
    DateInputComponent,
    MatIcon,
    ReactiveFormsModule,
    RichTextEditorComponent,
    SpinnerComponent,
    WindowFrameComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <mas-window-frame
        heading="Program settings"
        headingId="program-settings-heading"
        [busy]="programs.programSaving()"
      >
        <div class="flex flex-col gap-3.5 p-4 sm:p-5">
          <div class="flex flex-col gap-1.5">
            <label for="settings-name" [class]="labelClass">Program name</label>
            <input id="settings-name" formControlName="name" [class]="fieldClass" autocomplete="off" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="settings-partner" [class]="labelClass">Partner</label>
            <span class="relative block">
              <select
                id="settings-partner"
                formControlName="partnerId"
                [class]="
                  fieldClass + ' cursor-pointer appearance-none pr-9 disabled:cursor-default disabled:opacity-60'
                "
              >
                @for (partner of partnerOptions(); track partner.id) {
                  <option [value]="partner.id">{{ partner.name }}</option>
                }
              </select>
              <mat-icon
                class="mas-icon-sm pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              >
                expand_more
              </mat-icon>
            </span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="settings-start" [class]="labelClass">Start date</label>
              <mas-date-input inputId="settings-start" formControlName="startDate" [warn]="!form.value.startDate" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="settings-end" [class]="labelClass">End date</label>
              <mas-date-input inputId="settings-end" formControlName="endDate" [min]="form.value.startDate ?? ''" />
            </div>
          </div>
          <p
            class="-mt-1.5 text-xs"
            [class]="form.hasError('dateOrder') || !form.value.startDate ? 'text-warn-ink' : 'text-ink-muted'"
          >
            {{
              form.hasError('dateOrder')
                ? 'The end date must be after the start date.'
                : form.value.startDate
                  ? 'Month 1 begins on the start date.'
                  : 'Add a start date so Tasks review knows the current month.'
            }}
          </p>
          <div class="flex flex-col gap-1.5">
            <span id="settings-description-label" [class]="labelClass">Description</span>
            <mas-rich-text-editor
              formControlName="description"
              minHeight="120px"
              aria-labelledby="settings-description-label"
            />
          </div>
        </div>
        <button windowFooter type="button" [class]="controlClass" (click)="dialogRef.close()">Cancel</button>
        <button windowFooter type="submit" [class]="solidClass" [disabled]="form.invalid || programs.programSaving()">
          @if (programs.programSaving()) {
            <mas-spinner />
          }
          Save settings
        </button>
      </mas-window-frame>
    </form>
  `,
})
export class ProgramSettingsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ProgramSettingsDialogComponent>);
  readonly programs = inject(ProgramsStore);
  private readonly partners = inject(PartnersStore);
  private readonly review = inject(TaskReviewStore);
  private readonly isAdmin = inject(AuthStore).isAdmin;
  readonly labelClass = LABEL;
  readonly fieldClass = FIELD;
  readonly controlClass = CONTROL;
  readonly solidClass = CONTROL_SOLID;

  private readonly program = this.programs.program();
  readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: [this.program?.name ?? '', Validators.required],
      partnerId: [{ value: this.program?.partnerId ?? '', disabled: !this.isAdmin() }],
      startDate: toDateInput(this.program?.startDate),
      endDate: toDateInput(this.program?.endDate),
      description: this.program?.description ?? '',
    },
    { validators: datesInOrder },
  );

  readonly partnerOptions = computed(() => {
    const current = this.program?.partnerId
      ? [{ id: this.program.partnerId, name: this.program.partner?.name ?? 'Current partner' }]
      : [];
    const all = this.partners.partners().map(({ id, name }) => ({ id, name }));
    return [...current.filter(({ id }) => !all.some((partner) => partner.id === id)), ...all];
  });

  constructor() {
    if (this.isAdmin() && !this.partners.partners().length) this.partners.getPartners();
  }

  save(): void {
    if (this.form.invalid || !this.program) return;
    const { name, partnerId, startDate, endDate, description } = this.form.getRawValue();
    const id = this.program.id;
    this.programs.patchProgram({
      id,
      name: name.trim(),
      ...(this.isAdmin() && partnerId ? { partnerId } : {}),
      startDate: toProgramDate(startDate),
      endDate: toProgramDate(endDate),
      description: htmlToText(description) ? description : null,
      keepOpen: true,
      onSaved: () => {
        this.programs.getProgram(id);
        this.review.load(id);
        this.dialogRef.close();
      },
    });
  }
}
