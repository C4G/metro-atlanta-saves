import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';

type DiscussionBoard = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  postCount: number;
};

@Component({
  selector: 'mas-dashboard',
  imports: [DatePipe, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div class="mx-auto max-w-7xl space-y-8">
        <header class="rounded-3xl border border-outline bg-surface-raised px-6 py-8 sm:px-10 sm:py-10">
          <div class="max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-strong">Your dashboard</p>
            <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Welcome back{{ firstName() ? ', ' + firstName() : '' }}.
            </h1>
            <p class="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
              Continue your program, connect with your community, or find practical tools for your next step.
            </p>
          </div>
        </header>

        <section class="grid gap-3 sm:grid-cols-3" aria-label="Dashboard overview">
          <article class="rounded-2xl border border-outline bg-surface px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <p class="text-xs font-semibold text-ink-muted">My programs</p>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                aria-hidden="true"
              >
                <mat-icon>school</mat-icon>
              </span>
            </div>
            <p class="mt-3 text-2xl font-bold text-ink">{{ programsStore.usersPrograms().length }}</p>
          </article>
          <article class="rounded-2xl border border-outline bg-surface px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <p class="text-xs font-semibold text-ink-muted">Discussion boards</p>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                aria-hidden="true"
              >
                <mat-icon>forum</mat-icon>
              </span>
            </div>
            <p class="mt-3 text-2xl font-bold text-ink">{{ boards().length }}</p>
          </article>
          <article class="rounded-2xl border border-outline bg-surface px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <p class="text-xs font-semibold text-ink-muted">Available programs</p>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                aria-hidden="true"
              >
                <mat-icon>explore</mat-icon>
              </span>
            </div>
            <p class="mt-3 text-2xl font-bold text-ink">{{ availablePrograms().length }}</p>
          </article>
        </section>

        <section class="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
          <section
            class="overflow-hidden rounded-2xl border border-outline bg-surface shadow-sm"
            aria-labelledby="my-programs-heading"
          >
            <div class="border-b border-outline px-5 py-4">
              <h2 id="my-programs-heading" class="text-base font-bold text-ink">My programs</h2>
              <p class="mt-1 text-xs text-ink-muted">Your active learning and savings spaces.</p>
            </div>
            @if (programsStore.usersPrograms().length) {
              <div class="divide-y divide-outline">
                @for (program of programsStore.usersPrograms(); track program.id) {
                  <a
                    class="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-brand-soft/35 focus-visible:bg-brand-soft/35 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                    [routerLink]="['/program-profiles', program.id]"
                  >
                    <span
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                      aria-hidden="true"
                    >
                      <mat-icon>school</mat-icon>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold text-ink">{{ program.name }}</span>
                      <span class="mt-1 block truncate text-xs text-ink-muted">
                        {{ program.description || 'Open your program to view progress and next steps.' }}
                      </span>
                    </span>
                    <mat-icon
                      class="shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-strong group-focus-visible:translate-x-0.5 group-focus-visible:text-brand-strong"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </mat-icon>
                  </a>
                }
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
                <span
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                  aria-hidden="true"
                >
                  <mat-icon>school</mat-icon>
                </span>
                <h3 class="mt-4 text-sm font-bold text-ink">No active programs yet</h3>
                <p class="mt-1 max-w-md text-sm leading-6 text-ink-muted">
                  Explore available programs and submit an enrollment request when you are ready.
                </p>
              </div>
            }
          </section>

          <aside
            class="overflow-hidden rounded-2xl border border-outline bg-surface shadow-sm"
            aria-labelledby="discussions-heading"
          >
            <div class="border-b border-outline px-5 py-4">
              <h2 id="discussions-heading" class="text-base font-bold text-ink">Stay connected</h2>
              <p class="mt-1 text-xs text-ink-muted">Conversations from your community.</p>
            </div>
            @if (topBoards().length) {
              <div class="divide-y divide-outline">
                @for (board of topBoards(); track board.id) {
                  <a
                    class="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-brand-soft/35 focus-visible:bg-brand-soft/35 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                    [routerLink]="['/discussion', board.id]"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold text-ink">{{ board.name }}</span>
                      <span class="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {{ board.description || 'Join the conversation with your community.' }}
                      </span>
                      <span class="mt-3 block text-[11px] font-medium text-ink-subtle">
                        {{ board.postCount }} posts · {{ board.memberCount }} members
                      </span>
                    </span>
                    <mat-icon
                      class="shrink-0 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-strong group-focus-visible:translate-x-0.5 group-focus-visible:text-brand-strong"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </mat-icon>
                  </a>
                }
              </div>
              <a
                class="block border-t border-outline px-5 py-3 text-center text-xs font-bold text-brand-strong hover:bg-brand-soft/50 focus-visible:bg-brand-soft/50"
                routerLink="/discussion-boards"
              >
                Open discussion boards
              </a>
            } @else {
              <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
                <span
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                  aria-hidden="true"
                >
                  <mat-icon>forum</mat-icon>
                </span>
                <p class="mt-3 text-sm text-ink-muted">No discussion boards are available yet.</p>
                <a class="mt-4 text-xs font-bold text-brand-strong hover:text-brand" routerLink="/discussion-boards">
                  Visit discussions
                </a>
              </div>
            }
          </aside>
        </section>

        <section
          class="overflow-hidden rounded-2xl border border-outline bg-surface shadow-sm"
          aria-labelledby="explore-programs-heading"
        >
          <div class="border-b border-outline px-5 py-4">
            <h2 id="explore-programs-heading" class="text-base font-bold text-ink">Explore programs</h2>
            <p class="mt-1 text-xs text-ink-muted">Opportunities that are currently accepting enrollment.</p>
          </div>
          @if (availablePrograms().length) {
            <div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              @for (program of availablePrograms(); track program.id) {
                <article
                  class="flex min-h-56 flex-col rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand/65 hover:bg-brand-soft/35 focus-within:border-brand/65 focus-within:bg-brand-soft/35"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span
                      class="rounded-full bg-brand-soft/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-strong"
                    >
                      Open enrollment
                    </span>
                    @if (program.startDate) {
                      <span class="text-[11px] text-ink-subtle">Starts {{ program.startDate | date: 'MMM d' }}</span>
                    }
                  </div>
                  <h3 class="mt-5 text-lg font-bold text-ink">{{ program.name }}</h3>
                  <div
                    class="rich-content mt-2 line-clamp-3 text-sm leading-6 text-ink-muted"
                    [innerHTML]="program.description || ''"
                  ></div>
                  <a
                    class="mt-auto pt-5 text-xs font-bold text-brand-strong hover:text-brand"
                    [routerLink]="['/enroll', program.id]"
                  >
                    View and enroll
                  </a>
                </article>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center px-6 py-12 text-center text-sm text-ink-muted">
              There are no upcoming programs right now. Check back soon.
            </div>
          }
        </section>

        <section
          class="overflow-hidden rounded-2xl border border-outline bg-surface shadow-sm"
          aria-labelledby="resources-heading"
        >
          <div class="border-b border-outline px-5 py-4">
            <h2 id="resources-heading" class="text-base font-bold text-ink">Tools and resources</h2>
            <p class="mt-1 text-xs text-ink-muted">Helpful places to learn, plan, and find support.</p>
          </div>
          <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            @for (resource of resources; track resource.path) {
              <a
                class="group flex min-h-56 flex-col rounded-2xl border border-outline bg-surface-raised p-5 transition-colors hover:border-brand/65 hover:bg-brand-soft/35 focus-visible:border-brand/65 focus-visible:bg-brand-soft/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                [routerLink]="resource.path"
              >
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong"
                  aria-hidden="true"
                >
                  <mat-icon>{{ resource.icon }}</mat-icon>
                </span>
                <h3 class="mt-5 text-sm font-bold text-ink">{{ resource.title }}</h3>
                <p class="mt-1 text-xs leading-5 text-ink-muted">{{ resource.description }}</p>
                <span class="mt-auto pt-5 text-xs font-bold text-brand-strong group-hover:text-brand">
                  {{ resource.action }}
                </span>
              </a>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  readonly authStore = inject(AuthStore);
  readonly programsStore = inject(ProgramsStore);
  readonly boards = signal<DiscussionBoard[]>([]);
  readonly firstName = computed(() => this.authStore.user()?.firstName ?? '');
  readonly topBoards = computed(() => this.boards().slice(0, 3));
  readonly availablePrograms = computed(() => {
    const enrolledProgramIds = new Set(this.programsStore.usersPrograms().map((program) => program.id));
    return this.programsStore.upcomingPrograms().filter((program) => !enrolledProgramIds.has(program.id));
  });
  readonly resources = [
    {
      path: '/savings-calculator',
      icon: 'calculate',
      title: 'Savings calculator',
      description: 'Plan a savings goal and see how regular contributions can add up.',
      action: 'Open calculator',
    },
    {
      path: '/educational-resources',
      icon: 'menu_book',
      title: 'Educational resources',
      description: 'Browse practical guidance to support your financial wellbeing.',
      action: 'Browse resources',
    },
    {
      path: '/blogs',
      icon: 'article',
      title: 'Blogs',
      description: 'Read stories, tips, and updates from the BRP community.',
      action: 'Read blogs',
    },
    {
      path: '/user-guide',
      icon: 'help_outline',
      title: 'User guide',
      description: 'Find a quick answer when you need help using the platform.',
      action: 'Open guide',
    },
  ] as const;

  constructor() {
    this.programsStore.getProgramsForUser();
    this.programsStore.getUpcoming();
    this.http.get<DiscussionBoard[]>('/api/discussion-boards').subscribe({
      next: (boards) => this.boards.set(boards),
      error: () => this.boards.set([]),
    });
  }
}
