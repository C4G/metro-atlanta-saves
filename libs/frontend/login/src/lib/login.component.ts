import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import {
  AUTH_ALERT,
  AUTH_CONTROL,
  AUTH_ERROR,
  AUTH_LABEL,
  AUTH_LINK,
  AUTH_REVEAL,
  AUTH_SOLID,
  AuthCardComponent,
  authInputClass,
  focusFirstInvalid,
  GoogleMarkComponent,
} from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-login',
  imports: [AuthCardComponent, GoogleMarkComponent, MatIcon, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-auth-card
      headingId="login-title"
      icon="login"
      heading="Sign in to your account"
      subtitle="Enter the details connected to your account."
    >
      <form
        class="flex flex-col gap-3.5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
        #form="ngForm"
        [formGroup]="loginForm"
        (ngSubmit)="submitForm()"
        novalidate
      >
        @let email = loginForm.controls.email;
        @let password = loginForm.controls.password;
        @let emailError = form.submitted && email.invalid;
        @let passwordError = form.submitted && password.invalid;
        @if (form.submitted && loginForm.invalid) {
          <div [class]="alertClass" role="alert" aria-live="assertive">
            <mat-icon class="mas-icon-md shrink-0" aria-hidden="true">error</mat-icon>
            <p>
              <b class="block">A few details are missing</b>
              <span class="text-ink">Enter your email and password to sign in.</span>
            </p>
          </div>
        }

        <div class="flex flex-col gap-1.5">
          <label for="login-email" [class]="labelClass">Email address</label>
          <input
            id="login-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
            placeholder="name@example.com"
            [class]="inputClass(emailError)"
            [attr.aria-invalid]="emailError"
            [attr.aria-describedby]="emailError ? 'login-email-error' : null"
          />
          @if (emailError) {
            <p id="login-email-error" [class]="errorClass">
              <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
              {{ email.errors?.['required'] ? 'Enter your email address' : 'Enter an email like name@example.com' }}
            </p>
          }
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="login-password" [class]="labelClass">Password</label>
          <span class="relative block">
            <input
              id="login-password"
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Your password"
              [class]="inputClass(passwordError) + ' pr-24'"
              [attr.aria-invalid]="passwordError"
              [attr.aria-describedby]="passwordError ? 'login-password-error' : null"
            />
            <button
              type="button"
              [class]="revealClass"
              [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
              [attr.aria-pressed]="passwordVisible()"
              (click)="passwordVisible.set(!passwordVisible())"
            >
              <mat-icon class="mas-icon-sm" aria-hidden="true">
                {{ passwordVisible() ? 'visibility_off' : 'visibility' }}
              </mat-icon>
              {{ passwordVisible() ? 'Hide' : 'Show' }}
            </button>
          </span>
          @if (passwordError) {
            <p id="login-password-error" [class]="errorClass">
              <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
              {{ password.errors?.['required'] ? 'Enter your password' : 'Use at least 8 characters' }}
            </p>
          }
        </div>

        <div class="-mt-1.5 flex justify-end">
          <a routerLink="/forgot-password" [class]="linkClass + ' text-sm'">Forgot password?</a>
        </div>

        <button type="submit" [class]="solidClass">Sign in</button>

        <div class="flex items-center gap-3 text-xs font-bold text-ink-subtle" aria-hidden="true">
          <span class="h-px flex-1 bg-outline/70"></span>
          or
          <span class="h-px flex-1 bg-outline/70"></span>
        </div>

        <button type="button" [class]="controlClass" (click)="signInWithGoogle()">
          <mas-google-mark />
          Continue with Google
        </button>
      </form>

      <ng-container authFooter>
        Don’t have an account?
        <a routerLink="/register" [class]="linkClass">Create one</a>
      </ng-container>
    </mas-auth-card>
  `,
  host: { class: 'block' },
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);
  readonly passwordVisible = signal(false);
  readonly labelClass = AUTH_LABEL;
  readonly errorClass = AUTH_ERROR;
  readonly alertClass = AUTH_ALERT;
  readonly revealClass = AUTH_REVEAL;
  readonly linkClass = AUTH_LINK;
  readonly solidClass = AUTH_SOLID;
  readonly controlClass = AUTH_CONTROL;
  readonly inputClass = authInputClass;
  private fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

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

  submitForm(): void {
    const email = this.loginForm.controls.email.value.trim().toLowerCase();
    this.loginForm.controls.email.setValue(email);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      afterNextRender(() => focusFirstInvalid(this.host.nativeElement), { injector: this.injector });
      return;
    }

    this.authStore.login(this.loginForm.getRawValue());
  }
}
