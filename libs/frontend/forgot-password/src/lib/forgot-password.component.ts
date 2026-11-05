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
  AUTH_SOLID,
  AuthCardComponent,
  authInputClass,
  focusFirstInvalid,
} from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-forgot-password',
  imports: [AuthCardComponent, MatIcon, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sentTo(); as email) {
      <mas-auth-card headingId="forgot-password-title">
        <div class="flex flex-col items-center gap-3 px-4 pb-6 pt-7 text-center sm:px-6" role="status">
          <span
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft/80 text-brand-strong"
            aria-hidden="true"
          >
            <mat-icon class="mas-icon-md">mark_email_read</mat-icon>
          </span>
          <h1 id="forgot-password-title" class="font-serif text-2xl font-semibold tracking-tight">Check your email</h1>
          <p class="max-w-sm text-sm leading-6 text-ink-muted">
            If an account uses
            <b class="text-ink">{{ email }}</b>
            , we sent a link to reset your password.
          </p>
          <div class="mt-1.5 flex w-full flex-col gap-2">
            <a routerLink="/login" [class]="solidClass">Back to sign in</a>
            <button type="button" [class]="controlClass" (click)="useDifferentEmail()">Use a different email</button>
          </div>
          <p class="text-xs leading-5 text-ink-muted">
            @if (resent()) {
              We sent the link again.
            } @else {
              Didn’t get it? Check your spam folder, or
              <button type="button" [class]="linkClass" (click)="sendAgain(email)">send it again</button>
              .
            }
          </p>
        </div>
        <ng-container authFooter>
          Don’t have an account?
          <a routerLink="/register" [class]="linkClass">Create one</a>
        </ng-container>
      </mas-auth-card>
    } @else {
      <mas-auth-card
        headingId="forgot-password-title"
        icon="lock_reset"
        heading="Reset your password"
        subtitle="Enter the email connected to your account and we’ll send you a link to reset your password."
      >
        <form
          class="flex flex-col gap-3.5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5"
          #form="ngForm"
          [formGroup]="forgotPasswordForm"
          (ngSubmit)="submitForm()"
          novalidate
        >
          @let email = forgotPasswordForm.controls.email;
          @let emailError = form.submitted && email.invalid;
          @if (form.submitted && forgotPasswordForm.invalid) {
            <div [class]="alertClass" role="alert" aria-live="assertive">
              <mat-icon class="mas-icon-md shrink-0" aria-hidden="true">error</mat-icon>
              <p>
                <b class="block">A few details are missing</b>
                <span class="text-ink">Enter the email connected to your account.</span>
              </p>
            </div>
          }
          <div class="flex flex-col gap-1.5">
            <label for="recovery-email" [class]="labelClass">Email address</label>
            <input
              id="recovery-email"
              type="email"
              formControlName="email"
              autocomplete="email"
              inputmode="email"
              placeholder="name@example.com"
              [class]="inputClass(emailError)"
              [attr.aria-invalid]="emailError"
              [attr.aria-describedby]="emailError ? 'recovery-email-error' : null"
            />
            @if (emailError) {
              <p id="recovery-email-error" [class]="errorClass">
                <mat-icon class="mas-icon-sm" aria-hidden="true">error</mat-icon>
                {{ email.errors?.['required'] ? 'Enter your email address' : 'Enter an email like name@example.com' }}
              </p>
            }
          </div>
          <button type="submit" [class]="solidClass">Send reset link</button>
        </form>
        <ng-container authFooter>
          Remembered your password?
          <a routerLink="/login" [class]="linkClass">Back to sign in</a>
        </ng-container>
      </mas-auth-card>
    }
  `,
  host: { class: 'block' },
})
export class ForgotPasswordComponent {
  private authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  readonly sentTo = signal('');
  readonly resent = signal(false);
  readonly labelClass = AUTH_LABEL;
  readonly errorClass = AUTH_ERROR;
  readonly alertClass = AUTH_ALERT;
  readonly linkClass = AUTH_LINK;
  readonly solidClass = AUTH_SOLID;
  readonly controlClass = AUTH_CONTROL;
  readonly inputClass = authInputClass;
  forgotPasswordForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submitForm(): void {
    const email = this.forgotPasswordForm.controls.email.value.trim().toLowerCase();
    this.forgotPasswordForm.controls.email.setValue(email);
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      afterNextRender(() => focusFirstInvalid(this.host.nativeElement), { injector: this.injector });
      return;
    }
    this.authStore.forgotPassword({
      email,
      onSent: () => {
        this.resent.set(false);
        this.sentTo.set(email);
      },
    });
  }

  sendAgain(email: string): void {
    this.authStore.forgotPassword({ email, onSent: () => this.resent.set(true) });
  }

  useDifferentEmail(): void {
    this.sentTo.set('');
    this.forgotPasswordForm.reset({ email: '' });
  }
}
