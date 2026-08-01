import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-register',
  imports: [
    FooterComponent,
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
      <h2 class="text-2xl font-bold mb-3">Register</h2>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="registerForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <mat-label>First Name</mat-label>
          <input matInput formControlName="firstName" />
          @if (
            (registerForm.get('firstName')?.touched || form.submitted) &&
            registerForm.get('firstName')?.errors?.['required']
          ) {
            <mat-error>First name is required.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="lastName" />
          @if (
            (registerForm.get('lastName')?.touched || form.submitted) &&
            registerForm.get('lastName')?.errors?.['required']
          ) {
            <mat-error>Last name is required.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" />
          @if (
            (registerForm.get('email')?.touched || form.submitted) && registerForm.get('email')?.errors?.['required']
          ) {
            <mat-error>Email is required.</mat-error>
          }
          @if ((registerForm.get('email')?.touched || form.submitted) && registerForm.get('email')?.errors?.['email']) {
            <mat-error>Please enter a valid email address.</mat-error>
          }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
          @if (
            (registerForm.get('password')?.touched || form.submitted) &&
            registerForm.get('password')?.errors?.['required']
          ) {
            <mat-error>Password is required.</mat-error>
          }
          @if (
            (registerForm.get('password')?.touched || form.submitted) &&
            registerForm.get('password')?.errors?.['minlength']
          ) {
            <mat-error>Password must be at least 8 characters long.</mat-error>
          }
        </mat-form-field>
        <div class="flex justify-center actions">
          <button mat-raised-button color="primary" type="submit">Register</button>
        </div>
      </form>
      <a routerLink="/login" class="underline underline-offset-4 text-center cursor-pointer mt-4 mb-4">
        Already have an account? Login
      </a>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class RegisterComponent {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  submitForm() {
    if (this.registerForm.invalid) {
      return;
    }

    const registrationData = this.registerForm.getRawValue();
    registrationData.email = registrationData.email.trim().toLowerCase();

    this.authStore.register(registrationData);
  }
}
