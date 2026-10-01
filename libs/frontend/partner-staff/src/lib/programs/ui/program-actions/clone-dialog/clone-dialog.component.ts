import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    <div class="min-w-[min(100vw-2rem,30rem)] bg-white dark:bg-[#151b2e]">
      <header class="border-b border-slate-200 px-6 pb-5 pt-6 dark:border-slate-400/15">
        <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Program template</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">Clone program</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Create a new version of
          <span class="font-bold text-slate-700 dark:text-slate-300">{{ data.name }}</span>
          and keep its requirements.
        </p>
      </header>
      <form #form="ngForm" [formGroup]="cloneProgramForm" (ngSubmit)="submitForm()">
        <div class="px-6 py-5">
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
          <section
            class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-400/15 dark:bg-[#10182a]"
          >
            <p class="text-xs font-bold text-slate-700 dark:text-slate-300">Included requirements</p>
            <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              The new program will start with the requirements below.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (requirement of requirementsStore.requirements(); track requirement) {
                <span
                  class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-[#1b2940] dark:text-slate-300"
                >
                  {{ requirement.name }}
                </span>
              } @empty {
                <span class="text-xs text-slate-500 dark:text-slate-400">No requirements have been added yet.</span>
              }
            </div>
          </section>
        </div>
        <div class="flex justify-end gap-3 px-6 pb-6 pt-4">
          <button
            type="button"
            mat-dialog-close
            class="rounded-xl px-4 py-2.5 text-[0.8125rem] font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#1b2940]"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-xl bg-teal-700 px-4 py-2.5 text-[0.8125rem] font-bold text-cyan-50 hover:bg-teal-800 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-200"
          >
            Create clone
          </button>
        </div>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class CloneDialogComponent implements OnInit {
  data = inject<CloneData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  requirementsStore = inject(RequirementsStore);

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
