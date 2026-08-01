import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatError } from '@angular/material/input';
import { AuthStore } from '@mas/frontend-shared-auth';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { SearchableDropdownComponent } from '../searchable-dropdown';

@Component({
  selector: 'mas-mimic-user-modal',
  imports: [MatDialogModule, MatButton, ReactiveFormsModule, MatError, SearchableDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Mimic User</h2>
    <form #form="ngForm" [formGroup]="mimicForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 gap-4">
          @if (formattedUsers().length > 0) {
            <mas-searchable-dropdown
              formControlName="email"
              [items]="formattedUsers()"
              label="User"
              [required]="true"
            />
            @if ((mimicForm.get('email')?.touched || form.submitted) && mimicForm.get('email')?.errors?.['required']) {
              <mat-error>User is required.</mat-error>
            }
          } @else {
            <div class="p-4 text-center">
              <p>No users available to mimic.</p>
            </div>
          }
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        @if (formattedUsers().length > 0) {
          <button mat-raised-button color="primary" type="submit">Mimic</button>
        }
      </mat-dialog-actions>
    </form>
  `,
})
export class MimicUserModalComponent {
  private fb = inject(NonNullableFormBuilder);
  private authStore = inject(AuthStore);
  private usersStore = inject(UsersStore);

  constructor() {
    this.usersStore.getUsers();
  }

  mimicForm = this.fb.group({
    email: ['', [Validators.required]],
  });

  formattedUsers = computed(() => {
    const currentUser = this.authStore.user();

    return this.usersStore
      .users()
      .filter((user) => user.email !== currentUser?.email) // Filter out current user
      .map((user) => ({ label: `${user.firstName} ${user.lastName} (${user.email})`, value: user.email }));
  });

  submitForm() {
    if (this.mimicForm.invalid) {
      return;
    }

    this.authStore.mimicUser(this.mimicForm.getRawValue().email);
  }
}
