import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore, ThemeService } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';

type DiscussionBoard = { id: string; name: string; description: string | null; memberCount: number; postCount: number };

@Component({
  selector: 'mas-dashboard',
  imports: [DatePipe, MatIcon, RouterLink, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="dashboard-page min-h-dvh bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <section class="mx-auto max-w-7xl">
        <header
          class="dashboard-hero relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-9 text-white sm:px-10 sm:py-12"
        >
          <div class="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-2xl"></div>
          <div class="relative max-w-2xl">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Your dashboard</p>
            <h1 class="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back{{ authStore.user()?.firstName ? ', ' + authStore.user()?.firstName : '' }}.
            </h1>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              Pick up where you left off: review your program, connect with your community, or find your next
              opportunity.
            </p>
          </div>
        </header>

        <section class="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Dashboard overview">
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">My programs</p>
              <mat-icon class="text-teal-700">school</mat-icon>
            </div>
            <p class="mt-3 text-2xl font-bold text-slate-950">{{ programsStore.usersPrograms().length }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Discussion boards</p>
              <mat-icon class="text-sky-700">forum</mat-icon>
            </div>
            <p class="mt-3 text-2xl font-bold text-slate-950">{{ boards().length }}</p>
          </div>
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-gray-500">Available programs</p>
              <mat-icon class="text-amber-600">explore</mat-icon>
            </div>
            <p class="mt-3 text-2xl font-bold text-slate-950">{{ availablePrograms().length }}</p>
          </div>
        </section>

        <section class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-100 px-5 py-4">
              <h2 class="text-base font-bold text-slate-950">My programs</h2>
              <p class="mt-0.5 text-xs text-gray-500">Your active learning and savings spaces.</p>
            </div>
            @if (programsStore.usersPrograms().length) {
              <div class="divide-y divide-gray-100">
                @for (program of programsStore.usersPrograms(); track program.id) {
                  <a
                    class="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400"
                    [routerLink]="['/program-profiles', program.id]"
                  >
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"
                    >
                      <mat-icon>school</mat-icon>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate text-sm font-bold text-slate-900">{{ program.name }}</h3>
                      <p class="mt-1 line-clamp-1 text-xs text-slate-500">
                        {{ program.description || 'Open your program to view your progress and next steps.' }}
                      </p>
                    </div>
                    <mat-icon
                      class="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700"
                    >
                      arrow_forward
                    </mat-icon>
                  </a>
                }
              </div>
            } @else {
              <div class="px-6 py-12 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <mat-icon>school</mat-icon>
                </div>
                <h3 class="mt-4 text-sm font-bold text-slate-900">No active programs yet</h3>
                <p class="mt-1 text-sm leading-6 text-slate-500">
                  Explore available programs and submit an enrollment request when you are ready.
                </p>
              </div>
            }
          </div>
          <aside class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div class="border-b border-gray-100 px-5 py-4">
              <h2 class="text-base font-bold text-slate-950">Stay connected</h2>
              <p class="mt-0.5 text-xs text-gray-500">Your discussion community.</p>
            </div>
            @if (boards().length) {
              <div class="divide-y divide-gray-100">
                @for (board of boards().slice(0, 3); track board.id) {
                  <a
                    class="group block px-5 py-4 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400"
                    [routerLink]="['/discussion', board.id]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3 class="truncate text-sm font-bold text-slate-900">{{ board.name }}</h3>
                        <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {{ board.description || 'Join the conversation with your community.' }}
                        </p>
                      </div>
                      <mat-icon class="!h-4 !w-4 !text-base !leading-4 text-gray-300 group-hover:text-teal-700">
                        arrow_forward
                      </mat-icon>
                    </div>
                    <p class="mt-3 text-[11px] font-medium text-gray-400">
                      {{ board.postCount }} posts · {{ board.memberCount }} members
                    </p>
                  </a>
                }
              </div>
              <a
                class="block border-t border-gray-100 px-5 py-3 text-center text-xs font-bold text-teal-700 hover:bg-teal-50"
                routerLink="/discussion-boards"
              >
                Open discussion boards
              </a>
            } @else {
              <div class="px-5 py-10 text-center">
                <mat-icon class="text-gray-300">forum</mat-icon>
                <p class="mt-2 text-sm text-gray-500">No discussion boards are available yet.</p>
                <a class="mt-4 inline-block text-xs font-bold text-teal-700" routerLink="/discussion-boards">
                  Visit discussions
                </a>
              </div>
            }
          </aside>
        </section>

        <section class="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 class="text-base font-bold text-slate-950">Explore programs</h2>
              <p class="mt-0.5 text-xs text-gray-500">Opportunities that are currently accepting enrollment.</p>
            </div>
          </div>
          @if (availablePrograms().length) {
            <div class="grid gap-px bg-gray-100 md:grid-cols-2 xl:grid-cols-3">
              @for (program of availablePrograms(); track program.id) {
                <article
                  class="dashboard-interactive-card flex min-h-56 flex-col rounded-2xl border border-transparent bg-white p-5 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div class="flex items-center justify-between gap-3">
                    <span
                      class="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800"
                    >
                      Open enrollment
                    </span>
                    @if (program.startDate) {
                      <span class="text-[11px] text-gray-400">Starts {{ program.startDate | date: 'MMM d' }}</span>
                    }
                  </div>
                  <h3 class="mt-5 text-lg font-bold text-slate-950">{{ program.name }}</h3>
                  <div
                    class="wysiwyg mt-2 line-clamp-3 text-sm leading-6 text-slate-500"
                    [innerHTML]="sanitizer.bypassSecurityTrustHtml(program.description || '')"
                  ></div>
                  <a
                    class="mt-auto pt-5 text-xs font-bold text-teal-700 hover:text-teal-800"
                    [routerLink]="['/enroll', program.id]"
                  >
                    View & enroll
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              }
            </div>
          } @else {
            <div class="px-6 py-12 text-center text-sm text-slate-500">
              There are no upcoming programs right now. Check back soon.
            </div>
          }
        </section>

        <section class="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-5 py-4">
            <h2 class="text-base font-bold text-slate-950">Tools and resources</h2>
            <p class="mt-0.5 text-xs text-gray-500">Helpful places to learn, plan, and find support.</p>
          </div>
          <div class="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            <a
              class="dashboard-interactive-card group flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              routerLink="/savings-calculator"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <mat-icon>calculate</mat-icon>
              </div>
              <h3 class="mt-5 text-sm font-bold text-slate-900">Savings calculator</h3>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Plan a savings goal and see how regular contributions can add up.
              </p>
              <span class="mt-auto pt-5 text-xs font-bold text-teal-700">
                Open calculator
                <span aria-hidden="true">→</span>
              </span>
            </a>
            <a
              class="dashboard-interactive-card group flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              routerLink="/educational-resources"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <mat-icon>menu_book</mat-icon>
              </div>
              <h3 class="mt-5 text-sm font-bold text-slate-900">Educational resources</h3>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Browse practical guidance to support your financial wellbeing.
              </p>
              <span class="mt-auto pt-5 text-xs font-bold text-teal-700">
                Browse resources
                <span aria-hidden="true">→</span>
              </span>
            </a>
            <a
              class="dashboard-interactive-card group flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              routerLink="/blogs"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <mat-icon>article</mat-icon>
              </div>
              <h3 class="mt-5 text-sm font-bold text-slate-900">Blogs</h3>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Read stories, tips, and updates from the BRP community.
              </p>
              <span class="mt-auto pt-5 text-xs font-bold text-teal-700">
                Read blogs
                <span aria-hidden="true">→</span>
              </span>
            </a>
            <a
              class="dashboard-interactive-card group flex min-h-48 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              routerLink="/user-guide"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <mat-icon>help_outline</mat-icon>
              </div>
              <h3 class="mt-5 text-sm font-bold text-slate-900">User guide</h3>
              <p class="mt-1 text-xs leading-5 text-slate-500">
                Find a quick answer when you need help using the platform.
              </p>
              <span class="mt-auto pt-5 text-xs font-bold text-teal-700">
                Open guide
                <span aria-hidden="true">→</span>
              </span>
            </a>
          </div>
        </section>
      </section>
    </main>
    <mas-footer />
  `,
  styles: [
    `
      .dashboard-interactive-card:hover {
        border-color: #99f6e4;
        box-shadow: 0 4px 8px rgba(15, 23, 42, 0.08);
      }
      :host(.dashboard--dark) .dashboard-page {
        background: #0c1222;
      }
      :host(.dashboard--dark) .dashboard-hero {
        background: #0d1b2f;
        box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.1);
      }
      :host(.dashboard--dark) ::ng-deep .bg-white {
        background-color: #151b2e !important;
      }
      :host(.dashboard--dark) ::ng-deep .border-gray-200,
      :host(.dashboard--dark) ::ng-deep .border-gray-100 {
        border-color: rgba(148, 163, 184, 0.16) !important;
      }
      :host(.dashboard--dark) ::ng-deep .divide-gray-100 > :not([hidden]) ~ :not([hidden]) {
        border-color: rgba(148, 163, 184, 0.16) !important;
      }
      :host(.dashboard--dark) ::ng-deep .bg-gray-100 {
        background-color: #202b3d !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-slate-950,
      :host(.dashboard--dark) ::ng-deep .text-slate-900 {
        color: #f1f5f9 !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-slate-500,
      :host(.dashboard--dark) ::ng-deep .text-gray-500 {
        color: #94a3b8 !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-gray-300,
      :host(.dashboard--dark) ::ng-deep .text-gray-400 {
        color: #64748b !important;
      }
      :host(.dashboard--dark) ::ng-deep .hover\\:bg-slate-50:hover {
        background-color: #1b2940 !important;
      }
      :host(.dashboard--dark) ::ng-deep .hover\\:bg-teal-50:hover {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.dashboard--dark) .dashboard-interactive-card:hover {
        border-color: rgba(45, 212, 191, 0.4) !important;
        background: #16243a !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      :host(.dashboard--dark) ::ng-deep .bg-teal-50 {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-teal-700 {
        color: #5eead4 !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-sky-700 {
        color: #7dd3fc !important;
      }
      :host(.dashboard--dark) ::ng-deep .bg-amber-50 {
        background-color: rgba(45, 212, 191, 0.12) !important;
      }
      :host(.dashboard--dark) ::ng-deep .text-amber-800,
      :host(.dashboard--dark) ::ng-deep .text-amber-600 {
        color: #99f6e4 !important;
      }
      :host(.dashboard--dark) ::ng-deep .shadow-sm {
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2) !important;
      }
    `,
  ],
  host: { class: 'block', '[class.dashboard--dark]': 'themeService.darkMode()' },
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  readonly authStore = inject(AuthStore);
  readonly programsStore = inject(ProgramsStore);
  readonly themeService = inject(ThemeService);
  readonly sanitizer = inject(DomSanitizer);
  readonly boards = signal<DiscussionBoard[]>([]);
  readonly availablePrograms = computed(() =>
    this.programsStore
      .upcomingPrograms()
      .filter((program) => !this.programsStore.usersPrograms().some((userProgram) => userProgram.id === program.id)),
  );

  constructor() {
    this.programsStore.getProgramsForUser();
    this.programsStore.getUpcoming();
    this.http
      .get<DiscussionBoard[]>('/api/discussion-boards')
      .subscribe({ next: (boards) => this.boards.set(boards), error: () => this.boards.set([]) });
  }
}
