import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { EditProfileComponent, MimicUserModalComponent } from '@mas/frontend-shared-components';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'mas-nav',
  imports: [MatIcon, RouterLink, RouterLinkActive, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="h-14 border-b border-slate-200/80 bg-white/95 text-slate-900 shadow-sm backdrop-blur sm:h-16"
      aria-label="Application navigation"
    >
      <div class="mx-auto flex h-full max-w-[100rem] items-center gap-3 px-3 sm:gap-4 sm:px-5">
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-600"
          aria-label="Open navigation menu"
          (click)="openNav.emit()"
          data-testid="navigation-menu"
        >
          <mat-icon>menu</mat-icon>
        </button>
        <a
          [routerLink]="authStore.user() ? '/dashboard' : '/'"
          class="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
          aria-label="Building Resilient Professionals home"
        >
          <span
            class="brand-logo-frame flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50"
          >
            <img
              src="assets/Logo/brp-logo-community-no-arrow.png"
              height="36"
              width="36"
              class="brand-logo h-8 w-8 object-contain"
              alt=""
            />
          </span>
          <span class="hidden min-w-0 sm:block">
            <span class="block truncate text-sm font-bold tracking-tight text-slate-950">Building Resilient</span>
            <span class="block text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">Professionals</span>
          </span>
        </a>
        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          @if (authStore.user()) {
            <a
              routerLink="/dashboard"
              routerLinkActive="nav-page-link--active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-page-link hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800 md:inline-flex"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">space_dashboard</mat-icon>
              Dashboard
            </a>
          }
          @if (authStore.isAdmin()) {
            <a
              routerLink="/admin"
              routerLinkActive="nav-page-link--active"
              class="nav-page-link hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800 lg:inline-flex"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">admin_panel_settings</mat-icon>
              Admin
            </a>
          }
          <button
            type="button"
            class="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-600 sm:flex"
            aria-label="Toggle dark mode"
            (click)="themeService.toggleDarkMode()"
          >
            <mat-icon class="!h-5 !w-5 !text-xl !leading-5">
              {{ themeService.darkMode() ? 'light_mode' : 'dark_mode' }}
            </mat-icon>
          </button>
          @if (!authStore.user()) {
            <a
              routerLink="/login"
              class="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 sm:px-4 sm:text-sm"
            >
              <mat-icon class="!h-4 !w-4 !text-base !leading-4">login</mat-icon>
              <span class="hidden sm:inline">Sign in</span>
              <span class="sm:hidden">Sign in</span>
            </a>
          } @else {
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              [class.ring-2]="authStore.realUser()"
              [class.ring-red-500]="authStore.realUser()"
              [matMenuTriggerFor]="userMenu"
              aria-label="Open account menu"
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white"
              >
                {{ authStore.initials() }}
              </span>
              <span class="hidden max-w-28 text-left sm:block">
                <span class="block truncate text-xs font-bold text-slate-900">
                  {{ authStore.user()?.firstName }} {{ authStore.user()?.lastName }}
                </span>
                <span class="block text-[10px] font-medium text-slate-500">Account</span>
              </span>
              <mat-icon class="hidden !h-4 !w-4 !text-base !leading-4 text-slate-400 sm:block">expand_more</mat-icon>
            </button>
          }
        </div>
      </div>
    </nav>
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item (click)="openEditProfileModal()">
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
      </button>
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
          class="modal-sheet relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Drag handle - mobile only -->
          <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>
          <!-- Header -->
          <div class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Push Notifications</p>
              <h2 class="text-lg font-bold text-gray-900 leading-tight">
                {{ notificationModal() === 'not-supported' ? 'Not Supported' : 'Notifications Enabled' }}
              </h2>
            </div>
            <button
              type="button"
              class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-4 mt-0.5 shrink-0"
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
              <p class="text-sm text-gray-600 leading-relaxed">Push notifications are not supported in this browser.</p>
              <div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1.5">iPhone / iPad</p>
                <p class="text-sm text-amber-900 leading-relaxed">
                  Tap the
                  <strong>Share</strong>
                  button and choose
                  <strong>"Add to Home Screen"</strong>
                  , then open the app from your home screen to enable notifications.
                </p>
              </div>
            } @else {
              <p class="text-sm text-gray-600 leading-relaxed">You are currently receiving push notifications.</p>
              <p class="text-sm text-gray-600 leading-relaxed">
                To turn them off, update your notification permissions in your browser or phone settings:
              </p>
              <div class="space-y-3">
                <div class="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span class="mt-0.5 shrink-0 text-gray-400 text-sm">•</span>
                  <p class="text-sm text-gray-700 leading-relaxed">
                    <span class="font-semibold">Chrome / Edge:</span>
                    Settings → Privacy and Security → Site Settings → Notifications
                  </p>
                </div>
                <div class="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span class="mt-0.5 shrink-0 text-gray-400 text-sm">•</span>
                  <p class="text-sm text-gray-700 leading-relaxed">
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
              class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              (click)="notificationModal.set(null)"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .nav-page-link--active {
        background-color: #f0fdfa;
        color: #115e59;
      }
      :host(.nav--dark) nav {
        border-color: rgba(255, 255, 255, 0.1);
        background: rgba(12, 18, 34, 0.94);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
      }
      :host(.nav--dark) ::ng-deep .text-slate-900,
      :host(.nav--dark) ::ng-deep .text-slate-950 {
        color: #f1f5f9 !important;
      }
      :host(.nav--dark) ::ng-deep .text-slate-600,
      :host(.nav--dark) ::ng-deep .text-slate-500,
      :host(.nav--dark) ::ng-deep .text-slate-400 {
        color: #94a3b8 !important;
      }
      :host(.nav--dark) ::ng-deep .hover\\:bg-slate-100:hover {
        background-color: rgba(255, 255, 255, 0.08) !important;
      }
      :host(.nav--dark) ::ng-deep .hover\\:bg-teal-50:hover {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.nav--dark) .nav-page-link--active {
        background-color: rgba(45, 212, 191, 0.14);
        color: #99f6e4;
      }
      :host(.nav--dark) .admin-nav-link {
        background-color: rgba(45, 212, 191, 0.14) !important;
        color: #99f6e4 !important;
      }
      :host(.nav--dark) .admin-nav-link:hover {
        background-color: rgba(45, 212, 191, 0.22) !important;
        color: #ccfbf1 !important;
      }
      :host(.nav--dark) ::ng-deep .bg-amber-50 {
        background-color: rgba(251, 191, 36, 0.14) !important;
      }
      :host(.nav--dark) .brand-logo-frame {
        background: linear-gradient(145deg, #12334a, #0f766e) !important;
      }
      :host(.nav--dark) .brand-logo {
        filter: brightness(0) saturate(100%) invert(89%) sepia(23%) saturate(731%) hue-rotate(119deg) brightness(101%)
          contrast(96%);
      }
      :host(.nav--dark) ::ng-deep .bg-slate-950 {
        background-color: #2dd4bf !important;
        color: #082f2e !important;
      }
      :host(.nav--dark) ::ng-deep .bg-teal-700 {
        background-color: #0f766e !important;
      }
    `,
  ],
  host: {
    class: 'block fixed top-0 left-0 right-0 z-50',
    '[class.nav--dark]': 'themeService.darkMode()',
  },
})
export class NavComponent {
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  themeService = inject(ThemeService);
  private push = inject(PushNotificationService);
  private platformId = inject(PLATFORM_ID);
  @Output() openNav = new EventEmitter<void>();

  notificationsEnabled = signal(false);
  notificationsSupported = isPlatformBrowser(this.platformId);
  notificationModal = signal<null | 'not-supported' | 'already-enabled'>(null);

  constructor() {
    this.themeService.init();
    if (this.notificationsSupported && 'Notification' in window) {
      this.notificationsEnabled.set(Notification.permission === 'granted');
    }
  }

  openEditProfileModal() {
    this.dialog.open(EditProfileComponent, {
      data: this.authStore.user(),
      panelClass: 'w-full',
    });
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
