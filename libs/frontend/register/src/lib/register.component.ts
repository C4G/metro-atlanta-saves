import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-register',
  imports: [MatError, MatFormField, MatInput, MatSuffix, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-canvas px-4 py-8 text-ink sm:px-6 sm:py-12 lg:px-8 lg:py-16" aria-labelledby="register-title">
      <div class="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-outline bg-surface-raised">
        <div class="h-1.5 bg-brand" aria-hidden="true"></div>
        <section class="px-5 py-8 sm:px-10 sm:py-10" aria-label="Create an account">
          <div class="mb-7">
            <p class="text-sm font-bold text-brand-strong">Member portal</p>
            <h1 id="register-title" class="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Create your account
            </h1>
            <p class="mt-3 text-sm leading-6 text-ink-muted">Enter your details to join your program and community.</p>
          </div>

          <form class="flex flex-col" #form="ngForm" [formGroup]="registerForm" (ngSubmit)="submitForm()">
            @if (form.submitted && registerForm.invalid) {
              <div
                class="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
                aria-live="assertive"
              >
                <p class="font-bold">Please review your information.</p>
                <p class="mt-1 leading-5">Complete the highlighted fields before creating your account.</p>
              </div>
            }

            <div class="grid gap-x-4 sm:grid-cols-2">
              <div class="flex flex-col">
                <label for="register-first-name" class="mb-2 text-sm font-bold text-ink">First name</label>
                <mat-form-field appearance="outline" class="w-full">
                  <input
                    id="register-first-name"
                    matInput
                    formControlName="firstName"
                    autocomplete="given-name"
                    placeholder="First name"
                  />
                  @if (
                    ((registerForm.controls.firstName.touched && registerForm.controls.firstName.dirty) ||
                      form.submitted) &&
                    registerForm.controls.firstName.errors?.['required']
                  ) {
                    <mat-error>First name is required.</mat-error>
                  }
                </mat-form-field>
              </div>
              <div class="flex flex-col">
                <label for="register-last-name" class="mb-2 text-sm font-bold text-ink">Last name</label>
                <mat-form-field appearance="outline" class="w-full">
                  <input
                    id="register-last-name"
                    matInput
                    formControlName="lastName"
                    autocomplete="family-name"
                    placeholder="Last name"
                  />
                  @if (
                    ((registerForm.controls.lastName.touched && registerForm.controls.lastName.dirty) ||
                      form.submitted) &&
                    registerForm.controls.lastName.errors?.['required']
                  ) {
                    <mat-error>Last name is required.</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <label for="register-email" class="mb-2 text-sm font-bold text-ink">Email address</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                id="register-email"
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
                inputmode="email"
                placeholder="name@example.com"
              />
              @if (
                ((registerForm.controls.email.touched && registerForm.controls.email.dirty) || form.submitted) &&
                registerForm.controls.email.errors?.['required']
              ) {
                <mat-error>Email is required.</mat-error>
              }
              @if (
                ((registerForm.controls.email.touched && registerForm.controls.email.dirty) || form.submitted) &&
                registerForm.controls.email.errors?.['email']
              ) {
                <mat-error>Please enter a valid email address.</mat-error>
              }
            </mat-form-field>

            <label for="register-password" class="mb-2 mt-1 text-sm font-bold text-ink">Password</label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                id="register-password"
                matInput
                [type]="passwordVisible() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="At least 8 characters"
              />
              <button
                matSuffix
                type="button"
                class="mr-2 min-h-11 rounded-lg px-2 py-1 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
                [attr.aria-pressed]="passwordVisible()"
                (click)="passwordVisible.set(!passwordVisible())"
              >
                {{ passwordVisible() ? 'Hide' : 'Show' }}
              </button>
              @if (
                ((registerForm.controls.password.touched && registerForm.controls.password.dirty) || form.submitted) &&
                registerForm.controls.password.errors?.['required']
              ) {
                <mat-error>Password is required.</mat-error>
              }
              @if (
                ((registerForm.controls.password.touched && registerForm.controls.password.dirty) || form.submitted) &&
                registerForm.controls.password.errors?.['minlength']
              ) {
                <mat-error>Password must be at least 8 characters long.</mat-error>
              }
            </mat-form-field>

            <button
              type="submit"
              [disabled]="!isInteractive()"
              class="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
            >
              Create account
            </button>
          </form>

          <div class="my-7 flex items-center gap-3" aria-hidden="true">
            <span class="h-px flex-1 bg-outline"></span>
            <span class="text-xs font-semibold text-ink-subtle">or</span>
            <span class="h-px flex-1 bg-outline"></span>
          </div>
          <button
            type="button"
            class="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
            (click)="signInWithGoogle()"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285f4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
              />
              <path
                fill="#34a853"
                d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.77-5.61-4.14H3.04v2.62A10 10 0 0 0 12 22Z"
              />
              <path
                fill="#fbbc05"
                d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.54l3.35-2.62Z"
              />
              <path
                fill="#ea4335"
                d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
          <p class="mt-7 border-t border-outline pt-6 text-center text-sm text-ink-muted">
            Already have an account?
            <a
              routerLink="/login"
              class="ml-1 rounded-lg font-bold text-brand-strong underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
            >
              Sign in
            </a>
          </p>
        </section>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class RegisterComponent {
  readonly authStore = inject(AuthStore);
  readonly isInteractive = signal(false);
  readonly passwordVisible = signal(false);
  private fb = inject(FormBuilder);
  registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  constructor() {
    afterNextRender(() => this.isInteractive.set(true));
    void this.authStore.initializeGoogle('register');
  }
  signInWithGoogle(): void {
    void this.authStore.signInWithGoogle('register');
  }
  submitForm(): void {
    const email = this.registerForm.controls.email.value.trim().toLowerCase();
    this.registerForm.controls.email.setValue(email);
    this.registerForm.controls.firstName.setValue(this.registerForm.controls.firstName.value.trim());
    this.registerForm.controls.lastName.setValue(this.registerForm.controls.lastName.value.trim());
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.authStore.register(this.registerForm.getRawValue());
  }
}
