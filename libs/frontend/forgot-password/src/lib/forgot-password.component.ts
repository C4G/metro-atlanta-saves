import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { FooterComponent } from '@mas/frontend-shared-layout';

@Component({
  selector: 'mas-forgot-password',
  imports: [
    FooterComponent,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col px-6 max-w-3xl mx-auto p-6">
      <h2 class="text-2xl font-bold mb-3">Forgot Password</h2>
      <form class="flex flex-col gap-4" #form="ngForm" [formGroup]="forgotPasswordForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" />
          @if (
            (forgotPasswordForm.get('email')?.touched || form.submitted) &&
            forgotPasswordForm.get('email')?.errors?.['required']
          ) {
            <mat-error>Email is required.</mat-error>
          }
          @if (
            (forgotPasswordForm.get('email')?.touched || form.submitted) &&
            forgotPasswordForm.get('email')?.errors?.['email']
          ) {
            <mat-error>Please enter a valid email address.</mat-error>
          }
        </mat-form-field>
        <div class="flex justify-center actions">
          <button mat-raised-button color="primary" type="submit">Request Password Reset</button>
        </div>
      </form>
      <a routerLink="/register" class="underline underline-offset-4 text-center cursor-pointer mt-4 mb-4">
        Don't have an account? Sign Up
      </a>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class ForgotPasswordComponent {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitForm() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.authStore.forgotPassword(this.forgotPasswordForm.getRawValue());
  }
}
