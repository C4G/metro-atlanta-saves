import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-login',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col px-6 max-w-3xl mx-auto p-6">
      <h2 class="text-2xl font-bold mb-3">Login</h2>
      <form class="flex flex-col gap-4" #form="ngForm" [formGroup]="loginForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" />
          @if ((loginForm.get('email')?.touched || form.submitted) && loginForm.get('email')?.errors?.['required']) {
            <mat-error>Email is required.</mat-error>
          }
          @if ((loginForm.get('email')?.touched || form.submitted) && loginForm.get('email')?.errors?.['email']) {
            <mat-error>Please enter a valid email address.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
          @if (
            (loginForm.get('password')?.touched || form.submitted) && loginForm.get('password')?.errors?.['required']
          ) {
            <mat-error>Password is required.</mat-error>
          }
          @if (
            (loginForm.get('password')?.touched || form.submitted) && loginForm.get('password')?.errors?.['minlength']
          ) {
            <mat-error>Password must be at least 8 characters long.</mat-error>
          }
        </mat-form-field>
        <div class="flex justify-center actions">
          <button mat-raised-button color="primary" type="submit">Login</button>
        </div>
      </form>
      @if (authStore.googleClientId()) {
        <div class="flex justify-center mt-4">
          <button mat-stroked-button type="button" (click)="signInWithGoogle()">Continue with Google</button>
        </div>
      }
      <a routerLink="/register" class="underline underline-offset-4 text-center cursor-pointer mt-4 mb-4">
        Don't have an account? Sign Up
      </a>
      <a routerLink="/forgot-password" class="underline underline-offset-4 text-center cursor-pointer mt-4 mb-4">
        Forgot your password? Reset Now
      </a>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    void this.authStore.initializeGoogle('login');
  }

  signInWithGoogle(): void {
    void this.authStore.signInWithGoogle('login');
  }

  submitForm() {
    if (this.loginForm.invalid) {
      return;
    }
    const loginData = this.loginForm.getRawValue();
    loginData.email = loginData.email.trim().toLowerCase();

    this.authStore.login(loginData);
  }
}
