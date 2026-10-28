import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-reset-password',
  imports: [MatError, MatFormField, MatInput, MatSuffix, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-canvas px-4 py-8 text-ink sm:px-6 sm:py-12 lg:px-8 lg:py-16"
      aria-labelledby="reset-password-title"
    >
      <div class="mx-auto max-w-xl overflow-hidden rounded-3xl border border-outline bg-surface-raised">
        <div class="h-1.5 bg-brand" aria-hidden="true"></div>
        <section class="px-5 py-8 sm:px-10 sm:py-10">
          <p class="text-sm font-bold text-brand-strong">Account recovery</p>
          <h1 id="reset-password-title" class="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {{ set() ? 'Set your password' : 'Choose a new password' }}
          </h1>
          @if (hasValidLink()) {
            <p class="mt-3 text-sm leading-6 text-ink-muted">
              Use at least 8 characters and choose a password you do not use elsewhere.
            </p>
            <form class="mt-7 flex flex-col" #form="ngForm" [formGroup]="resetPasswordForm" (ngSubmit)="submitForm()">
              @if (form.submitted && resetPasswordForm.invalid) {
                <p
                  role="alert"
                  class="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                >
                  Review the highlighted fields before saving your password.
                </p>
              }
              <label for="reset-password" class="mb-2 text-sm font-bold">New password</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  id="reset-password"
                  matInput
                  [type]="passwordVisible() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                />
                <button
                  matSuffix
                  type="button"
                  class="mr-2 min-h-11 rounded-lg px-2 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                  [attr.aria-label]="passwordVisible() ? 'Hide passwords' : 'Show passwords'"
                  [attr.aria-pressed]="passwordVisible()"
                  (click)="passwordVisible.set(!passwordVisible())"
                >
                  {{ passwordVisible() ? 'Hide' : 'Show' }}
                </button>
                @if (
                  (resetPasswordForm.controls.password.touched || form.submitted) &&
                  resetPasswordForm.controls.password.errors?.['required']
                ) {
                  <mat-error>Password is required.</mat-error>
                }
                @if (
                  (resetPasswordForm.controls.password.touched || form.submitted) &&
                  resetPasswordForm.controls.password.errors?.['minlength']
                ) {
                  <mat-error>Password must be at least 8 characters long.</mat-error>
                }
              </mat-form-field>
              <label for="reset-confirm-password" class="mb-2 mt-1 text-sm font-bold">Confirm new password</label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  id="reset-confirm-password"
                  matInput
                  [type]="passwordVisible() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Enter your password again"
                  [attr.aria-describedby]="
                    (resetPasswordForm.controls.confirmPassword.touched || form.submitted) &&
                    resetPasswordForm.errors?.['passwordMismatch']
                      ? 'password-match-help'
                      : null
                  "
                  [attr.aria-invalid]="
                    (resetPasswordForm.controls.confirmPassword.touched || form.submitted) &&
                    !!resetPasswordForm.errors?.['passwordMismatch']
                  "
                />
                @if (
                  (resetPasswordForm.controls.confirmPassword.touched || form.submitted) &&
                  resetPasswordForm.controls.confirmPassword.errors?.['required']
                ) {
                  <mat-error>Confirm your new password.</mat-error>
                }
              </mat-form-field>
              @if (
                (resetPasswordForm.controls.confirmPassword.touched || form.submitted) &&
                resetPasswordForm.errors?.['passwordMismatch']
              ) {
                <p id="password-match-help" role="alert" class="mb-3 text-sm text-danger">
                  The passwords do not match.
                </p>
              }
              <button
                type="submit"
                class="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {{ set() ? 'Set password' : 'Reset password' }}
              </button>
            </form>
          } @else {
            <div role="alert" class="mt-6 rounded-xl border border-outline bg-surface-subtle p-4">
              <h2 class="font-bold">Request a new password link</h2>
              <p class="mt-2 text-sm leading-6 text-ink-muted">
                This link is missing or invalid. Use the complete link from your email, or request another one.
              </p>
              <a
                routerLink="/forgot-password"
                class="mt-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Request reset instructions
              </a>
            </div>
          }
          <p class="mt-7 border-t border-outline pt-6 text-center text-sm text-ink-muted">
            <a
              routerLink="/login"
              class="inline-flex min-h-11 items-center rounded-lg px-2 font-bold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Return to sign in
            </a>
          </p>
        </section>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class ResetPasswordComponent {
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  readonly token = input('');
  readonly set = input('');
  readonly error = input('');
  readonly passwordVisible = signal(false);
  readonly hasValidLink = computed(() => !!this.token() && !this.error());
  readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (control) =>
        control.get('password')?.value === control.get('confirmPassword')?.value ? null : { passwordMismatch: true },
    },
  );

  submitForm(): void {
    if (!this.hasValidLink()) return;
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    this.authStore.resetPassword({ password: this.resetPasswordForm.controls.password.value, token: this.token() });
  }
}
