import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

@Component({
  selector: 'mas-profile',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIcon, MatInputModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-[#f6faf9] px-4 py-6 text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-6xl">
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:hover:text-teal-200"
        >
          <mat-icon class="!h-4 !w-4 !text-base !leading-4">arrow_back</mat-icon>
          Dashboard
        </a>

        <header
          class="mt-4 rounded-2xl bg-[#e6f5f2] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-[#0d1b2f] dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.1)] sm:px-7 sm:py-8"
        >
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex min-w-0 items-center gap-4">
              <span
                class="flex size-14 flex-none items-center justify-center rounded-2xl bg-teal-700 font-extrabold text-cyan-50 dark:bg-teal-400 dark:text-teal-950"
              >
                {{ authStore.initials() }}
              </span>
              <div class="min-w-0">
                <p class="text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                  Your account
                </p>
                <h1 class="truncate text-2xl font-bold tracking-tight text-[#102a2c] dark:text-slate-100 sm:text-3xl">
                  Profile & preferences
                </h1>
                <p class="mt-1 text-sm leading-6 text-[#52666a] dark:text-slate-400">
                  Keep your contact details current so your program team can reach you.
                </p>
              </div>
            </div>
            <span
              class="self-start rounded-full bg-white px-3 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-teal-800 dark:bg-teal-400/15 dark:text-teal-200"
            >
              {{ roleLabel() }}
            </span>
          </div>
        </header>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <form
            class="rounded-2xl border border-[#dbe7e4] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-400/15 dark:bg-[#151b2e] dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
            [formGroup]="profileForm"
            (ngSubmit)="save()"
          >
            <div class="mb-5">
              <h2 class="text-[0.9375rem] font-extrabold text-[#102a2c] dark:text-slate-100">Personal information</h2>
              <p class="mt-1.5 text-[0.8125rem] leading-5 text-slate-500 dark:text-slate-400">
                These details appear to your program team and in relevant platform spaces.
              </p>
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
            <div class="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-400/15">
              <a mat-button routerLink="/dashboard" class="!rounded-xl !font-bold !text-[#52666a] dark:!text-slate-300">
                Cancel
              </a>
              <button
                mat-raised-button
                type="submit"
                [disabled]="profileForm.invalid"
                class="!rounded-xl !bg-teal-700 !font-bold !text-cyan-50 dark:!bg-teal-400 dark:!text-teal-950"
              >
                Save changes
              </button>
            </div>
          </form>

          <aside
            class="self-start rounded-2xl border border-[#dbe7e4] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-slate-400/15 dark:bg-[#151b2e] dark:shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
          >
            <h2 class="text-[0.9375rem] font-extrabold text-[#102a2c] dark:text-slate-100">Account at a glance</h2>
            <dl class="my-5 grid gap-4">
              <div class="grid gap-1">
                <dt class="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  Role
                </dt>
                <dd class="text-[0.8125rem] font-bold text-[#102a2c] dark:text-slate-100">{{ roleLabel() }}</dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  Email status
                </dt>
                <dd class="flex items-center gap-1.5 text-[0.8125rem] font-bold text-[#102a2c] dark:text-slate-100">
                  <mat-icon class="!size-4 !text-base !text-teal-700 dark:!text-teal-300">
                    {{ authStore.user()?.emailVerified ? 'verified' : 'mail_outline' }}
                  </mat-icon>
                  {{ authStore.user()?.emailVerified ? 'Verified' : 'Not verified' }}
                </dd>
              </div>
            </dl>
            <div
              class="flex gap-2.5 rounded-xl bg-teal-50 p-3 text-xs leading-[1.2rem] text-[#52666a] dark:bg-teal-400/10 dark:text-slate-300"
            >
              <mat-icon class="!size-4 flex-none !text-base !text-teal-700 dark:!text-teal-300">lock</mat-icon>
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
  host: { class: 'block' },
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  readonly profileForm = this.fb.group({
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    bio: this.fb.control<string | null>(null),
  });
  private readonly syncUser = effect(() => {
    const user = this.authStore.user();
    if (user) {
      untracked(() =>
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          bio: user.bio,
        }),
      );
    }
  });

  save() {
    if (this.profileForm.valid) this.authStore.patch(this.profileForm.getRawValue());
  }

  roleLabel() {
    const role = this.authStore.user()?.role;
    return role === 'Administrator' ? 'Administrator' : role === 'Partner_Staff' ? 'Partner staff' : 'Participant';
  }
}
