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
  AUTH_HINT,
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
  selector: 'mas-register',
  imports: [AuthCardComponent, GoogleMarkComponent, MatIcon, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-auth-card
      headingId="register-title"
      icon="person_add"
      heading="Create your account"
      subtitle="Enter your details to join your program and community."
      [wide]="true"
    >
      <form
        class="flex flex-col gap-3.5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
        #form="ngForm"
        [formGroup]="registerForm"
        (ngSubmit)="submitForm()"
        novalidate
      >
        @let controls = registerForm.controls;
        @let showFirst = form.submitted && controls.firstName.invalid;
        @let showLast = form.submitted && controls.lastName.invalid;
        @let showEmail = form.submitted && controls.email.invalid;
        @let showPassword = form.submitted && controls.password.invalid;
        @if (form.submitted && registerForm.invalid) {
          <div [class]="alertClass" role="alert" aria-live="assertive">
            <mat-icon class="mas-icon-md shrink-0" aria-hidden="true">error</mat-icon>
            <p>
              <b class="block">A few details are missing</b>
              <span class="text-ink">Complete the highlighted fields to create your account.</span>
            </p>
          </div>
        }

        <div class="grid gap-3.5 sm:grid-cols-2 sm:gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="register-first-name" [class]="labelClass">First name</label>
            <input
              id="register-first-name"
              formControlName="firstName"
              autocomplete="given-name"
              [class]="inputClass(showFirst)"
              [attr.aria-invalid]="showFirst"
              [attr.aria-describedby]="showFirst ? 'register-first-name-error' : null"
            />
            @if (showFirst) {
              <p id="register-first-name-error" [class]="errorClass">
                <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
                Enter your first name
              </p>
            }
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="register-last-name" [class]="labelClass">Last name</label>
            <input
              id="register-last-name"
              formControlName="lastName"
              autocomplete="family-name"
              [class]="inputClass(showLast)"
              [attr.aria-invalid]="showLast"
              [attr.aria-describedby]="showLast ? 'register-last-name-error' : null"
            />
            @if (showLast) {
              <p id="register-last-name-error" [class]="errorClass">
                <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
                Enter your last name
              </p>
            }
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="register-email" [class]="labelClass">Email address</label>
          <input
            id="register-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
            placeholder="name@example.com"
            [class]="inputClass(showEmail)"
            [attr.aria-invalid]="showEmail"
            [attr.aria-describedby]="showEmail ? 'register-email-error' : null"
          />
          @if (showEmail) {
            <p id="register-email-error" [class]="errorClass">
              <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
              {{
                controls.email.errors?.['required']
                  ? 'Enter your email address'
                  : 'Enter an email like name@example.com'
              }}
            </p>
          }
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="register-password" [class]="labelClass">Password</label>
          <span class="relative block">
            <input
              id="register-password"
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
              placeholder="At least 8 characters"
              [class]="inputClass(showPassword) + ' pr-24'"
              [attr.aria-invalid]="showPassword"
              [attr.aria-describedby]="showPassword ? 'register-password-error' : 'register-password-hint'"
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
          @if (showPassword) {
            <p id="register-password-error" [class]="errorClass">
              <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
              {{ controls.password.errors?.['required'] ? 'Enter a password' : 'Use at least 8 characters' }}
            </p>
          } @else {
            <p id="register-password-hint" [class]="hintClass">Use at least 8 characters.</p>
          }
        </div>

        <button type="submit" [class]="solidClass" [disabled]="!isInteractive()">Create account</button>

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
        Already have an account?
        <a routerLink="/login" [class]="linkClass">Sign in</a>
      </ng-container>
    </mas-auth-card>
  `,
  host: { class: 'block' },
})
export class RegisterComponent {
  readonly authStore = inject(AuthStore);
  readonly isInteractive = signal(false);
  readonly passwordVisible = signal(false);
  readonly labelClass = AUTH_LABEL;
  readonly errorClass = AUTH_ERROR;
  readonly hintClass = AUTH_HINT;
  readonly alertClass = AUTH_ALERT;
  readonly revealClass = AUTH_REVEAL;
  readonly linkClass = AUTH_LINK;
  readonly solidClass = AUTH_SOLID;
  readonly controlClass = AUTH_CONTROL;
  readonly inputClass = authInputClass;
  private fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
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
      afterNextRender(() => focusFirstInvalid(this.host.nativeElement), { injector: this.injector });
      return;
    }
    this.authStore.register(this.registerForm.getRawValue());
  }
}
