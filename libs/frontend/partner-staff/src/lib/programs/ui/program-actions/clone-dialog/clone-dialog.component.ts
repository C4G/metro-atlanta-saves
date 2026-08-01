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
  imports: [ReactiveFormsModule, MatDialogModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Clone Program</h2>
    <mat-dialog-content>Are you sure you want to clone {{ data.name }}?</mat-dialog-content>
    <form #form="ngForm" [formGroup]="cloneProgramForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field class="pr-5">
            <mat-label>Program Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (cloneProgramForm.get('name')?.touched || form.submitted) &&
              cloneProgramForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <div class="flex flex-col p-3">
        <div class="text-xl font-bold p-2">Program Requirements</div>
        @for (requirement of requirementsStore.requirements(); track requirement) {
          <div class="flex flex-col p-2">
            <p class="text-base">- {{ requirement.name }}</p>
          </div>
        }
      </div>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>No</button>
        <button mat-raised-button mat-dialog-close cdkFocusInitial (click)="submitForm()">Yes</button>
      </mat-dialog-actions>
    </form>
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
