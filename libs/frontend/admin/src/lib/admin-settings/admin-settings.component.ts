import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

type AdminArea = {
  title: string;
  description: string;
  route: string;
  icon: string;
  searchText: string;
};

type AdminGroup = {
  id: string;
  title: string;
  description: string;
  icon: string;
  areas: readonly AdminArea[];
};

const createArea = (title: string, description: string, route: string, icon: string): AdminArea => ({
  title,
  description,
  route,
  icon,
  searchText: `${title} ${description}`.toLocaleLowerCase(),
});

const ADMIN_GROUPS: readonly AdminGroup[] = [
  {
    id: 'people',
    title: 'People & organizations',
    description: 'Manage platform access and the organizations delivering each program.',
    icon: 'groups',
    areas: [
      createArea('Users', 'Manage accounts, roles, and partner assignments.', '/admin/users', 'manage_accounts'),
      createArea('Partners', 'Manage organizations and their staff relationships.', '/admin/partners', 'handshake'),
    ],
  },
  {
    id: 'programs',
    title: 'Program operations',
    description: 'Set up programs and the shared checkpoints used to measure progress.',
    icon: 'settings_suggest',
    areas: [
      createArea(
        'Programs',
        'Create programs and manage their participants and requirements.',
        '/partner-staff/programs',
        'folder_managed',
      ),
      createArea(
        'Checkpoint names',
        'Configure the checkpoint labels available across programs.',
        '/admin/checkpoint-names',
        'checklist',
      ),
    ],
  },
  {
    id: 'content',
    title: 'Content & guidance',
    description: 'Keep participant-facing information accurate, useful, and current.',
    icon: 'menu_book',
    areas: [
      createArea('Blogs', 'Create and publish educational articles.', '/admin/blogs', 'article'),
      createArea(
        'Educational resources',
        'Organize learning content, categories, and notifications.',
        '/admin/education-management',
        'school',
      ),
      createArea('Landing page', 'Update stories and key landing-page content.', '/admin/home-management', 'home'),
      createArea('About Us', 'Manage cohorts and About Us content.', '/admin/about-us-management', 'diversity_3'),
      createArea(
        'User guide',
        'Maintain guidance available to platform participants.',
        '/admin/user-guide',
        'help_center',
      ),
    ],
  },
  {
    id: 'engagement',
    title: 'Participant engagement',
    description: 'Communicate important information to the people in your programs.',
    icon: 'campaign',
    areas: [
      createArea('Email campaign', 'Prepare and send a platform-wide participant email.', '/admin/email-blast', 'mail'),
    ],
  },
  {
    id: 'c4g',
    title: 'C4G team only',
    description: 'Internal tools maintained by the C4G team.',
    icon: 'verified_user',
    areas: [
      createArea(
        'Peer Evaluation Guide',
        'Maintain the internal guide used for peer evaluations.',
        '/admin/peer-evaluation-guide',
        'fact_check',
      ),
    ],
  },
];

@Component({
  selector: 'mas-admin-settings',
  imports: [MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <header class="rounded-3xl border border-outline bg-surface-raised px-6 py-8 sm:px-10 sm:py-10">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div class="max-w-2xl">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">Platform administration</p>
              <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Admin Dashboard
              </h1>
              <p class="mt-3 text-sm leading-6 text-ink-muted">
                Choose the part of the platform you want to manage. Tools are grouped by the work they support.
              </p>
            </div>

            <label class="relative block">
              <span class="sr-only">Search admin tools</span>
              <mat-icon
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              >
                search
              </mat-icon>
              <input
                type="search"
                class="min-h-11 w-full rounded-xl border border-outline bg-surface py-2.5 pl-11 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
                placeholder="Search management tools"
                [value]="searchQuery()"
                (input)="updateSearch($event)"
              />
            </label>
          </div>
        </header>

        @if (visibleGroups().length) {
          <div class="space-y-5">
            @for (group of visibleGroups(); track group.id) {
              <section
                class="overflow-hidden rounded-3xl border border-outline bg-surface"
                [attr.aria-labelledby]="group.id"
              >
                <div class="flex items-start gap-4 border-b border-outline bg-surface-subtle px-5 py-5 sm:px-6">
                  <span
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"
                  >
                    <mat-icon aria-hidden="true">{{ group.icon }}</mat-icon>
                  </span>
                  <div>
                    <h2 [id]="group.id" class="text-lg font-bold text-ink">{{ group.title }}</h2>
                    <p class="mt-1 text-sm leading-5 text-ink-muted">{{ group.description }}</p>
                  </div>
                </div>

                <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                  @for (area of group.areas; track area.route) {
                    <a
                      class="group flex min-h-40 flex-col rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand hover:bg-brand-soft/35 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
                      [routerLink]="area.route"
                    >
                      <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong transition-colors group-hover:bg-brand group-hover:text-brand-on"
                      >
                        <mat-icon aria-hidden="true">{{ area.icon }}</mat-icon>
                      </span>
                      <span class="mt-4 text-base font-bold text-ink">{{ area.title }}</span>
                      <span class="mt-1 text-sm leading-5 text-ink-muted">{{ area.description }}</span>
                      <span class="mt-auto pt-4 text-xs font-bold text-brand-strong">Open management area</span>
                    </a>
                  }
                </div>
              </section>
            }
          </div>
        } @else {
          <section class="rounded-3xl border border-outline bg-surface px-6 py-16 text-center" aria-live="polite">
            <span
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong"
            >
              <mat-icon aria-hidden="true">search_off</mat-icon>
            </span>
            <h2 class="mt-4 text-lg font-bold text-ink">No management tools found</h2>
            <p class="mt-1 text-sm text-ink-muted">Try a broader search such as users, programs, or content.</p>
            <button
              type="button"
              class="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-outline bg-surface-raised px-4 text-sm font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
              (click)="clearSearch()"
            >
              Clear search
            </button>
          </section>
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class AdminSettingsComponent {
  readonly searchQuery = signal('');
  readonly visibleGroups = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    if (!query) return ADMIN_GROUPS;

    return ADMIN_GROUPS.map((group) => ({
      ...group,
      areas: group.areas.filter(
        (area) =>
          area.searchText.includes(query) ||
          group.title.toLocaleLowerCase().includes(query) ||
          group.description.toLocaleLowerCase().includes(query),
      ),
    })).filter((group) => group.areas.length);
  });

  clearSearch(): void {
    this.searchQuery.set('');
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
