import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RequirementsStore } from '../../../../program/requirements/requirements.store';

type CloneData = {
  id: string;
  name: string;
  onYesClick: (name: string) => void;
};

@Component({
  selector: 'mas-clone-dialog',
  imports: [MatDialogClose, MatFormFieldModule, MatInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface text-ink">
      <header class="border-b border-outline px-5 pb-5 pt-6 sm:px-6">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Program template</p>
        <h2 class="mt-2 text-2xl font-bold tracking-tight">Clone program</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          Create a new version of
          <span class="font-bold text-ink">{{ data.name }}</span>
          with its requirements.
        </p>
      </header>

      <form #form="ngForm" [formGroup]="cloneProgramForm" (ngSubmit)="submitForm()">
        <div class="px-5 py-5 sm:px-6">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>New program name</mat-label>
            <input matInput formControlName="name" autocomplete="off" cdkFocusInitial />
            @if (
              (cloneProgramForm.controls.name.touched || form.submitted) &&
              cloneProgramForm.controls.name.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>

          <section
            class="mt-2 rounded-2xl border border-outline bg-surface-subtle p-4"
            aria-labelledby="included-title"
          >
            <h3 id="included-title" class="text-sm font-bold text-ink">Included requirements</h3>
            <p class="mt-1 text-xs leading-5 text-ink-muted">
              The cloned program will start with these existing requirements.
            </p>
            <ul class="mt-3 flex flex-wrap gap-2">
              @for (requirement of requirementsStore.requirements(); track requirement.id) {
                <li class="rounded-full border border-outline bg-surface px-3 py-1.5 text-xs font-semibold text-ink">
                  {{ requirement.name }}
                </li>
              } @empty {
                <li class="text-xs text-ink-muted">No requirements have been added yet.</li>
              }
            </ul>
          </section>
        </div>

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
            Create clone
          </button>
        </footer>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export class CloneDialogComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly data = inject<CloneData>(MAT_DIALOG_DATA);
  readonly requirementsStore = inject(RequirementsStore);
  readonly cloneProgramForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.requirementsStore.setProgramId(this.data.id);
    this.requirementsStore.getRequirements();
  }

  submitForm(): void {
    if (this.cloneProgramForm.invalid) {
      this.cloneProgramForm.markAllAsTouched();
      return;
    }
    this.data.onYesClick(this.cloneProgramForm.getRawValue().name);
  }
}
