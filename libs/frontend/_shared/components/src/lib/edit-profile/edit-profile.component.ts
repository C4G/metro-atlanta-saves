import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { type User } from '@mas/prisma-client/browser';
import { PartnersStore } from '@mas/frontend-shared-data-access';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-add-user',
  imports: [MatDialogModule, MatInput, MatButton, MatFormField, MatLabel, ReactiveFormsModule, MatError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Edit Profile</h2>
    <form #form="ngForm" [formGroup]="userForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" cdkFocusInitial />
            @if ((userForm.get('email')?.touched || form.submitted) && userForm.get('email')?.errors?.['required']) {
              <mat-error>Email is required.</mat-error>
            }
            @if ((userForm.get('email')?.touched || form.submitted) && userForm.get('email')?.errors?.['email']) {
              <mat-error>Please enter a valid email address.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
            @if (
              (userForm.get('firstName')?.touched || form.submitted) && userForm.get('firstName')?.errors?.['required']
            ) {
              <mat-error>First Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
            @if (
              (userForm.get('lastName')?.touched || form.submitted) && userForm.get('lastName')?.errors?.['required']
            ) {
              <mat-error>Last Name is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Bio</mat-label>
            <input matInput formControlName="bio" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class EditProfileComponent {
  private fb = inject(FormBuilder);
  private partnersStore = inject(PartnersStore);

  authStore = inject(AuthStore);
  search = this.fb.control('');
  data = inject<User | null>(MAT_DIALOG_DATA);

  userForm = this.fb.group({
    email: this.fb.nonNullable.control(this.data?.email ?? '', [Validators.required, Validators.email]),
    firstName: this.fb.nonNullable.control(this.data?.firstName ?? '', [Validators.required]),
    lastName: this.fb.nonNullable.control(this.data?.lastName ?? '', [Validators.required]),
    bio: [this.data?.bio ?? null],
  });

  constrcutor() {
    this.partnersStore.getPartners();
  }

  submitForm() {
    if (this.userForm.invalid) {
      return;
    }

    this.authStore.patch(this.userForm.getRawValue());
  }
}
