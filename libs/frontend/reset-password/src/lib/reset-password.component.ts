import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-reset-password',
  imports: [FooterComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col px-6 max-w-3xl mx-auto p-6">
      <h2 class="text-2xl font-bold mb-3">{{ set() ? 'Set' : 'Reset' }} Password</h2>
      <form class="flex flex-col gap-4" #form="ngForm" [formGroup]="resetPasswordForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
          @if (
            (resetPasswordForm.get('password')?.touched || form.submitted) &&
            resetPasswordForm.get('password')?.errors?.['required']
          ) {
            <mat-error>Password is required.</mat-error>
          }
          @if (
            (resetPasswordForm.get('password')?.touched || form.submitted) &&
            resetPasswordForm.get('password')?.errors?.['minlength']
          ) {
            <mat-error>Password must be at least 8 characters long.</mat-error>
          }
        </mat-form-field>
        <div class="flex justify-center actions">
          <button mat-raised-button color="primary" type="submit">{{ set() ? 'Set' : 'Reset' }} Password</button>
        </div>
      </form>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class ResetPasswordComponent {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  email = input('');
  token = input('');
  set = input('');

  resetPasswordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  emailAndTokenEffect = effect(() => {
    const email = this.email();
    const token = this.token();

    untracked(() => {
      if (!email || !token) {
        this.snackBar.open('Missing email or token, please click the link in your email', undefined, {
          panelClass: 'error',
          duration: 5000,
        });
        this.router.navigate(['/']);
      }
    });
  });

  submitForm() {
    if (this.resetPasswordForm.invalid || !this.email() || !this.token()) {
      return;
    }

    this.authStore.resetPassword({ ...this.resetPasswordForm.getRawValue(), email: this.email(), token: this.token() });
  }
}
