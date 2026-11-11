import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageTitleComponent, SectionPanelComponent } from '@mas/frontend-shared-components';

export type AdminArea = {
  title: string;
  description: string;
  route: string;
};

export type AdminGroup = {
  id: string;
  title: string;
  searchLabel: string;
  internal?: boolean;
  areas: readonly AdminArea[];
};

export const ADMIN_GROUPS: readonly AdminGroup[] = [
  {
    id: 'people',
    title: 'People & organizations',
    searchLabel: 'Search people & organizations',
    areas: [
      { title: 'Users', description: 'Manage accounts, roles, and partner assignments.', route: '/admin/users' },
      {
        title: 'Partners',
        description: 'Manage organizations and their staff relationships.',
        route: '/admin/partners',
      },
    ],
  },
  {
    id: 'programs',
    title: 'Program operations',
    searchLabel: 'Search program operations',
    areas: [
      {
        title: 'Programs',
        description: 'Create programs and manage their participants and requirements.',
        route: '/partner-staff/programs',
      },
      {
        title: 'Checkpoint names',
        description: 'Configure the checkpoint labels available across programs.',
        route: '/admin/checkpoint-names',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content & guidance',
    searchLabel: 'Search content & guidance',
    areas: [
      { title: 'Blogs', description: 'Create and publish educational articles.', route: '/admin/blogs' },
      {
        title: 'Educational resources',
        description: 'Organize learning content, categories, and notifications.',
        route: '/admin/education-management',
      },
      {
        title: 'Landing page',
        description: 'Update stories and key landing-page content.',
        route: '/admin/home-management',
      },
      { title: 'About Us', description: 'Manage cohorts and About Us content.', route: '/admin/about-us-management' },
      {
        title: 'User guide',
        description: 'Maintain guidance available to platform participants.',
        route: '/admin/user-guide',
      },
    ],
  },
  {
    id: 'engagement',
    title: 'Participant engagement',
    searchLabel: 'Search participant engagement',
    areas: [
      {
        title: 'Email campaign',
        description: 'Prepare and send a platform-wide participant email.',
        route: '/admin/email-blast',
      },
    ],
  },
  {
    id: 'c4g',
    title: 'C4G team only',
    searchLabel: 'Search C4G tools',
    internal: true,
    areas: [
      {
        title: 'Peer Evaluation Guide',
        description: 'Maintain the internal guide used for peer evaluations.',
        route: '/admin/peer-evaluation-guide',
      },
    ],
  },
];

export const filterAdminAreas = (areas: readonly AdminArea[], query: string): readonly AdminArea[] => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return areas;
  return areas.filter((area) => `${area.title} ${area.description}`.toLocaleLowerCase().includes(needle));
};

@Component({
  selector: 'mas-admin-settings',
  imports: [MatIcon, PageTitleComponent, RouterLink, SectionPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-8">
        <mas-page-title title="Admin" />

        @for (group of visibleGroups(); track group.id) {
          <mas-section-panel [heading]="group.title" [headingId]="group.id" [tag]="group.internal ? 'Internal' : ''">
            <label panelActions class="relative block w-full sm:w-72">
              <span class="sr-only">{{ group.searchLabel }}</span>
              <mat-icon
                class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              >
                search
              </mat-icon>
              <input
                type="search"
                class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 hover:bg-surface-raised focus:border-brand/70 focus:bg-surface-raised focus-visible:ring-2 focus-visible:ring-brand"
                [placeholder]="group.searchLabel"
                [value]="group.query"
                (input)="updateSearch(group.id, $event)"
              />
            </label>

            @if (group.areas.length) {
              <div class="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                @for (area of group.areas; track area.route) {
                  <a
                    class="group flex min-h-16 items-center gap-3 rounded-xl border border-brand/25 bg-surface-raised/70 py-3 pl-4 pr-3 text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [routerLink]="area.route"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm font-bold">{{ area.title }}</span>
                      <span class="mt-0.5 block text-xs text-ink-muted">{{ area.description }}</span>
                    </span>
                    <mat-icon
                      class="mas-icon-md text-ink-muted transition-colors group-hover:text-brand-strong"
                      aria-hidden="true"
                    >
                      chevron_right
                    </mat-icon>
                  </a>
                }
              </div>
            } @else {
              <p class="px-5 py-8 text-center text-sm text-ink-muted">No matches in this section.</p>
            }
          </mas-section-panel>
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export default class AdminSettingsComponent {
  readonly queries = signal<Record<string, string>>({});
  readonly visibleGroups = computed(() =>
    ADMIN_GROUPS.map((group) => {
      const query = this.queries()[group.id] ?? '';
      return { ...group, query, areas: filterAdminAreas(group.areas, query) };
    }),
  );

  updateSearch(groupId: string, event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.queries.update((queries) => ({ ...queries, [groupId]: query }));
  }
}
