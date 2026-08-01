import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { CheckpointNamesStore } from '@mas/frontend-shared-data-access';
import { CheckpointName, CheckpointType } from '@prisma/client';

@Component({
  selector: 'mas-add-checkpoint-name',
  imports: [
    MatDialogModule,
    MatInput,
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatError,
    MatButton,
    MatSelect,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit  Checkpoint Name' : 'Add  Checkpoint Name' }}</h2>
    <form #form="ngForm" [formGroup]="checkpointNameForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" cdkFocusInitial />
            @if (
              (checkpointNameForm.get('name')?.touched || form.submitted) &&
              checkpointNameForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Type</mat-label>
            <mat-select formControlName="type">
              @for (type of checkpointTypes; track $index) {
                <mat-option [value]="type">{{ type }}</mat-option>
              }
            </mat-select>
            @if (
              (checkpointNameForm.get('type')?.touched || form.submitted) &&
              checkpointNameForm.get('type')?.errors?.['required']
            ) {
              <mat-error>Type is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Sequence</mat-label>
            <input matInput type="number" formControlName="sequence" />
            @if (
              (checkpointNameForm.get('sequence')?.touched || form.submitted) &&
              checkpointNameForm.get('sequence')?.errors?.['required']
            ) {
              <mat-error>Sequence is required.</mat-error>
            }
          </mat-form-field>
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
export class AddCheckpointNameComponent {
  private fb = inject(NonNullableFormBuilder);
  private checkpointNamesStore = inject(CheckpointNamesStore);

  data = inject<CheckpointName | null>(MAT_DIALOG_DATA);

  checkpointTypes: CheckpointType[] = ['Savings', 'Receipt', 'Credit_Score', 'Other'];
  checkpointNameForm = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
    type: [this.data?.type ?? 'Other', Validators.required],
    sequence: [this.data?.sequence ?? 999, Validators.required],
  });

  submitForm() {
    if (this.checkpointNameForm.invalid) {
      return;
    }

    const checkpointName = this.checkpointNameForm.getRawValue();
    if (this.data) {
      this.checkpointNamesStore.patchName({ oldName: this.data.name, checkpointName });
      return;
    }
    this.checkpointNamesStore.addName(checkpointName);
  }
}
