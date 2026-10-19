import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-forgot-password',
  imports: [MatError, MatFormField, MatInput, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-canvas px-4 py-8 text-ink sm:px-6 sm:py-12 lg:px-8 lg:py-16"
      aria-labelledby="forgot-password-title"
    >
      <div class="mx-auto max-w-xl overflow-hidden rounded-3xl border border-outline bg-surface-raised">
        <div class="h-1.5 bg-brand" aria-hidden="true"></div>
        <section class="px-5 py-8 sm:px-10 sm:py-10">
          <div class="mb-7">
            <p class="text-sm font-bold text-brand-strong">Account recovery</p>
            <h1
              id="forgot-password-title"
              class="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
            >
              Reset your password
            </h1>
            <p class="mt-3 text-sm leading-6 text-ink-muted">
              Enter the email connected to your account and we’ll send you instructions to reset your password.
            </p>
          </div>

          <form class="flex flex-col" #form="ngForm" [formGroup]="forgotPasswordForm" (ngSubmit)="submitForm()">
            @if (form.submitted && forgotPasswordForm.invalid) {
              <div
                class="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
                aria-live="assertive"
              >
                <p class="font-bold">Please enter your email address.</p>
                <p class="mt-1 leading-5">Use the email connected to your member account.</p>
              </div>
            }

            <label for="recovery-email" class="mb-2 text-sm font-bold text-ink">Email address</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                id="recovery-email"
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
                inputmode="email"
                placeholder="name@example.com"
              />
              @if (
                ((forgotPasswordForm.controls.email.touched && forgotPasswordForm.controls.email.dirty) ||
                  form.submitted) &&
                forgotPasswordForm.controls.email.errors?.['required']
              ) {
                <mat-error>Email is required.</mat-error>
              }
              @if (
                ((forgotPasswordForm.controls.email.touched && forgotPasswordForm.controls.email.dirty) ||
                  form.submitted) &&
                forgotPasswordForm.controls.email.errors?.['email']
              ) {
                <mat-error>Please enter a valid email address.</mat-error>
              }
            </mat-form-field>

            <button
              type="submit"
              class="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
            >
              Send reset instructions
            </button>
          </form>

          <p class="mt-7 border-t border-outline pt-6 text-center text-sm text-ink-muted">
            Remembered your password?
            <a
              routerLink="/login"
              class="ml-1 rounded-lg font-bold text-brand-strong underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Return to sign in
            </a>
          </p>
          <p class="mt-3 text-center text-sm text-ink-muted">
            Don’t have an account?
            <a
              routerLink="/register"
              class="ml-1 rounded-lg font-bold text-brand-strong underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Create one
            </a>
          </p>
        </section>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class ForgotPasswordComponent {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  forgotPasswordForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submitForm(): void {
    const email = this.forgotPasswordForm.controls.email.value.trim().toLowerCase();
    this.forgotPasswordForm.controls.email.setValue(email);
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    this.authStore.forgotPassword(this.forgotPasswordForm.getRawValue());
  }
}
