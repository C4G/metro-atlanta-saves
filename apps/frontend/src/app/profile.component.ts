import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-profile',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIcon, MatInputModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="profile-page min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-6xl">
        <a
          routerLink="/dashboard"
          class="profile-back-link inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_back</mat-icon>
          Dashboard
        </a>

        <header class="profile-hero mt-4 rounded-2xl px-5 py-6 sm:px-7 sm:py-8">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <span class="profile-avatar">{{ authStore.initials() }}</span>
              <div class="min-w-0">
                <p class="profile-kicker">Your account</p>
                <h1 class="truncate text-2xl font-bold tracking-tight sm:text-3xl">Profile & preferences</h1>
                <p class="mt-1 text-sm leading-6">
                  Keep your contact details current so your program team can reach you.
                </p>
              </div>
            </div>
            <span class="profile-role-badge">{{ roleLabel() }}</span>
          </div>
        </header>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <form class="profile-card" [formGroup]="profileForm" (ngSubmit)="save()">
            <div class="profile-card-header">
              <div>
                <h2>Personal information</h2>
                <p>These details appear to your program team and in relevant platform spaces.</p>
              </div>
            </div>
            <div class="grid gap-x-4 sm:grid-cols-2">
              <mat-form-field appearance="outline">
                <mat-label>First name</mat-label>
                <input matInput formControlName="firstName" autocomplete="given-name" />
                @if (profileForm.controls.firstName.touched && profileForm.controls.firstName.invalid) {
                  <mat-error>First name is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last name</mat-label>
                <input matInput formControlName="lastName" autocomplete="family-name" />
                @if (profileForm.controls.lastName.touched && profileForm.controls.lastName.invalid) {
                  <mat-error>Last name is required.</mat-error>
                }
              </mat-form-field>
              <mat-form-field class="sm:col-span-2" appearance="outline">
                <mat-label>Email address</mat-label>
                <input matInput formControlName="email" autocomplete="email" type="email" />
                @if (profileForm.controls.email.touched && profileForm.controls.email.invalid) {
                  <mat-error>Enter a valid email address.</mat-error>
                }
              </mat-form-field>
              <mat-form-field class="sm:col-span-2" appearance="outline">
                <mat-label>About you</mat-label>
                <textarea
                  matInput
                  formControlName="bio"
                  rows="4"
                  maxlength="500"
                  placeholder="A short introduction is optional."
                ></textarea>
                <mat-hint align="end">{{ profileForm.controls.bio.value?.length ?? 0 }}/500</mat-hint>
              </mat-form-field>
            </div>
            <div class="profile-actions">
              <a mat-button routerLink="/dashboard">Cancel</a>
              <button mat-raised-button type="submit" [disabled]="profileForm.invalid">Save changes</button>
            </div>
          </form>

          <aside class="profile-summary">
            <h2>Account at a glance</h2>
            <dl>
              <div>
                <dt>Role</dt>
                <dd>{{ roleLabel() }}</dd>
              </div>
              <div>
                <dt>Email status</dt>
                <dd>
                  <mat-icon>{{ authStore.user()?.emailVerified ? 'verified' : 'mail_outline' }}</mat-icon>
                  {{ authStore.user()?.emailVerified ? 'Verified' : 'Not verified' }}
                </dd>
              </div>
            </dl>
            <div class="profile-note">
              <mat-icon>lock</mat-icon>
              <p>
                Your password and sign-in settings stay protected. Use the password-reset flow if you need to change
                your password.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .profile-page {
        background: #f6faf9;
        color: #102a2c;
      }
      .profile-back-link {
        color: #0f766e;
        transition:
          background-color 0.2s,
          color 0.2s;
      }
      .profile-back-link:hover {
        background: #f0fdfa;
        color: #115e59;
      }
      .profile-hero {
        background: #e6f5f2;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
      }
      .profile-avatar {
        display: flex;
        width: 3.5rem;
        height: 3.5rem;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: 1rem;
        background: #0f766e;
        color: #ecfeff;
        font-weight: 800;
      }
      .profile-kicker {
        color: #0f766e;
        font-size: 0.6875rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .profile-hero h1 {
        color: #102a2c;
      }
      .profile-hero p:not(.profile-kicker) {
        color: #52666a;
      }
      .profile-role-badge {
        align-self: flex-start;
        border-radius: 999px;
        background: #fff;
        color: #115e59;
        padding: 0.4rem 0.7rem;
        font-size: 0.6875rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .profile-card,
      .profile-summary {
        border: 1px solid #dbe7e4;
        border-radius: 1rem;
        background: #fff;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
      }
      .profile-card {
        padding: 1.25rem;
      }
      .profile-card-header {
        margin-bottom: 1.25rem;
      }
      .profile-card h2,
      .profile-summary h2 {
        color: #102a2c;
        font-size: 0.9375rem;
        font-weight: 800;
      }
      .profile-card-header p {
        margin-top: 0.35rem;
        color: #64748b;
        font-size: 0.8125rem;
        line-height: 1.25rem;
      }
      .profile-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.25rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
      }
      .profile-actions .mat-mdc-raised-button {
        background: #0f766e !important;
        color: #ecfeff !important;
        border-radius: 0.75rem;
        font-weight: 700;
      }
      .profile-actions .mat-mdc-button {
        color: #52666a !important;
        border-radius: 0.75rem;
        font-weight: 700;
      }
      .profile-summary {
        align-self: start;
        padding: 1.25rem;
      }
      .profile-summary dl {
        display: grid;
        gap: 1rem;
        margin: 1.25rem 0;
      }
      .profile-summary dl div {
        display: grid;
        gap: 0.25rem;
      }
      .profile-summary dt {
        color: #64748b;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .profile-summary dd {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        color: #102a2c;
        font-size: 0.8125rem;
        font-weight: 700;
      }
      .profile-summary dd .mat-icon {
        width: 1rem;
        height: 1rem;
        color: #0f766e;
        font-size: 1rem;
      }
      .profile-note {
        display: flex;
        gap: 0.625rem;
        border-radius: 0.75rem;
        background: #f0fdfa;
        padding: 0.75rem;
        color: #52666a;
        font-size: 0.75rem;
        line-height: 1.2rem;
      }
      .profile-note .mat-icon {
        width: 1rem;
        height: 1rem;
        flex: 0 0 auto;
        color: #0f766e;
        font-size: 1rem;
      }
      :host(.profile--dark) .profile-page {
        background: #0c1222;
        color: #f1f5f9;
      }
      :host(.profile--dark) .profile-back-link {
        color: #5eead4;
      }
      :host(.profile--dark) .profile-back-link:hover {
        background: rgba(45, 212, 191, 0.12);
        color: #99f6e4;
      }
      :host(.profile--dark) .profile-hero {
        background: #0d1b2f;
        box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.1);
      }
      :host(.profile--dark) .profile-avatar {
        background: #2dd4bf;
        color: #082f2e;
      }
      :host(.profile--dark) .profile-kicker {
        color: #5eead4;
      }
      :host(.profile--dark) .profile-hero h1,
      :host(.profile--dark) .profile-card h2,
      :host(.profile--dark) .profile-summary h2,
      :host(.profile--dark) .profile-summary dd {
        color: #f1f5f9;
      }
      :host(.profile--dark) .profile-hero p:not(.profile-kicker),
      :host(.profile--dark) .profile-card-header p,
      :host(.profile--dark) .profile-summary dt {
        color: #94a3b8;
      }
      :host(.profile--dark) .profile-role-badge {
        background: rgba(45, 212, 191, 0.14);
        color: #99f6e4;
      }
      :host(.profile--dark) .profile-card,
      :host(.profile--dark) .profile-summary {
        border-color: rgba(148, 163, 184, 0.16);
        background: #151b2e;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
      }
      :host(.profile--dark) .profile-actions {
        border-color: rgba(148, 163, 184, 0.16);
      }
      :host(.profile--dark) .profile-actions .mat-mdc-raised-button {
        background: #2dd4bf !important;
        color: #082f2e !important;
      }
      :host(.profile--dark) .profile-actions .mat-mdc-button {
        color: #cbd5e1 !important;
      }
      :host(.profile--dark) .profile-summary dd .mat-icon {
        color: #5eead4;
      }
      :host(.profile--dark) .profile-note {
        background: rgba(45, 212, 191, 0.12);
        color: #cbd5e1;
      }
      :host(.profile--dark) .profile-note .mat-icon {
        color: #5eead4;
      }
    `,
  ],
  host: { class: 'block', '[class.profile--dark]': 'themeService.darkMode()' },
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);
  readonly profileForm = this.fb.group({
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    bio: this.fb.control<string | null>(null),
  });
  private readonly syncUser = effect(() => {
    const user = this.authStore.user();
    if (user)
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
      });
  });
  save() {
    if (this.profileForm.valid) this.authStore.patch(this.profileForm.getRawValue());
  }
  roleLabel() {
    const role = this.authStore.user()?.role;
    return role === 'Administrator' ? 'Administrator' : role === 'Partner_Staff' ? 'Partner staff' : 'Participant';
  }
}
