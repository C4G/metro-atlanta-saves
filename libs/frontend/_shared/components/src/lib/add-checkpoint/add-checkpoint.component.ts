import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatFormField, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';

import { AuthStore } from '@mas/frontend-shared-auth';
import { CheckpointNamesStore, CheckpointsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { Checkpoint } from '@mas/prisma-client/browser';

@Component({
  selector: 'mas-add-checkpoint',
  imports: [
    MatDialogModule,
    MatInput,
    MatButton,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatIcon,
    MatPrefix,
    MatSelect,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data?.checkpoint ? 'Edit Checkpoint' : 'Add Checkpoint' }}</h2>
    <form #form="ngForm" [formGroup]="checkpointForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Name</mat-label>
            <mat-select formControlName="name">
              @for (checkpointName of checkpointNamesStore.checkpointNames(); track checkpointName.name) {
                <mat-option [value]="checkpointName.name">{{ checkpointName.name }}</mat-option>
              }
            </mat-select>
            @if (
              (checkpointForm.get('name')?.touched || form.submitted) &&
              checkpointForm.get('name')?.errors?.['required']
            ) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Saved Money</mat-label>
            <input matInput formControlName="savedMoney" cdkFocusInitial type="number" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Credit Score</mat-label>
            <input matInput formControlName="creditScore" type="number" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Notes</mat-label>
            <input matInput formControlName="application" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">{{ data?.checkpoint ? 'Save' : 'Add' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class AddCheckpointComponent {
  private fb = inject(NonNullableFormBuilder);
  private checkpointStore = inject(CheckpointsStore);
  private authStore = inject(AuthStore);
  private usersOnProgramsStore = inject(UsersOnProgramsStore);
  checkpointNamesStore = inject(CheckpointNamesStore);
  data = inject<{ checkpoint: Checkpoint | null; programId: string | null } | null>(MAT_DIALOG_DATA);

  checkpointForm = this.fb.group({
    name: [this.data?.checkpoint?.name ?? '', [Validators.required]],
    savedMoney: [this.data?.checkpoint?.savedMoney ?? null],
    creditScore: [this.data?.checkpoint?.creditScore ?? null],
    application: [this.data?.checkpoint?.application ?? ''],
  });

  constructor() {
    if (this.data?.programId) {
      this.checkpointNamesStore.getCheckpointNamesForProgram(this.data.programId);
    } else {
      this.checkpointNamesStore.getCheckpointNames();
    }
  }

  submitForm() {
    if (this.checkpointForm.invalid) {
      return;
    }

    if (this.data?.checkpoint) {
      this.checkpointStore.patchCheckpoint({
        id: this.data.checkpoint.id,
        ...this.checkpointForm.getRawValue(),
      });

      return;
    }

    const addCheckpointData = this.checkpointForm.getRawValue();

    this.checkpointStore.addCheckpoint({
      checkpointData: addCheckpointData,
      cb: () =>
        this.authStore.isStaff() ? this.checkpointStore.getCheckpoints() : this.usersOnProgramsStore.getUserOnProgram(),
    });
  }
}
