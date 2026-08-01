import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { Role, User } from '@prisma/client';
import { MatIcon } from '@angular/material/icon';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { PartnersStore, UsersStore } from '@mas/frontend-shared-data-access';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-add-user',
  imports: [
    MatDialogModule,
    MatInput,
    MatButtonModule,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatIcon,
    MatOption,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} User</h2>
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
          @if (authStore.user()?.role === 'Administrator') {
            <mat-form-field class="w-full">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option [value]="null">None</mat-option>
                @for (role of roleChoices(); track role) {
                  <mat-option [value]="role">{{ role }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field class="w-full">
              <mat-label>Partner</mat-label>
              <mat-select formControlName="partnerId">
                <mat-form-field class="w-full">
                  <input matInput type="text" [formControl]="search" placeholder="Search" />
                  @if (search.value) {
                    <button matSuffix mat-icon-button aria-label="Clear" (click)="search.setValue('')">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </mat-form-field>
                <mat-option [value]="null">None</mat-option>
                @for (partner of visiblePartners(); track partner.id) {
                  <mat-option [value]="partner.id">{{ partner.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
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
export class AddUserComponent {
  private fb = inject(FormBuilder);
  private usersStore = inject(UsersStore);
  private partnersStore = inject(PartnersStore);

  authStore = inject(AuthStore);
  search = this.fb.control('');
  data = inject<User | null>(MAT_DIALOG_DATA);

  roleChoices = signal<Role[]>(['Administrator', 'Partner_Staff']);
  searchSignal = toSignal(this.search.valueChanges);
  userForm = this.fb.group({
    email: this.fb.nonNullable.control(this.data?.email ?? '', [Validators.required, Validators.email]),
    firstName: this.fb.nonNullable.control(this.data?.firstName ?? '', [Validators.required]),
    lastName: this.fb.nonNullable.control(this.data?.lastName ?? '', [Validators.required]),
    partnerId: [this.data?.partnerId ?? null],
    role: this.fb.control<Role | null>(this.data?.role ?? null),
  });

  visiblePartners = computed(() =>
    this.partnersStore
      .partners()
      .filter((partner) => (this.searchSignal() ? partner.name.includes(this.searchSignal() ?? '') : partner.name)),
  );

  constructor() {
    this.partnersStore.getPartners();
  }

  submitForm() {
    if (this.userForm.invalid) {
      return;
    }

    if (this.data) {
      this.usersStore.patchUser({
        id: this.data.id,
        ...this.userForm.getRawValue(),
      });

      return;
    }

    const addUserData = this.userForm.getRawValue();

    this.usersStore.addUser(addUserData);
  }
}
