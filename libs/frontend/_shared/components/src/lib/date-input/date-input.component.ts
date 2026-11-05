import { ChangeDetectionStrategy, Component, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';

export const parseDateInput = (value: string | null | undefined) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

export const formatDateInput = (date: Date | null | undefined) => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

@Component({
  selector: 'mas-date-input',
  imports: [MatDatepickerModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInputComponent), multi: true }],
  template: `
    <div
      class="flex min-h-11 w-full items-center rounded-xl border bg-surface pl-3 pr-1 text-sm text-ink focus-within:ring-2 focus-within:ring-brand"
      [class.border-warn-ink]="warn()"
      [class.border-outline]="!warn()"
      [class.opacity-50]="disabled()"
    >
      <input
        [id]="inputId()"
        [matDatepicker]="picker"
        [value]="date()"
        [min]="minDate()"
        [max]="maxDate()"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel() || null"
        (dateChange)="pick($event)"
        (blur)="touched()"
        (click)="picker.open()"
        autocomplete="off"
        class="min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-2 font-normal text-ink outline-none placeholder:text-ink-subtle"
      />
      @if (date() && clearable()) {
        <button
          type="button"
          (click)="clear()"
          [disabled]="disabled()"
          aria-label="Clear date"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base !leading-none">close</mat-icon>
        </button>
      }
      <button
        type="button"
        (click)="picker.open()"
        [disabled]="disabled()"
        aria-label="Open calendar"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-strong hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl !leading-none">calendar_today</mat-icon>
      </button>
      <mat-datepicker #picker (closed)="touched()" />
    </div>
  `,
  host: { class: 'block' },
})
export class DateInputComponent implements ControlValueAccessor {
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input('');
  readonly placeholder = input('mm/dd/yyyy');
  readonly min = input('');
  readonly max = input('');
  readonly warn = input(false);
  readonly clearable = input(true);
  readonly value = input<string | null>(null);
  readonly valueChange = output<string>();

  private readonly written = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly date = computed(() => parseDateInput(this.written() ?? this.value()));
  readonly minDate = computed(() => parseDateInput(this.min()));
  readonly maxDate = computed(() => parseDateInput(this.max()));
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.written.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  pick(event: MatDatepickerInputEvent<Date>): void {
    this.update(formatDateInput(event.value));
  }

  clear(): void {
    this.update('');
  }

  touched(): void {
    this.onTouched();
  }

  private update(value: string): void {
    this.written.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }
}
