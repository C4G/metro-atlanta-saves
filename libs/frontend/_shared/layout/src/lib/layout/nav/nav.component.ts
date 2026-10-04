import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { MimicUserModalComponent } from '@mas/frontend-shared-components';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'mas-nav',
  imports: [MatIcon, MatMenuModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="h-14 border-b border-outline bg-surface/95 text-ink backdrop-blur sm:h-16" aria-label="Primary">
      <div class="mx-auto flex h-full max-w-[100rem] items-center gap-3 px-3 sm:gap-4 sm:px-5">
        <a
          [routerLink]="authStore.user() ? '/dashboard' : '/'"
          class="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Building Resilient Professionals home"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-soft">
            <img
              src="assets/Logo/brp-logo-community-no-arrow.png"
              height="36"
              width="36"
              class="h-8 w-8 object-contain [filter:var(--mas-logo-filter)]"
              alt=""
            />
          </span>
          <span class="hidden min-w-0 sm:block">
            <span class="block truncate text-sm font-bold tracking-tight text-ink">Building Resilient</span>
            <span class="block text-[10px] font-bold uppercase tracking-[0.15em] text-brand">Professionals</span>
          </span>
        </a>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="nav-icon lg:hidden"
            aria-label="Open navigation menu"
            [matMenuTriggerFor]="mobileNavMenu"
            data-testid="navigation-menu"
          >
            <mat-icon>menu</mat-icon>
          </button>

          @if (authStore.user()) {
            <a
              routerLink="/dashboard"
              routerLinkActive="nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link hidden lg:inline-flex"
            >
              <mat-icon>space_dashboard</mat-icon>
              Dashboard
            </a>
          }
          @if (authStore.isStaff()) {
            <a
              routerLink="/partner-staff/programs"
              routerLinkActive="nav-link-active"
              class="nav-link hidden lg:inline-flex"
            >
              <mat-icon>folder_managed</mat-icon>
              Programs
            </a>
          }
          @if (authStore.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="nav-link-active" class="nav-link hidden lg:inline-flex">
              <mat-icon>admin_panel_settings</mat-icon>
              Admin
            </a>
          }

          <button
            type="button"
            class="nav-icon hidden lg:flex"
            [attr.aria-label]="themeService.darkMode() ? 'Use light mode' : 'Use dark mode'"
            (click)="themeService.toggleDarkMode()"
          >
            <mat-icon>{{ themeService.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          @if (!authStore.user()) {
            <a
              routerLink="/login"
              class="inline-flex items-center rounded-xl bg-brand-strong px-4 py-2 text-sm font-bold text-brand-on transition-colors hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              Sign in
            </a>
          } @else {
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand"
              [class.ring-2]="authStore.realUser()"
              [class.ring-red-500]="authStore.realUser()"
              [matMenuTriggerFor]="userMenu"
              aria-label="Open account menu"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-strong text-xs font-bold text-brand-on"
              >
                {{ authStore.initials() }}
              </span>
              <span class="hidden max-w-28 text-left sm:block">
                <span class="block truncate text-xs font-bold text-ink">
                  {{ authStore.user()?.firstName }} {{ authStore.user()?.lastName }}
                </span>
                <span class="block text-[10px] font-medium text-ink-subtle">Account</span>
              </span>
            </button>
          }
        </div>
      </div>
    </nav>

    <mat-menu #mobileNavMenu="matMenu" class="brand-menu">
      @if (authStore.user()) {
        <a mat-menu-item routerLink="/dashboard">
          <mat-icon>space_dashboard</mat-icon>
          <span>Dashboard</span>
        </a>
      }
      @if (authStore.isStaff()) {
        <a mat-menu-item routerLink="/partner-staff/programs">
          <mat-icon>folder_managed</mat-icon>
          <span>Programs</span>
        </a>
      }
      @if (authStore.isAdmin()) {
        <a mat-menu-item routerLink="/admin">
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Admin settings</span>
        </a>
      }
      <button mat-menu-item (click)="themeService.toggleDarkMode()">
        <mat-icon>{{ themeService.darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        <span>{{ themeService.darkMode() ? 'Light mode' : 'Dark mode' }}</span>
      </button>
    </mat-menu>

    <mat-menu #userMenu="matMenu" class="brand-menu">
      <div class="mx-3 mb-2 flex items-center gap-3 border-b border-outline px-1 pb-3 pt-1 text-ink">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-strong text-xs font-bold text-brand-on"
        >
          {{ authStore.initials() }}
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-bold">
            {{ authStore.user()?.firstName }} {{ authStore.user()?.lastName }}
          </span>
          <span class="block truncate text-xs text-ink-subtle">{{ authStore.user()?.email }}</span>
        </span>
      </div>
      <a mat-menu-item routerLink="/profile">
        <span class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit Profile</span>
        </span>
      </a>
      @if (notificationsSupported) {
        <button mat-menu-item (click)="toggleNotifications()">
          <span class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span>{{ notificationsEnabled() ? 'Disable Notifications' : 'Enable Notifications' }}</span>
          </span>
        </button>
      }
      <button mat-menu-item (click)="authStore.logout()">
        <span class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </span>
      </button>
      @if (authStore.isStaff() || authStore.realUser()) {
        @if (!authStore.realUser()) {
          <button mat-menu-item (click)="openMimicUserModal()">
            <span class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Mimic User</span>
            </span>
          </button>
        } @else {
          <button mat-menu-item (click)="authStore.stopMimickingUser()">
            <span class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <span>Stop Mimicking User</span>
            </span>
          </button>
        }
      }
    </mat-menu>

    @if (notificationModal()) {
      <div
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
        (click)="notificationModal.set(null)"
      >
        <div
          class="modal-sheet relative flex w-full flex-col rounded-t-2xl bg-surface-raised text-ink shadow-2xl sm:max-w-md sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Drag handle - mobile only -->
          <div class="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-outline sm:hidden" aria-hidden="true"></div>
          <!-- Header -->
          <div class="flex items-start justify-between border-b border-outline px-6 pb-4 pt-5">
            <div>
              <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
                Push Notifications
              </p>
              <h2 class="text-lg font-bold leading-tight text-ink">
                {{ notificationModal() === 'not-supported' ? 'Not Supported' : 'Notifications Enabled' }}
              </h2>
            </div>
            <button
              type="button"
              class="ml-4 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink"
              (click)="notificationModal.set(null)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <!-- Content -->
          <div class="px-6 py-5 space-y-4">
            @if (notificationModal() === 'not-supported') {
              <p class="text-sm leading-relaxed text-ink-muted">
                Push notifications are not supported in this browser.
              </p>
              <div class="rounded-xl border border-outline bg-surface-subtle p-4">
                <p class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brand">iPhone / iPad</p>
                <p class="text-sm leading-relaxed text-ink">
                  Tap the
                  <strong>Share</strong>
                  button and choose
                  <strong>"Add to Home Screen"</strong>
                  , then open the app from your home screen to enable notifications.
                </p>
              </div>
            } @else {
              <p class="text-sm leading-relaxed text-ink-muted">You are currently receiving push notifications.</p>
              <p class="text-sm leading-relaxed text-ink-muted">
                To turn them off, update your notification permissions in your browser or phone settings:
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3 rounded-xl border border-outline bg-surface-subtle px-4 py-3">
                  <span class="mt-0.5 shrink-0 text-sm text-ink-subtle">•</span>
                  <p class="text-sm leading-relaxed text-ink-muted">
                    <span class="font-semibold">Chrome / Edge:</span>
                    Settings → Privacy and Security → Site Settings → Notifications
                  </p>
                </div>
                <div class="flex items-start gap-3 rounded-xl border border-outline bg-surface-subtle px-4 py-3">
                  <span class="mt-0.5 shrink-0 text-sm text-ink-subtle">•</span>
                  <p class="text-sm leading-relaxed text-ink-muted">
                    <span class="font-semibold">iOS:</span>
                    Settings → Apps → BRPATL → Notifications
                  </p>
                </div>
              </div>
            }
          </div>
          <!-- Footer -->
          <div class="px-6 pb-6 pt-2 flex justify-end">
            <button
              type="button"
              class="rounded-lg border border-outline bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-muted shadow-sm transition-colors hover:bg-surface-subtle hover:text-ink"
              (click)="notificationModal.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .nav-link {
      align-items: center;
      border-radius: 0.5rem;
      color: rgb(var(--mas-ink-muted));
      font-size: 0.75rem;
      font-weight: 700;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      transition:
        background-color 150ms ease,
        color 150ms ease;
    }

    .nav-link:hover,
    .nav-link-active {
      background: rgb(var(--mas-brand-soft) / 0.7);
      color: rgb(var(--mas-brand-strong));
    }

    .nav-link mat-icon {
      font-size: 1rem;
      height: 1rem;
      line-height: 1rem;
      width: 1rem;
    }

    .nav-icon {
      align-items: center;
      border-radius: 0.75rem;
      color: rgb(var(--mas-ink-muted));
      height: 2.25rem;
      justify-content: center;
      transition:
        background-color 150ms ease,
        color 150ms ease;
      width: 2.25rem;
    }

    .nav-icon:hover {
      background: rgb(var(--mas-surface-subtle));
      color: rgb(var(--mas-ink));
    }
  `,
  host: {
    class: 'block fixed top-0 left-0 right-0 z-50',
  },
})
export class NavComponent {
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  themeService = inject(ThemeService);
  private push = inject(PushNotificationService);
  private platformId = inject(PLATFORM_ID);
  notificationsEnabled = signal(false);
  notificationsSupported = isPlatformBrowser(this.platformId);
  notificationModal = signal<null | 'not-supported' | 'already-enabled'>(null);

  constructor() {
    if (this.notificationsSupported && 'Notification' in window) {
      this.notificationsEnabled.set(Notification.permission === 'granted');
    }
  }

  async toggleNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      this.notificationModal.set('not-supported');
      return;
    }
    if (this.notificationsEnabled()) {
      this.notificationModal.set('already-enabled');
      return;
    }
    await this.push.subscribe();
    this.notificationsEnabled.set(Notification.permission === 'granted');
  }

  openMimicUserModal() {
    this.dialog.open(MimicUserModalComponent, {
      panelClass: 'w-96',
    });
  }
}
