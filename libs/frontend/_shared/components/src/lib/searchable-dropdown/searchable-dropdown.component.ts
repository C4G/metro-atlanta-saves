import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface SearchableType {
  label: string;
  value: string;
}

@Component({
  host: {
    class: 'block',
  },
  selector: 'mas-searchable-dropdown',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatOptionModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [(ngModel)]="model" cdkFocusInitial (closed)="search.setValue('')">
        <mat-form-field class="w-full">
          <input matInput type="text" [formControl]="search" placeholder="Search" />
          @if (search.value) {
            <button matSuffix mat-icon-button aria-label="Clear" (click)="search.setValue('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        @if (showCreateButton()) {
          <button mat-button class="w-full mb-4" type="button" color="accent" (click)="create.emit()">
            {{ createButtonText() }}
          </button>
        }
        @for (item of filteredItems(); track item.value) {
          <mat-option [value]="item.value">
            <div class="flex w-full items-center">
              <span class="flex-1 truncate">{{ item.label }}</span>
            </div>
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class SearchableDropdownComponent implements ControlValueAccessor {
  private fb = inject(FormBuilder);

  items = input.required<SearchableType[]>();
  label = input<string>('Select an item');
  showCreateButton = input<boolean>(true);
  createButtonText = input<string>('Create New Item');

  create = output<void>();

  model = signal<string>('');
  search = this.fb.nonNullable.control('');

  readonly filteredItems = computed(() =>
    this.items().filter(({ label }) => label.toLowerCase().includes(this.searchTerm().toLowerCase())),
  );

  private searchTerm = toSignal(this.search.valueChanges, { initialValue: '' });

  private onChange: ((value: string | null) => void) | null = null;
  private onTouched: (() => void) | null = null;

  constructor() {
    effect(() => {
      const model = this.model();

      untracked(() => {
        this.onChange?.(model);
      });
    });
  }

  writeValue(value: string): void {
    this.model.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
