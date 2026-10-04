import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'mas-profile',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-canvas px-4 py-8 text-ink sm:px-6 sm:py-10 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <a
          routerLink="/dashboard"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-strong transition-colors hover:bg-brand-soft/60 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-canvas"
        >
          <svg
            aria-hidden="true"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          Back to dashboard
        </a>

        <header class="mt-5 overflow-hidden rounded-3xl border border-outline bg-surface-raised">
          <div class="h-2 bg-brand"></div>
          <div class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div class="flex min-w-0 items-center gap-4 sm:gap-5">
              <span
                aria-hidden="true"
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-strong text-base font-extrabold text-brand-on sm:h-16 sm:w-16 sm:text-lg"
              >
                {{ authStore.initials() }}
              </span>
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your account</p>
                <h1 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Profile and preferences</h1>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                  Keep your details current so your program team can reach you.
                </p>
              </div>
            </div>
            <span class="w-fit rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-strong">
              {{ roleLabel() }}
            </span>
          </div>
        </header>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section
            class="rounded-3xl border border-outline bg-surface-raised p-5 sm:p-7"
            aria-labelledby="profile-form-title"
          >
            <div class="border-b border-outline pb-5">
              <h2 id="profile-form-title" class="text-lg font-bold">Personal information</h2>
              <p class="mt-1 text-sm leading-6 text-ink-muted">
                Your name and bio may appear in program and community spaces.
              </p>
            </div>

            <form class="mt-6" [formGroup]="profileForm" (ngSubmit)="save()" novalidate>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="profile-first-name" class="mb-2 block text-sm font-semibold">First name</label>
                  <input
                    id="profile-first-name"
                    type="text"
                    formControlName="firstName"
                    autocomplete="given-name"
                    class="min-h-11 w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                    [attr.aria-invalid]="submitted() && profileForm.controls.firstName.invalid"
                    [attr.aria-describedby]="
                      submitted() && profileForm.controls.firstName.invalid ? 'profile-first-name-error' : null
                    "
                  />
                  @if (submitted() && profileForm.controls.firstName.invalid) {
                    <p id="profile-first-name-error" class="mt-1.5 text-sm font-medium text-danger">
                      First name is required.
                    </p>
                  }
                </div>

                <div>
                  <label for="profile-last-name" class="mb-2 block text-sm font-semibold">Last name</label>
                  <input
                    id="profile-last-name"
                    type="text"
                    formControlName="lastName"
                    autocomplete="family-name"
                    class="min-h-11 w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                    [attr.aria-invalid]="submitted() && profileForm.controls.lastName.invalid"
                    [attr.aria-describedby]="
                      submitted() && profileForm.controls.lastName.invalid ? 'profile-last-name-error' : null
                    "
                  />
                  @if (submitted() && profileForm.controls.lastName.invalid) {
                    <p id="profile-last-name-error" class="mt-1.5 text-sm font-medium text-danger">
                      Last name is required.
                    </p>
                  }
                </div>

                <div class="sm:col-span-2">
                  <label for="profile-email" class="mb-2 block text-sm font-semibold">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="min-h-11 w-full rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                    [attr.aria-invalid]="submitted() && profileForm.controls.email.invalid"
                    [attr.aria-describedby]="
                      submitted() && profileForm.controls.email.invalid ? 'profile-email-error' : 'profile-email-help'
                    "
                  />
                  @if (submitted() && profileForm.controls.email.invalid) {
                    <p id="profile-email-error" class="mt-1.5 text-sm font-medium text-danger">
                      Enter a valid email address.
                    </p>
                  } @else {
                    <p id="profile-email-help" class="mt-1.5 text-xs text-ink-subtle">
                      Used for account and program updates.
                    </p>
                  }
                </div>

                <div class="sm:col-span-2">
                  <div class="mb-2 flex items-center justify-between gap-4">
                    <label for="profile-bio" class="text-sm font-semibold">About you</label>
                    <span class="text-xs text-ink-subtle">{{ bioLength() }}/500</span>
                  </div>
                  <textarea
                    id="profile-bio"
                    formControlName="bio"
                    rows="5"
                    maxlength="500"
                    placeholder="Share a short introduction (optional)"
                    class="w-full resize-y rounded-xl border border-outline bg-surface px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
                  ></textarea>
                </div>
              </div>

              <div class="mt-6 flex flex-col-reverse gap-3 border-t border-outline pt-5 sm:flex-row sm:justify-end">
                <a
                  routerLink="/dashboard"
                  class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-strong px-5 text-sm font-bold text-brand-on transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised"
                  [disabled]="profileForm.invalid"
                >
                  Save changes
                </button>
              </div>
            </form>
          </section>

          <aside
            class="self-start rounded-3xl border border-outline bg-surface-raised p-5 sm:p-6"
            aria-labelledby="account-summary-title"
          >
            <h2 id="account-summary-title" class="text-base font-bold">Account at a glance</h2>
            <dl class="mt-5 space-y-5">
              <div>
                <dt class="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Role</dt>
                <dd class="mt-1.5 text-sm font-semibold">{{ roleLabel() }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Email status</dt>
                <dd class="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                  <span class="h-2 w-2 rounded-full bg-brand" aria-hidden="true"></span>
                  {{ emailStatus() }}
                </dd>
              </div>
            </dl>

            <div class="mt-6 rounded-2xl bg-surface-subtle p-4">
              <div class="flex gap-3">
                <svg
                  aria-hidden="true"
                  class="mt-0.5 h-5 w-5 shrink-0 text-brand-strong"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path stroke-linecap="round" d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <div>
                  <h3 class="text-sm font-bold">Sign-in security</h3>
                  <p class="mt-1 text-xs leading-5 text-ink-muted">
                    Use the password-reset flow if you need to update your sign-in credentials.
                  </p>
                  <a
                    routerLink="/forgot-password"
                    class="mt-3 inline-flex text-xs font-bold text-brand-strong underline-offset-4 hover:underline"
                  >
                    Reset password
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class ProfileComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  readonly submitted = signal(false);
  readonly profileForm = this.formBuilder.group({
    firstName: this.formBuilder.nonNullable.control('', Validators.required),
    lastName: this.formBuilder.nonNullable.control('', Validators.required),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    bio: this.formBuilder.control<string | null>(null),
  });
  readonly roleLabel = computed(() => {
    const role = this.authStore.user()?.role;
    if (role === 'Administrator') return 'Administrator';
    if (role === 'Partner_Staff') return 'Partner staff';
    return 'Participant';
  });
  readonly emailStatus = computed(() => (this.authStore.user()?.emailVerified ? 'Verified' : 'Not verified'));
  private readonly bio = toSignal(this.profileForm.controls.bio.valueChanges, {
    initialValue: this.profileForm.controls.bio.value,
  });
  readonly bioLength = computed(() => this.bio()?.length ?? 0);

  constructor() {
    effect(() => {
      const user = this.authStore.user();
      untracked(() => {
        if (!user) return;
        this.profileForm.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          bio: user.bio,
        });
      });
    });
  }

  save(): void {
    this.submitted.set(true);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.authStore.patch(this.profileForm.getRawValue());
  }
}
