import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { CdkMenu, CdkMenuItem, CdkMenuItemCheckbox, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MainNavStore, ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { MimicRingComponent, MimicUserModalComponent } from '@mas/frontend-shared-components';
import { PushNotificationService } from '../../services/push-notification.service';

export const ACCOUNT_MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetX: 8, offsetY: 20 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetX: 8, offsetY: -20 },
];

@Component({
  selector: 'mas-nav',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuItemCheckbox,
    CdkMenuTrigger,
    MatIcon,
    MimicRingComponent,
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="rounded-2xl border border-outline/65 bg-surface/80 text-ink shadow-lg backdrop-blur-md backdrop-saturate-150"
      aria-label="Primary"
    >
      <div class="flex h-14 w-full items-center justify-between gap-3 pl-2.5 pr-2 sm:h-16 sm:pl-3.5 sm:pr-3">
        <a
          [routerLink]="authStore.user() ? '/dashboard' : '/'"
          class="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Metro Atlanta Saves home"
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
            <span class="block truncate text-sm font-bold text-ink">Metro Atlanta</span>
            <span class="block text-xs font-bold uppercase tracking-[0.15em] text-brand">Saves</span>
          </span>
        </a>

        <div class="flex min-w-0 items-center gap-1 rounded-xl border border-brand/25 bg-surface-raised/60 p-1">
          @if (mainNavStore.switcher(); as switcher) {
            <button
              #switcherButton
              type="button"
              class="group flex min-h-9 min-w-0 max-w-40 items-center gap-1.5 rounded-lg border border-transparent px-2 text-xs font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-expanded:border-brand/70 aria-expanded:bg-surface-raised aria-expanded:text-brand-strong sm:max-w-64"
              aria-controls="site-switcher"
              [attr.aria-expanded]="switcherOpen()"
              [attr.aria-label]="'Sections and programs, current: ' + switcher.label"
              (click)="toggleSwitcher()"
            >
              <mat-icon class="mas-icon-md shrink-0" aria-hidden="true">{{ switcher.icon }}</mat-icon>
              <span class="min-w-0 truncate">{{ switcher.label }}</span>
              <mat-icon class="mas-icon-sm shrink-0" aria-hidden="true">unfold_more</mat-icon>
            </button>
            <span class="h-6 w-px shrink-0 bg-brand/25" aria-hidden="true"></span>
          }
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            [attr.aria-label]="themeService.darkMode() ? 'Use light mode' : 'Use dark mode'"
            (click)="themeService.toggleDarkMode()"
          >
            <mat-icon class="mas-icon-md" aria-hidden="true">
              {{ themeService.darkMode() ? 'light_mode' : 'dark_mode' }}
            </mat-icon>
          </button>
          <span class="h-6 w-px bg-brand/25" aria-hidden="true"></span>

          @if (!authStore.user()) {
            <a
              routerLink="/login"
              class="flex min-h-9 items-center rounded-lg border border-transparent px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Sign in
            </a>
          } @else {
            <button
              type="button"
              class="group flex min-h-9 items-center gap-2 rounded-lg border border-transparent pl-1 pr-1.5 text-xs font-bold text-ink-muted transition-colors hover:border-brand/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-expanded:border-brand/70 aria-expanded:bg-surface-raised aria-expanded:text-brand-strong sm:pr-2"
              [cdkMenuTriggerFor]="accountMenu"
              [cdkMenuPosition]="accountMenuPositions"
              [attr.aria-label]="'Account menu, ' + fullName()"
            >
              @if (authStore.isMimicking()) {
                <mas-mimic-ring>
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-strong text-xs font-bold text-brand-on"
                  >
                    {{ authStore.initials() }}
                  </span>
                </mas-mimic-ring>
              } @else {
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-strong text-xs font-bold text-brand-on"
                >
                  {{ authStore.initials() }}
                </span>
              }
              <span class="hidden max-w-40 truncate sm:inline">{{ fullName() }}</span>
              <mat-icon
                class="mas-icon-sm transition-transform group-aria-expanded:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              >
                expand_more
              </mat-icon>
            </button>
          }
        </div>
      </div>

      @if (switcherOpen()) {
        <div
          id="site-switcher"
          class="grid max-h-[calc(100dvh-6rem)] gap-3 overflow-y-auto border-t border-outline/55 p-3 md:grid-cols-2 md:gap-6 md:px-3.5 md:py-4"
        >
          <section aria-labelledby="switcher-sections-heading">
            <h2 id="switcher-sections-heading" class="px-1 text-xs font-bold text-ink-muted">Go to</h2>
            <ul class="mt-2 grid grid-cols-2 gap-2">
              @for (section of linkedSections(); track section.key) {
                <li>
                  <a
                    [routerLink]="section.link"
                    routerLinkActive
                    [routerLinkActiveOptions]="{ exact: section.exact }"
                    ariaCurrentWhenActive="page"
                    [class]="switcherRowClass"
                  >
                    <span [class]="menuIconClass" aria-hidden="true">
                      <mat-icon class="mas-icon-sm">{{ section.icon }}</mat-icon>
                    </span>
                    <span class="min-w-0 flex-1 truncate">{{ section.label }}</span>
                  </a>
                </li>
              }
            </ul>
          </section>
          @if (programsStore.myProgramCards().length) {
            <section aria-labelledby="switcher-programs-heading">
              <h2 id="switcher-programs-heading" class="px-1 text-xs font-bold text-ink-muted">Your programs</h2>
              <ul class="mt-2 grid gap-2 lg:grid-cols-2">
                @for (card of programsStore.myProgramCards(); track card.program.id) {
                  @let current = card.program.id === mainNavStore.program()?.id;
                  <li>
                    <a
                      [routerLink]="
                        authStore.isStaff()
                          ? ['/partner-staff/programs', card.program.id, 'progress']
                          : ['/program-profiles', card.program.id]
                      "
                      [class]="switcherRowClass"
                      [class.text-ink-muted]="card.isInactive && !current"
                      [attr.aria-current]="current ? 'page' : null"
                    >
                      <span [class]="menuIconClass" aria-hidden="true">
                        <mat-icon class="mas-icon-sm">school</mat-icon>
                      </span>
                      <span class="min-w-0 flex-1 truncate">{{ card.program.name }}</span>
                      @if (current) {
                        <mat-icon class="mas-icon-md shrink-0 text-brand-strong" aria-hidden="true">check</mat-icon>
                      }
                    </a>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      }
    </nav>

    <ng-template #accountMenu>
      <div
        cdkMenu
        class="w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-brand/25 bg-surface-raised text-ink shadow-xl"
        aria-label="Account"
      >
        <div class="flex items-center gap-3 border-b border-outline/55 p-4">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-strong text-sm font-bold text-brand-on"
          >
            {{ authStore.initials() }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold">{{ fullName() }}</span>
            <span class="block truncate text-xs text-ink-muted">{{ authStore.user()?.email }}</span>
          </span>
          <span class="shrink-0 rounded-full border border-brand/40 px-2 py-0.5 text-xs font-bold text-brand-strong">
            {{ authStore.roleLabel() }}
          </span>
        </div>

        <div class="space-y-2 p-3">
          <a cdkMenuItem routerLink="/profile" [class]="menuRowClass">
            <span [class]="menuIconClass" aria-hidden="true"><mat-icon class="mas-icon-sm">person</mat-icon></span>
            <span class="min-w-0 flex-1">
              Edit profile
              <span class="block text-xs font-normal text-ink-muted">Name, email and bio</span>
            </span>
            <mat-icon class="mas-icon-sm text-ink-muted" aria-hidden="true">chevron_right</mat-icon>
          </a>
          @if (notificationsSupported) {
            <button
              type="button"
              cdkMenuItemCheckbox
              [cdkMenuItemChecked]="notificationsEnabled()"
              [class]="menuRowClass"
              (cdkMenuItemTriggered)="toggleNotifications()"
            >
              <span [class]="menuIconClass" aria-hidden="true">
                <mat-icon class="mas-icon-sm">notifications</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                Notifications
                <span class="block text-xs font-normal text-ink-muted">Push alerts on this device</span>
              </span>
              <span
                class="relative h-5 w-9 shrink-0 rounded-full border transition-colors"
                [class]="
                  notificationsEnabled() ? 'border-brand-strong bg-brand-strong' : 'border-brand/40 bg-surface-subtle'
                "
                aria-hidden="true"
              >
                <span
                  class="absolute top-0.5 h-3.5 w-3.5 rounded-full transition-[left] motion-reduce:transition-none"
                  [class]="notificationsEnabled() ? 'left-[1.125rem] bg-brand-on' : 'left-0.5 bg-ink-subtle'"
                ></span>
              </span>
            </button>
          }
          @if (authStore.isMimicking()) {
            <button
              type="button"
              cdkMenuItem
              class="flex min-h-12 w-full items-center gap-3 rounded-xl border border-warn-ink/35 bg-warn-soft/40 py-1.5 pl-1.5 pr-2.5 text-left text-sm font-bold text-warn-ink transition-colors hover:border-warn-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              (cdkMenuItemTriggered)="authStore.stopMimickingUser()"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn-ink"
                aria-hidden="true"
              >
                <mat-icon class="mas-icon-sm">visibility_off</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                Stop mimicking
                <span class="block text-xs font-normal">Return to your own account</span>
              </span>
            </button>
          } @else if (authStore.isStaff()) {
            <button type="button" cdkMenuItem [class]="menuRowClass" (cdkMenuItemTriggered)="openMimicUserModal()">
              <span [class]="menuIconClass" aria-hidden="true">
                <mat-icon class="mas-icon-sm">visibility</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                Mimic user
                <span class="block text-xs font-normal text-ink-muted">See the app as someone else</span>
              </span>
              <mat-icon class="mas-icon-sm text-ink-muted" aria-hidden="true">chevron_right</mat-icon>
            </button>
          }
        </div>

        <div class="border-t border-outline/55 p-3">
          <button
            type="button"
            cdkMenuItem
            class="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand/25 bg-surface-raised/70 text-sm font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            (cdkMenuItemTriggered)="authStore.logout()"
          >
            <mat-icon class="mas-icon-sm" aria-hidden="true">logout</mat-icon>
            Log out
          </button>
        </div>
      </div>
    </ng-template>

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
              <p class="mb-0.5 text-xs font-semibold uppercase tracking-widest text-ink-subtle">Push Notifications</p>
              <h2 class="text-lg font-bold leading-tight text-ink">
                {{ notificationModal() === 'not-supported' ? 'Not Supported' : 'Notifications Enabled' }}
              </h2>
            </div>
            <button
              type="button"
              class="ml-4 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink"
              (click)="notificationModal.set(null)"
            >
              <mat-icon aria-hidden="true" class="mas-icon-sm">close</mat-icon>
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
  host: {
    class: 'fixed inset-x-2 top-2 z-50 block sm:inset-x-4 sm:top-3',
    '(document:click)': 'closeOnOutsideClick($event)',
    '(document:keydown.escape)': 'closeSwitcher(true)',
  },
})
export class NavComponent {
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  themeService = inject(ThemeService);
  readonly mainNavStore = inject(MainNavStore);
  readonly programsStore = inject(ProgramsStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly switcherOpen = signal(false);
  private readonly switcherButton = viewChild<ElementRef<HTMLButtonElement>>('switcherButton');
  readonly linkedSections = computed(() => this.mainNavStore.sections().filter(({ link }) => !!link));
  private push = inject(PushNotificationService);
  private platformId = inject(PLATFORM_ID);
  notificationsEnabled = signal(false);
  notificationsSupported = isPlatformBrowser(this.platformId);
  notificationModal = signal<null | 'not-supported' | 'already-enabled'>(null);
  readonly fullName = this.authStore.fullName;
  readonly accountMenuPositions = ACCOUNT_MENU_POSITIONS;
  readonly menuRowClass =
    'flex min-h-12 w-full items-center gap-3 rounded-xl border border-brand/25 bg-surface-raised/70 py-1.5 pl-1.5 pr-2.5 text-left text-sm font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
  readonly switcherRowClass =
    'flex min-h-11 w-full items-center gap-3 rounded-xl border border-brand/25 bg-surface-raised/70 py-1.5 pl-1.5 pr-2.5 text-left text-sm font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand aria-[current=page]:border-brand/70 aria-[current=page]:bg-surface-raised';
  readonly menuIconClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft/70 text-brand-strong';

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.switcherOpen.set(false));
    if (this.notificationsSupported && 'Notification' in window) {
      this.notificationsEnabled.set(Notification.permission === 'granted');
    }
  }

  toggleSwitcher() {
    const open = !this.switcherOpen();
    this.switcherOpen.set(open);
    if (open && !this.programsStore.usersPrograms().length) this.programsStore.getProgramsForUser();
  }

  closeSwitcher(restoreFocus = false) {
    if (!this.switcherOpen()) return;
    this.switcherOpen.set(false);
    if (restoreFocus) this.switcherButton()?.nativeElement.focus();
  }

  closeOnOutsideClick(event: MouseEvent) {
    if (event.target instanceof Node && !this.host.nativeElement.contains(event.target)) this.closeSwitcher();
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
    const phone = this.notificationsSupported && window.matchMedia('(max-width: 767px)').matches;
    this.dialog.open(MimicUserModalComponent, {
      panelClass: 'mas-card-dialog',
      backdropClass: 'mas-card-backdrop',
      width: '32.5rem',
      maxWidth: 'calc(100vw - 1rem)',
      position: phone ? { top: '4.5rem' } : undefined,
      ariaLabelledBy: 'mimic-user-heading',
    });
  }
}
