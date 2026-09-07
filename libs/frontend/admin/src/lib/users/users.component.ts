import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AddUserComponent } from '@mas/frontend-shared-components';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { type UserFull } from '@mas/models';

type UserRoleFilter = 'All' | 'Administrator' | 'Partner_Staff' | 'Participant';

@Component({
  selector: 'mas-users',
  imports: [MatDialogModule, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-dvh bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <nav class="mb-5 flex items-center gap-2 text-xs font-medium text-gray-400" aria-label="Breadcrumb">
          <a
            class="rounded text-gray-500 transition-colors hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            routerLink="/admin"
          >
            Admin Settings
          </a>
          <span aria-hidden="true">/</span>
          <span class="text-gray-600">Users</span>
        </nav>
        <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">People & access</p>
            <h1 class="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Users</h1>
            <p class="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Manage platform access, staff roles, and the people enrolled in your programs.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            (click)="openModal()"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-[18px]">person_add</mat-icon>
            New user
          </button>
        </header>

        <section class="mb-7 grid gap-3 sm:grid-cols-3" aria-label="User overview">
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Total users</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">groups</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ usersStore.users().length }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Staff members</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">admin_panel_settings</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ staffCount() }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Verified email</p>
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <mat-icon class="!h-[17px] !w-[17px] !text-[17px] !leading-[17px]">verified_user</mat-icon>
              </div>
            </div>
            <p class="mt-3 text-2xl font-bold tracking-tight text-gray-950">{{ verifiedCount() }}</p>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-4 border-b border-gray-100 px-5 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-sm font-bold text-gray-900">User directory</h2>
                <p class="mt-0.5 text-xs text-gray-500">
                  {{ filteredUsers().length }} of {{ usersStore.users().length }} people shown
                </p>
              </div>
              <label class="relative block w-full sm:w-72">
                <mat-icon
                  class="pointer-events-none absolute left-3 top-1/2 !h-4 !w-4 -translate-y-1/2 !text-base !leading-4 text-gray-400"
                >
                  search
                </mat-icon>
                <input
                  type="search"
                  class="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  placeholder="Search people or roles..."
                  [value]="searchQuery()"
                  (input)="setSearchQuery($event)"
                />
              </label>
            </div>
            <div class="flex gap-2 overflow-x-auto pb-0.5" aria-label="Filter users by role">
              @for (filter of roleFilters; track filter.id) {
                <button
                  type="button"
                  class="min-w-max rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  [class.border-gray-950]="roleFilter() === filter.id"
                  [class.bg-gray-950]="roleFilter() === filter.id"
                  [class.text-white]="roleFilter() === filter.id"
                  [class.border-gray-200]="roleFilter() !== filter.id"
                  [class.bg-white]="roleFilter() !== filter.id"
                  [class.text-gray-600]="roleFilter() !== filter.id"
                  (click)="setRoleFilter(filter.id)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>
          </div>
          @if (usersStore.usersLoading()) {
            <div class="flex items-center justify-center gap-2 px-6 py-16 text-sm text-gray-500">
              <mat-icon class="animate-spin text-emerald-600">progress_activity</mat-icon>
              Loading users...
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="flex flex-col items-center px-6 py-16 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <mat-icon>person_search</mat-icon>
              </div>
              <h3 class="mt-4 text-sm font-bold text-gray-900">
                {{ usersStore.users().length === 0 ? 'No users yet' : 'No users found' }}
              </h3>
              <p class="mt-1 max-w-sm text-sm leading-6 text-gray-500">
                {{
                  usersStore.users().length === 0
                    ? 'Add the first user to give someone access to the platform.'
                    : 'Try a different search term or clear the search to view everyone.'
                }}
              </p>
              @if (usersStore.users().length === 0) {
                <button
                  type="button"
                  class="mt-5 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                  (click)="openModal()"
                >
                  Add user
                </button>
              }
            </div>
          } @else {
            <div class="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-3">
              @for (user of filteredUsers(); track user.id) {
                <article
                  class="group flex min-h-64 flex-col bg-white p-5 transition-all duration-200 hover:bg-gray-50/70"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 items-center gap-3">
                      <div
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-sm"
                      >
                        {{ userInitials(user) }}
                      </div>
                      <div class="min-w-0">
                        <h3 class="truncate text-[15px] font-bold text-gray-950">{{ userName(user) }}</h3>
                        <p class="mt-0.5 truncate text-xs text-gray-500">{{ user.email }}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      [attr.aria-label]="'Edit ' + userName(user)"
                      title="Edit user"
                      (click)="editUser(user)"
                    >
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4">edit</mat-icon>
                    </button>
                  </div>
                  <div class="mt-5 flex flex-wrap gap-2">
                    <span
                      class="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide"
                      [class.bg-amber-100]="isStaff(user)"
                      [class.text-amber-700]="isStaff(user)"
                      [class.bg-gray-100]="!isStaff(user)"
                      [class.text-gray-600]="!isStaff(user)"
                    >
                      {{ roleLabel(user.role) }}
                    </span>
                    @if (user.partnerId) {
                      <span
                        class="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700"
                      >
                        Partner linked
                      </span>
                    }
                  </div>
                  <div class="mt-6 flex-1">
                    <div class="flex items-center gap-2 text-xs text-gray-500">
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4 text-gray-400">
                        {{ user.emailVerified ? 'verified' : 'mail_outline' }}
                      </mat-icon>
                      {{ user.emailVerified ? 'Email verified' : 'Email not verified' }}
                    </div>
                    @if (user.lastLogin) {
                      <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <mat-icon class="!h-4 !w-4 !text-base !leading-4 text-gray-400">login</mat-icon>
                        Last active {{ relativeDate(user.lastLogin) }}
                      </div>
                    } @else {
                      <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <mat-icon class="!h-4 !w-4 !text-base !leading-4">schedule</mat-icon>
                        Has not signed in yet
                      </div>
                    }
                  </div>
                  <div class="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p class="text-[10px] font-medium text-gray-400" [title]="formatDate(user.createdAt)">
                      Joined {{ relativeDate(user.createdAt) }}
                    </p>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 text-xs font-bold text-gray-700 transition-colors hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      (click)="editUser(user)"
                    >
                      Manage
                      <mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-3.5">arrow_forward</mat-icon>
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </section>
    </main>
  `,
  host: { class: 'block' },
})
export default class UsersComponent {
  private readonly dialog = inject(MatDialog);
  readonly usersStore = inject(UsersStore);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRoleFilter>('All');
  readonly roleFilters: readonly { id: UserRoleFilter; label: string }[] = [
    { id: 'All', label: 'All users' },
    { id: 'Administrator', label: 'Administrators' },
    { id: 'Partner_Staff', label: 'Partner staff' },
    { id: 'Participant', label: 'Participants' },
  ];
  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const users = [...this.usersStore.users()].sort((a, b) => this.userName(a).localeCompare(this.userName(b)));
    return users.filter(
      (user) =>
        this.matchesRoleFilter(user) &&
        (!query ||
          [this.userName(user), user.email, user.role, user.partnerId]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(query))),
    );
  });
  readonly staffCount = computed(() => this.usersStore.users().filter((user) => this.isStaff(user)).length);
  readonly verifiedCount = computed(() => this.usersStore.users().filter((user) => user.emailVerified).length);

  constructor() {
    this.usersStore.getUsers();
  }
  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
  setRoleFilter(filter: UserRoleFilter): void {
    this.roleFilter.set(filter);
  }
  openModal(): void {
    this.dialog.open(AddUserComponent, { panelClass: 'w-full' });
  }
  editUser(user: UserFull): void {
    this.dialog.open(AddUserComponent, { data: user, panelClass: 'w-full' });
  }
  isStaff(user: UserFull): boolean {
    return user.role === 'Administrator' || user.role === 'Partner_Staff';
  }
  matchesRoleFilter(user: UserFull): boolean {
    return (
      this.roleFilter() === 'All' ||
      (this.roleFilter() === 'Participant' ? user.role === null : user.role === this.roleFilter())
    );
  }
  roleLabel(role: UserFull['role']): string {
    return role === 'Administrator' ? 'Administrator' : role === 'Partner_Staff' ? 'Partner staff' : 'Participant';
  }
  userName(user: UserFull): string {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }
  userInitials(user: UserFull): string {
    return this.userName(user)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
  formatDate(value: Date | string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
  }
  relativeDate(value: Date | string): string {
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return this.formatDate(value);
  }
}
