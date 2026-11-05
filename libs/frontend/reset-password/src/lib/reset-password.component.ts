import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import {
  AUTH_ALERT,
  AUTH_ERROR,
  AUTH_LABEL,
  AUTH_LINK,
  AUTH_REVEAL,
  AUTH_SOLID,
  AuthCardComponent,
  authInputClass,
  focusFirstInvalid,
} from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-reset-password',
  imports: [AuthCardComponent, MatIcon, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasValidLink()) {
      <mas-auth-card
        headingId="reset-password-title"
        icon="password"
        [heading]="set() ? 'Set your password' : 'Choose a new password'"
        subtitle="Use at least 8 characters and choose a password you don’t use elsewhere."
      >
        <form
          class="flex flex-col gap-3.5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
          #form="ngForm"
          [formGroup]="resetPasswordForm"
          (ngSubmit)="submitForm()"
          novalidate
        >
          @let password = resetPasswordForm.controls.password;
          @let confirm = resetPasswordForm.controls.confirmPassword;
          @let passwordError = form.submitted && password.invalid;
          @let confirmError = form.submitted && (confirm.invalid || !!resetPasswordForm.errors?.['passwordMismatch']);
          @if (form.submitted && resetPasswordForm.invalid) {
            <div [class]="alertClass" role="alert" aria-live="assertive">
              <mat-icon class="mas-icon-md shrink-0" aria-hidden="true">error</mat-icon>
              <p>
                <b class="block">Check your new password</b>
                <span class="text-ink">Review the highlighted fields before saving your password.</span>
              </p>
            </div>
          }

          <div class="flex flex-col gap-1.5">
            <label for="reset-password" [class]="labelClass">New password</label>
            <span class="relative block">
              <input
                id="reset-password"
                [type]="passwordVisible() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                [class]="inputClass(passwordError) + ' pr-24'"
                [attr.aria-invalid]="passwordError"
                [attr.aria-describedby]="passwordError ? 'reset-password-error' : null"
              />
              <button
                type="button"
                [class]="revealClass"
                [attr.aria-label]="passwordVisible() ? 'Hide passwords' : 'Show passwords'"
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
              <p id="reset-password-error" [class]="errorClass">
                <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
                {{ password.errors?.['required'] ? 'Enter a new password' : 'Use at least 8 characters' }}
              </p>
            }
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="reset-confirm-password" [class]="labelClass">Confirm new password</label>
            <input
              id="reset-confirm-password"
              [type]="passwordVisible() ? 'text' : 'password'"
              formControlName="confirmPassword"
              autocomplete="new-password"
              placeholder="Enter it again"
              [class]="inputClass(confirmError)"
              [attr.aria-invalid]="confirmError"
              [attr.aria-describedby]="confirmError ? 'reset-confirm-error' : null"
            />
            @if (confirmError) {
              <p id="reset-confirm-error" [class]="errorClass">
                <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
                {{ confirm.errors?.['required'] ? 'Enter the new password again' : 'The passwords don’t match' }}
              </p>
            }
          </div>

          <button type="submit" [class]="solidClass">{{ set() ? 'Set password' : 'Reset password' }}</button>
        </form>
        <a authFooter routerLink="/login" [class]="linkClass">Back to sign in</a>
      </mas-auth-card>
    } @else {
      <mas-auth-card headingId="reset-password-title">
        <div class="flex flex-col items-center gap-3 px-4 pb-6 pt-7 text-center sm:px-6" role="alert">
          <span
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-warn-soft text-warn-ink"
            aria-hidden="true"
          >
            <mat-icon class="mas-icon-md">link_off</mat-icon>
          </span>
          <h1 id="reset-password-title" class="font-serif text-2xl font-semibold tracking-tight">
            This link doesn’t work
          </h1>
          <p class="max-w-sm text-sm leading-6 text-ink-muted">
            This link is missing or invalid. Use the complete link from your email, or request another one.
          </p>
          <a routerLink="/forgot-password" [class]="solidClass + ' mt-1.5'">Request a new link</a>
        </div>
        <a authFooter routerLink="/login" [class]="linkClass">Back to sign in</a>
      </mas-auth-card>
    }
  `,
  host: { class: 'block' },
})
export class ResetPasswordComponent {
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  readonly token = input('');
  readonly set = input('');
  readonly error = input('');
  readonly passwordVisible = signal(false);
  readonly hasValidLink = computed(() => !!this.token() && !this.error());
  readonly labelClass = AUTH_LABEL;
  readonly errorClass = AUTH_ERROR;
  readonly alertClass = AUTH_ALERT;
  readonly revealClass = AUTH_REVEAL;
  readonly linkClass = AUTH_LINK;
  readonly solidClass = AUTH_SOLID;
  readonly inputClass = authInputClass;
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
      afterNextRender(() => focusFirstInvalid(this.host.nativeElement), { injector: this.injector });
      return;
    }
    this.authStore.resetPassword({ password: this.resetPasswordForm.controls.password.value, token: this.token() });
  }
}
