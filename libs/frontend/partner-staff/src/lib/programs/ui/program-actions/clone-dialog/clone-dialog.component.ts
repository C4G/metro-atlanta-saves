import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../../../../program/requirements/requirements.store';

type CloneData = {
  id: string;
  name: string;
  onYesClick: (name: string) => void;
};

@Component({
  selector: 'mas-clone-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="clone-dialog">
      <header class="clone-dialog__header">
        <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Program template</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950">Clone program</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Create a new version of
          <span class="font-bold text-slate-700">{{ data.name }}</span>
          and keep its requirements.
        </p>
      </header>
      <form #form="ngForm" [formGroup]="cloneProgramForm" (ngSubmit)="submitForm()">
        <div class="clone-dialog__content">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Program Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (cloneProgramForm.get('name')?.touched || form.submitted) &&
              cloneProgramForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <section class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-bold text-slate-700">Included requirements</p>
            <p class="mt-1 text-xs leading-5 text-slate-500">The new program will start with the requirements below.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (requirement of requirementsStore.requirements(); track requirement) {
                <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {{ requirement.name }}
                </span>
              } @empty {
                <span class="text-xs text-slate-500">No requirements have been added yet.</span>
              }
            </div>
          </section>
        </div>
        <div class="clone-dialog__actions">
          <button type="button" mat-dialog-close class="clone-dialog__cancel">Cancel</button>
          <button type="submit" class="clone-dialog__submit">Create clone</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .clone-dialog {
        min-width: min(100vw - 2rem, 30rem);
        background: #fff;
      }
      .clone-dialog__header {
        padding: 1.5rem 1.5rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;
      }
      .clone-dialog__content {
        padding: 1.25rem 1.5rem;
      }
      .clone-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem 1.5rem;
      }
      .clone-dialog__cancel,
      .clone-dialog__submit {
        border-radius: 0.75rem;
        padding: 0.625rem 1rem;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      .clone-dialog__cancel {
        color: #475569;
      }
      .clone-dialog__cancel:hover {
        background: #f1f5f9;
      }
      .clone-dialog__submit {
        background: #0f766e;
        color: #ecfeff;
      }
      .clone-dialog__submit:hover {
        background: #115e59;
      }
      .clone-dialog ::ng-deep .mat-mdc-form-field {
        --mdc-outlined-text-field-focus-outline-color: #0f766e;
        --mdc-outlined-text-field-hover-outline-color: #5eead4;
      }
      :host(.clone-dialog--dark) .clone-dialog {
        background: #151b2e;
      }
      :host(.clone-dialog--dark) .clone-dialog__header {
        border-color: rgba(148, 163, 184, 0.16);
      }
      :host(.clone-dialog--dark) ::ng-deep .text-slate-950 {
        color: #f1f5f9 !important;
      }
      :host(.clone-dialog--dark) ::ng-deep .text-slate-700 {
        color: #cbd5e1 !important;
      }
      :host(.clone-dialog--dark) ::ng-deep .text-slate-500 {
        color: #94a3b8 !important;
      }
      :host(.clone-dialog--dark) ::ng-deep .bg-slate-50 {
        background: #10182a !important;
      }
      :host(.clone-dialog--dark) ::ng-deep .border-slate-200 {
        border-color: rgba(148, 163, 184, 0.16) !important;
      }
      :host(.clone-dialog--dark) ::ng-deep .bg-white {
        background: #1b2940 !important;
      }
      :host(.clone-dialog--dark) .clone-dialog__cancel {
        color: #cbd5e1;
      }
      :host(.clone-dialog--dark) .clone-dialog__cancel:hover {
        background: #1b2940;
      }
      :host(.clone-dialog--dark) .clone-dialog__submit {
        background: #2dd4bf;
        color: #082f2e;
      }
      :host(.clone-dialog--dark) .clone-dialog__submit:hover {
        background: #99f6e4;
      }
      :host(.clone-dialog--dark) .clone-dialog ::ng-deep .mat-mdc-form-field {
        --mdc-outlined-text-field-outline-color: rgba(148, 163, 184, 0.3);
        --mdc-outlined-text-field-focus-outline-color: #2dd4bf;
        --mdc-outlined-text-field-label-text-color: #94a3b8;
        --mdc-outlined-text-field-input-text-color: #e2e8f0;
      }
    `,
  ],
  host: {
    class: 'block',
    '[class.clone-dialog--dark]': 'themeService.darkMode()',
  },
})
export class CloneDialogComponent implements OnInit {
  data = inject<CloneData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  requirementsStore = inject(RequirementsStore);
  themeService = inject(ThemeService);

  name = input('');

  cloneProgramForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit() {
    this.requirementsStore.setProgramId(this.data.id);
    this.requirementsStore.getRequirements();
  }

  submitForm() {
    if (this.cloneProgramForm.invalid) {
      return;
    }
    const cloneProgramData = this.cloneProgramForm.getRawValue();
    this.data.onYesClick(cloneProgramData.name);
  }
}
