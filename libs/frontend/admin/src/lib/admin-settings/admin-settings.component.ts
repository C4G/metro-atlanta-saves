import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

type AdminCategory = 'Access' | 'Content' | 'Operations' | 'Engagement' | 'C4G';

type AdminSection = {
  title: string;
  description: string;
  route: string;
  category: AdminCategory;
  /** Full Tailwind background/text classes — must be literal strings for JIT scanning. */
  iconColor: string;
  /** Material icon name. */
  icon: string;
};

type AdminGroup = {
  id: AdminCategory;
  label: string;
  description: string;
  icon: string;
};

@Component({
  selector: 'mas-admin-settings',
  standalone: true,
  imports: [RouterLink, NgClass, MatIcon, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-dvh flex-col bg-[#f8fafc] dark:bg-[#0c1222]">
      <section class="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <header class="mb-7">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-teal-300">
              Platform operations
            </p>
            <h1 class="text-3xl font-bold tracking-tight text-gray-950 dark:text-slate-100 sm:text-4xl">
              Admin Settings
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-slate-400">
              Manage the people, content, and tools that keep your platform running.
            </p>
          </header>

          <section class="mb-8" aria-label="Primary admin actions">
            <div class="mb-3 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-bold text-gray-900 dark:text-slate-100">Start here</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-slate-400">The most frequently managed areas.</p>
              </div>
              <span
                class="rounded-full bg-emerald-50 dark:bg-teal-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-teal-300"
              >
                Quick actions
              </span>
            </div>
            <div class="grid gap-3 md:grid-cols-3">
              @for (section of featuredSections(); track section.title) {
                <article
                  class="group relative hover:border-teal-200 dark:hover:border-teal-400/40 dark:hover:bg-[#16243a] overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-400/15 bg-white dark:bg-[#151b2e] p-5 shadow-sm dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:shadow-none"
                >
                  <div
                    class="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full opacity-60"
                    [ngClass]="section.iconColor"
                  ></div>
                  <div class="relative">
                    <div
                      class="admin-tool-icon mb-6 flex h-11 w-11 items-center justify-center rounded-xl shadow-sm dark:shadow-none"
                      [ngClass]="section.iconColor"
                    >
                      <mat-icon class="!h-5 !w-5 !text-xl !leading-5">{{ section.icon }}</mat-icon>
                    </div>
                    <h3 class="text-base font-bold text-gray-950 dark:text-slate-100">{{ section.title }}</h3>
                    <p class="mt-1.5 min-h-10 text-[13px] leading-5 text-gray-500 dark:text-slate-400">
                      {{ section.description }}
                    </p>
                    <a
                      class="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-slate-300 transition-colors hover:text-emerald-700 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 rounded"
                      [routerLink]="section.route"
                    >
                      Manage now
                      <mat-icon
                        class="!h-4 !w-4 !text-base !leading-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      >
                        arrow_forward
                      </mat-icon>
                    </a>
                  </div>
                </article>
              }
            </div>
          </section>

          <section
            class="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-400/15 bg-white dark:bg-[#151b2e] shadow-sm dark:shadow-none"
          >
            <div
              class="border-b dark:bg-[#10182a] border-gray-100 dark:border-slate-400/15 bg-gray-50/60 dark:bg-[#10182a] px-5 py-5 sm:px-6"
            >
              <h2 class="text-base font-bold text-gray-950 dark:text-slate-100">Choose what you want to manage</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Start with an area, then select the task you need.
              </p>
              <label class="relative mt-4 block">
                <mat-icon
                  class="pointer-events-none absolute left-3.5 top-1/2 !h-5 !w-5 -translate-y-1/2 !text-xl !leading-5 text-gray-400 dark:text-slate-500"
                >
                  search
                </mat-icon>
                <input
                  type="search"
                  class="w-full rounded-xl border border-gray-200 dark:border-slate-400/15 bg-white dark:bg-[#151b2e] py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-slate-100 outline-none transition-colors placeholder:text-gray-400 dark:text-slate-500 shadow-sm dark:shadow-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50"
                  placeholder="Search users, partners, email..."
                  [value]="searchQuery()"
                  (input)="setSearchQuery($event)"
                />
              </label>
              <div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Setting categories">
                <button
                  type="button"
                  class="settings-category-button flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors [&.settings-category-inactive]:border-gray-200 [&.settings-category-inactive]:bg-white [&.settings-category-inactive]:text-gray-600 hover:[&.settings-category-inactive]:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:[&.settings-category-inactive]:border-slate-400/15 dark:[&.settings-category-inactive]:bg-[#151b2e] dark:[&.settings-category-inactive]:text-slate-300 dark:hover:[&.settings-category-inactive]:bg-[#1b2940] dark:[&.settings-category-inactive_.mat-icon]:text-teal-300"
                  [class.border-gray-950]="activeCategory() === 'All'"
                  [class.bg-gray-950]="activeCategory() === 'All'"
                  [class.text-white]="activeCategory() === 'All'"
                  [class.settings-category-inactive]="activeCategory() !== 'All'"
                  (click)="setActiveCategory('All')"
                >
                  <mat-icon class="!h-5 !w-5 !text-xl !leading-5">grid_view</mat-icon>
                  <span class="min-w-0">
                    <span class="block text-xs font-bold">All tools</span>
                    <span class="mt-0.5 block text-[10px] opacity-70">Browse everything</span>
                  </span>
                </button>
                @for (group of groups; track group.id) {
                  <button
                    type="button"
                    class="settings-category-button flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors [&.settings-category-inactive]:border-gray-200 [&.settings-category-inactive]:bg-white [&.settings-category-inactive]:text-gray-600 hover:[&.settings-category-inactive]:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:[&.settings-category-inactive]:border-slate-400/15 dark:[&.settings-category-inactive]:bg-[#151b2e] dark:[&.settings-category-inactive]:text-slate-300 dark:hover:[&.settings-category-inactive]:bg-[#1b2940] dark:[&.settings-category-inactive_.mat-icon]:text-teal-300"
                    [class.border-gray-950]="activeCategory() === group.id"
                    [class.bg-gray-950]="activeCategory() === group.id"
                    [class.text-white]="activeCategory() === group.id"
                    [class.settings-category-inactive]="activeCategory() !== group.id"
                    (click)="setActiveCategory(group.id)"
                  >
                    <mat-icon class="!h-5 !w-5 !text-xl !leading-5">{{ group.icon }}</mat-icon>
                    <span class="min-w-0">
                      <span class="block text-xs font-bold">{{ group.label }}</span>
                      <span class="mt-0.5 block truncate text-[10px] opacity-70">{{ group.description }}</span>
                    </span>
                  </button>
                }
              </div>
            </div>
            <div>
              @if (groupedSections().length === 0) {
                <div class="flex flex-col items-center px-6 py-16 text-center">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-[#1b2940] text-gray-400 dark:text-slate-500"
                  >
                    <mat-icon>search_off</mat-icon>
                  </div>
                  <h3 class="mt-4 text-sm font-bold text-gray-900 dark:text-slate-100">No settings found</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Try another search term or management area.
                  </p>
                </div>
              } @else {
                <div class="divide-y divide-gray-100 dark:divide-slate-400/15 p-5 sm:p-6">
                  @for (group of groupedSections(); track group.id) {
                    <section class="py-8 first:pt-0 last:pb-0">
                      <div class="mb-3 flex items-center gap-2">
                        <div
                          class="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1b2940] text-gray-500 dark:text-slate-400"
                        >
                          <mat-icon class="!h-4 !w-4 !text-base !leading-4">{{ group.icon }}</mat-icon>
                        </div>
                        <div>
                          <h3 class="text-xs font-bold text-gray-900 dark:text-slate-100">{{ group.label }}</h3>
                          <p class="text-[11px] text-gray-500 dark:text-slate-400">{{ group.description }}</p>
                        </div>
                      </div>
                      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        @for (section of group.sections; track section.title) {
                          <a
                            class="group flex hover:border-teal-200 dark:hover:border-teal-400/40 dark:hover:bg-[#16243a] min-h-40 flex-col rounded-xl border border-gray-200 dark:border-slate-400/15 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            [routerLink]="section.route"
                          >
                            <div class="flex items-start justify-between gap-3">
                              <div
                                class="admin-tool-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                [ngClass]="section.iconColor"
                              >
                                <mat-icon class="!h-5 !w-5 !text-xl !leading-5">{{ section.icon }}</mat-icon>
                              </div>
                            </div>
                            <div class="mt-4">
                              <p class="text-sm font-bold text-gray-900 dark:text-slate-100">{{ section.title }}</p>
                              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-slate-400">
                                {{ section.description }}
                              </p>
                            </div>
                          </a>
                        }
                      </div>
                    </section>
                  }
                </div>
              }
            </div>
          </section>
        </div>

        @if (showUsersModal()) {
          <div
            class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            (click)="closeUsersModal()"
          >
            <div
              class="relative flex max-h-[75dvh] w-full animate-[sheet-slide-up_0.35s_cubic-bezier(0.32,0.72,0,1)] flex-col rounded-t-2xl bg-white shadow-2xl motion-reduce:animate-none dark:bg-[#151b2e] sm:max-h-[85vh] sm:max-w-md sm:animate-[modal-scale-in_0.22s_ease-out] sm:rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-users-modal-title"
              (click)="$event.stopPropagation()"
            >
              <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-1 sm:hidden" aria-hidden="true"></div>

              <div
                class="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-400/15"
              >
                <div>
                  <p
                    class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-0.5"
                  >
                    Admin Settings
                  </p>
                  <h2
                    id="admin-users-modal-title"
                    class="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight"
                  >
                    Users
                  </h2>
                </div>
                <button
                  type="button"
                  class="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-[#1b2940] dark:bg-[#1b2940] hover:text-gray-600 dark:text-slate-300 transition-colors ml-4 mt-0.5 shrink-0"
                  aria-label="Close users"
                  (click)="closeUsersModal()"
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

              <div class="flex-1 overflow-auto px-5 py-5">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                    Current Users
                  </p>
                </div>

                <div class="space-y-1">
                  @if (usersStore.usersLoading()) {
                    <div
                      class="flex items-center justify-center gap-2 py-4 text-[13px] text-gray-400 dark:text-slate-500"
                    >
                      <svg
                        class="animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Loading users...
                    </div>
                  } @else if (sortedUsers().length === 0) {
                    <p class="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No users yet.</p>
                  } @else {
                    @for (user of sortedUsers(); track user.id) {
                      <div
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                        [class]="
                          isStaff(user.role)
                            ? 'bg-amber-50 hover:bg-amber-100/60'
                            : 'hover:bg-gray-50 dark:hover:bg-[#1b2940]'
                        "
                      >
                        <div
                          class="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                          [class]="
                            isStaff(user.role) ? 'bg-amber-500 dark:bg-teal-500' : 'bg-blue-500 dark:bg-teal-500'
                          "
                        >
                          <span class="text-[11px] font-bold text-white">
                            {{ userInitials(user.firstName, user.lastName, user.email) }}
                          </span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <p class="text-[13px] font-semibold text-gray-900 dark:text-slate-100 truncate">
                              {{ user.firstName }} {{ user.lastName }}
                            </p>
                            @if (isStaff(user.role)) {
                              <span
                                class="inline-flex items-center rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 shrink-0"
                              >
                                Staff
                              </span>
                            }
                          </div>
                          <p class="text-[11px] text-gray-400 dark:text-slate-500 truncate">{{ user.email }}</p>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </section>
      <mas-footer />
    </div>
  `,
  host: { class: 'block' },
})
export default class AdminSettingsComponent {
  readonly usersStore = inject(UsersStore);
  readonly showUsersModal = signal(false);
  readonly searchQuery = signal('');
  readonly activeCategory = signal<AdminCategory | 'All'>('All');
  readonly groups: readonly AdminGroup[] = [
    { id: 'Access', label: 'People & access', description: 'Users and permissions', icon: 'manage_accounts' },
    { id: 'Operations', label: 'Operations', description: 'Programs and partners', icon: 'settings_suggest' },
    { id: 'Content', label: 'Content & guidance', description: 'Pages, learning, and guides', icon: 'menu_book' },
    { id: 'Engagement', label: 'Engagement', description: 'Outreach and campaigns', icon: 'campaign' },
    { id: 'C4G', label: 'C4G Team Only', description: 'Internal team tools', icon: 'groups' },
  ];
  readonly sortedUsers = computed(() =>
    [...this.usersStore.users()].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    ),
  );
  readonly filteredSections = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    return this.sections.filter(
      (section) =>
        (this.activeCategory() === 'All' || section.category === this.activeCategory()) &&
        (!query || `${section.title} ${section.description} ${section.category}`.toLowerCase().includes(query)),
    );
  });
  readonly featuredSections = computed(() =>
    this.sections.filter((section) =>
      ['/admin/users', '/admin/partners', '/admin/education-management'].includes(section.route),
    ),
  );
  readonly groupedSections = computed(() =>
    this.groups
      .map((group) => ({
        ...group,
        sections: this.filteredSections().filter((section) => section.category === group.id),
      }))
      .filter((group) => group.sections.length > 0),
  );

  isUsersSection(section: AdminSection): boolean {
    return section.route === '/admin/users';
  }

  openUsersModal(): void {
    this.showUsersModal.set(true);
    this.usersStore.getUsers();
  }

  closeUsersModal(): void {
    this.showUsersModal.set(false);
  }

  setSearchQuery(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setActiveCategory(category: AdminCategory | 'All'): void {
    this.activeCategory.set(category);
  }

  isStaff(role: string | null): boolean {
    return role === 'Administrator' || role === 'Partner_Staff';
  }

  userInitials(firstName: string, lastName: string, email: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.trim() || email.charAt(0).toUpperCase();
  }

  readonly sections: AdminSection[] = [
    {
      title: 'Users',
      description: 'Manage users, assign roles, and control platform access across programs.',
      route: '/admin/users',
      category: 'Access',
      iconColor: 'bg-blue-50 text-blue-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'manage_accounts',
    },
    {
      title: 'Partners',
      description: 'Add, edit, and manage partner organizations linked to savings programs.',
      route: '/admin/partners',
      category: 'Operations',
      iconColor: 'bg-emerald-50 dark:bg-teal-400/10 text-emerald-600 dark:text-teal-300',
      icon: 'handshake',
    },
    {
      title: 'Blogs',
      description: 'Create and publish blog posts to educate and engage platform users.',
      route: '/admin/blogs',
      category: 'Content',
      iconColor: 'bg-violet-50 text-violet-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'article',
    },
    {
      title: 'Education Management',
      description: 'Manage educational content and categories for program participants.',
      route: '/admin/education-management',
      category: 'Content',
      iconColor: 'bg-orange-50 text-orange-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'school',
    },
    {
      title: 'Home Management',
      description: 'Update stories, learnings, descriptions, and the introduction on the home page.',
      route: '/admin/home-management',
      category: 'Content',
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'home',
    },
    {
      title: 'About Us Management',
      description: 'Manage cohorts and content displayed on the About Us page.',
      route: '/admin/about-us-management',
      category: 'Content',
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'groups',
    },
    {
      title: 'User Guide',
      description: 'Manage the user guide content available to platform participants.',
      route: '/admin/user-guide',
      category: 'Content',
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'menu_book',
    },
    {
      title: 'Checkpoint Names',
      description: 'Configure checkpoint names used to track progress across savings programs.',
      route: '/admin/checkpoint-names',
      category: 'Operations',
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'checklist',
    },
    {
      title: 'Email Campaign',
      description: 'Send targeted email campaigns to all enrolled program participants.',
      route: '/admin/email-blast',
      category: 'Engagement',
      iconColor: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'campaign',
    },
    {
      title: 'Peer Evaluation Guide',
      description: 'Manage peer evaluation guides used in program assessments and reviews.',
      route: '/admin/peer-evaluation-guide',
      category: 'C4G',
      iconColor: 'bg-red-50 text-red-600 dark:bg-teal-400/10 dark:text-teal-300',
      icon: 'fact_check',
    },
  ];
}
