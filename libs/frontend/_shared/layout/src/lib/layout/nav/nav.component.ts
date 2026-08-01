import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatIconButton } from '@angular/material/button';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { EditProfileComponent, MimicUserModalComponent } from '@mas/frontend-shared-components';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'mas-nav',
  imports: [MatToolbar, MatIcon, MatIconButton, MatAnchor, RouterLink, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="accent">
      <button
        class="mr-4"
        mat-icon-button
        aria-label="Navigation menu"
        (click)="openNav.emit()"
        data-testid="navigation-menu"
      >
        <mat-icon>menu</mat-icon>
      </button>
      <a routerLink="/">
        <img src="assets/Logo/BRP_Logo.webp" height="36" width="66" class="h-9 w-auto" alt="BRP" />
      </a>
      <div class="ml-auto flex items-center gap-4">
        @if (!authStore.user()) {
          <a mat-raised-button routerLink="/login" color="primary">Sign Up or Login</a>
        } @else {
          <div
            role="button"
            [class]="authStore.realUser() ? 'border-2 border-red-500' : ''"
            class="w-10 h-10 rounded-full flex justify-center items-center bg-slate-800 cursor-pointer"
            [matMenuTriggerFor]="userMenu"
          >
            <span class="uppercase">{{ authStore.initials() }}</span>
          </div>
        }
        <div class="hidden sm:flex">
          <button mat-icon-button aria-label="Toggle dark mode" (click)="themeService.toggleDarkMode()">
            <mat-icon>{{ themeService.darkMode() ? 'wb_sunny' : 'nights_stay' }}</mat-icon>
          </button>
        </div>
      </div>
    </mat-toolbar>
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
