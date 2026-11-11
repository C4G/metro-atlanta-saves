import { formatDate } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CalendarTask, ParticipantRequirementsStore } from '@mas/frontend-shared-data-access';
import { RouterLink } from '@angular/router';

type CalendarDay = {
  day: number;
  iso: string;
  label: string;
  isToday: boolean;
  tasks: readonly CalendarTask[];
  indicatorTasks: readonly CalendarTask[];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const toIsoDate = (date: Date): string => {
  return formatDate(date, 'yyyy-MM-dd', 'en-US');
};
const PROGRAM_MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
];

import { SpinnerComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-requirements-calendar',
  imports: [SpinnerComponent, CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, MatIcon, RouterLink],
  providers: [ParticipantRequirementsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-2xl border border-outline bg-surface" aria-label="Requirement calendar">
      <div class="flex flex-col gap-4 border-b border-outline px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Schedule</p>
          <h2 class="mt-1 text-xl font-bold text-ink">Calendar</h2>
          <p class="mt-1 text-sm text-ink-muted">Select a day to see what is due.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            #programOrigin="cdkOverlayOrigin"
            cdkOverlayOrigin
            type="button"
            class="flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-60"
            [class.border-outline]="requirementsStore.allProgramsVisible()"
            [class.text-ink]="requirementsStore.allProgramsVisible()"
            [class.border-brand]="!requirementsStore.allProgramsVisible()"
            [class.bg-brand-soft]="!requirementsStore.allProgramsVisible()"
            [class.text-brand-strong]="!requirementsStore.allProgramsVisible()"
            aria-haspopup="dialog"
            aria-controls="calendar-program-filter"
            [attr.aria-expanded]="programMenuOpen()"
            [attr.aria-label]="programFilterLabel()"
            [disabled]="!requirementsStore.programs().length"
            (click)="programMenuOpen.set(!programMenuOpen())"
          >
            <mat-icon class="!h-[1.125rem] !w-[1.125rem] !text-[1.125rem]" aria-hidden="true">filter_list</mat-icon>
            @if (requirementsStore.allProgramsVisible()) {
              <span>All programs</span>
            } @else {
              <span>Programs</span>
              <span
                class="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-[0.6875rem] text-brand-on"
              >
                {{ requirementsStore.visiblePrograms().length }}
              </span>
            }
            <mat-icon
              class="!h-[1.125rem] !w-[1.125rem] !text-[1.125rem] transition-transform motion-reduce:transition-none"
              [class.rotate-180]="programMenuOpen()"
              aria-hidden="true"
            >
              expand_more
            </mat-icon>
          </button>
          <ng-template
            cdkConnectedOverlay
            cdkConnectedOverlayHasBackdrop
            cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
            [cdkConnectedOverlayOrigin]="programOrigin"
            [cdkConnectedOverlayOpen]="programMenuOpen()"
            [cdkConnectedOverlayPositions]="programMenuPositions"
            (backdropClick)="closeProgramMenu()"
            (detach)="closeProgramMenu()"
            (overlayKeydown)="closeProgramMenuOnEscape($event)"
          >
            <div
              id="calendar-program-filter"
              class="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-outline bg-surface-raised text-ink shadow-xl"
              role="dialog"
              aria-label="Filter calendar by program"
              cdkTrapFocus
              cdkTrapFocusAutoCapture
            >
              @if (requirementsStore.programs().length > programSearchThreshold) {
                <div class="border-b border-outline p-3">
                  <label class="relative block">
                    <span class="sr-only">Find a program</span>
                    <mat-icon
                      class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                      aria-hidden="true"
                    >
                      search
                    </mat-icon>
                    <input
                      #programSearch
                      cdkFocusInitial
                      type="search"
                      class="min-h-10 w-full rounded-xl border border-outline bg-surface py-2 pl-11 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-2 focus:ring-brand/25"
                      placeholder="Find a program"
                      [value]="requirementsStore.programQuery()"
                      (input)="requirementsStore.setProgramQuery(programSearch.value)"
                    />
                  </label>
                </div>
              }
              <div class="flex items-center justify-between gap-2 px-4 pb-1.5 pt-2.5">
                <p
                  id="calendar-program-list-label"
                  class="text-xs font-bold uppercase tracking-[0.14em] text-ink-subtle"
                >
                  Programs
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="min-h-8 rounded-xl border border-outline px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-50 disabled:hover:border-outline disabled:hover:bg-transparent"
                    [disabled]="requirementsStore.allProgramsVisible()"
                    (click)="requirementsStore.showAllPrograms()"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    class="min-h-8 rounded-xl border border-outline px-3 text-xs font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-50 disabled:hover:border-outline disabled:hover:bg-transparent"
                    [disabled]="!requirementsStore.visiblePrograms().length"
                    (click)="requirementsStore.hideAllPrograms()"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <ul
                class="max-h-64 space-y-1 overflow-y-auto px-2 pb-2 pt-1"
                aria-labelledby="calendar-program-list-label"
              >
                @for (program of requirementsStore.matchingPrograms(); track program.id) {
                  <li>
                    <label
                      class="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-brand/40 hover:bg-brand-soft/40 has-[:focus-visible]:border-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-brand"
                      [class.bg-brand-soft]="program.isVisible"
                    >
                      <input
                        type="checkbox"
                        class="sr-only"
                        [attr.cdkFocusInitial]="
                          $first && requirementsStore.programs().length <= programSearchThreshold ? '' : null
                        "
                        [checked]="program.isVisible"
                        (change)="requirementsStore.toggleProgram(program.id)"
                      />
                      <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                        [class.border-brand-strong]="program.isVisible"
                        [class.bg-brand-strong]="program.isVisible"
                        [class.text-brand-on]="program.isVisible"
                        [class.border-brand]="!program.isVisible"
                        [class.bg-surface]="!program.isVisible"
                        aria-hidden="true"
                      >
                        @if (program.isVisible) {
                          <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3.25 8.25 6.5 11.5l6.25-7"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        }
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-bold text-ink">{{ program.name }}</span>
                        <span class="mt-0.5 block text-xs text-ink-muted">
                          {{ program.taskCount }} {{ program.taskCount === 1 ? 'task' : 'tasks' }}
                        </span>
                      </span>
                    </label>
                  </li>
                } @empty {
                  <li class="px-2 py-4 text-center text-sm text-ink-muted">No programs match your search.</li>
                }
              </ul>
              <div class="flex items-center justify-between gap-3 border-t border-outline bg-surface-subtle px-4 py-3">
                <p class="text-xs text-ink-muted" aria-live="polite">
                  Showing {{ requirementsStore.visiblePrograms().length }} of {{ requirementsStore.programs().length }}
                </p>
                <button
                  type="button"
                  class="min-h-10 rounded-xl border border-brand-strong bg-brand-strong px-4 text-xs font-bold text-brand-on transition-colors hover:border-brand hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-subtle"
                  (click)="closeProgramMenu()"
                >
                  Done
                </button>
              </div>
            </div>
          </ng-template>
          <div class="flex items-center gap-2" role="group" aria-label="Calendar navigation">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Previous month"
              (click)="changeMonth(-1)"
            >
              <mat-icon aria-hidden="true">chevron_left</mat-icon>
            </button>
            <button
              type="button"
              class="min-h-10 rounded-xl border border-outline px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
              (click)="showToday()"
            >
              Today
            </button>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
              aria-label="Next month"
              (click)="changeMonth(1)"
            >
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.65fr)]">
        <div class="border-b border-outline p-3 sm:p-5 lg:border-b-0 lg:border-r">
          <div class="mb-4 flex items-end justify-between gap-4 px-1">
            <h3 class="font-serif text-2xl font-semibold text-ink">{{ monthHeading() }}</h3>
            <span class="text-xs font-semibold text-ink-subtle">{{ yearHeading() }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1" role="group" [attr.aria-label]="monthHeading() + ' ' + yearHeading()">
            @for (weekday of weekdays; track weekday) {
              <div
                class="pb-2 text-center text-[0.625rem] font-bold uppercase tracking-wide text-ink-subtle sm:text-xs"
              >
                {{ weekday }}
              </div>
            }
            @for (blank of leadingBlanks(); track $index) {
              <div class="min-h-16 sm:min-h-20" aria-hidden="true"></div>
            }
            @for (day of calendarDays(); track day.iso) {
              <button
                type="button"
                class="group relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-transparent p-1 text-center transition-colors hover:border-brand/40 hover:bg-brand-soft/40 focus:z-10 focus:border-brand focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand sm:min-h-20 sm:gap-2 sm:p-2"
                [class.bg-brand-soft]="selectedDate() === day.iso"
                [attr.aria-label]="day.label"
                [attr.aria-pressed]="selectedDate() === day.iso"
                [attr.aria-current]="day.isToday ? 'date' : null"
                (click)="selectedDate.set(day.iso)"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm"
                  [class.bg-brand-strong]="day.isToday"
                  [class.text-brand-on]="day.isToday"
                  [class.text-ink]="!day.isToday"
                >
                  {{ day.day }}
                </span>
                @if (day.tasks.length) {
                  <span class="flex h-2 items-center justify-center gap-1" aria-hidden="true">
                    @for (task of day.indicatorTasks; track task.id) {
                      <span class="h-2 w-2 rounded-full bg-brand-strong"></span>
                    }
                  </span>
                }
              </button>
            }
          </div>
        </div>

        <aside class="bg-surface-subtle p-5 sm:p-6" aria-live="polite">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Selected day</p>
          <h3 class="mt-2 text-lg font-bold text-ink">{{ selectedDayHeading() }}</h3>
          @if (requirementsStore.loading()) {
            <p class="mt-5 text-sm text-ink-muted flex items-center gap-2" role="status">
              <mas-spinner class="text-brand" />
              <span class="sr-only">Loading your calendar</span>
            </p>
          } @else if (requirementsStore.loadFailed()) {
            <p class="mt-5 text-sm text-ink-muted">We could not load your calendar.</p>
            <button
              type="button"
              class="mt-3 rounded-xl border border-outline px-4 py-2 text-sm font-bold text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
              (click)="requirementsStore.load()"
            >
              Try again
            </button>
          } @else if (selectedTasks().length) {
            <div class="mt-5 space-y-3">
              @for (task of selectedTasks(); track task.id) {
                <article
                  class="group relative overflow-hidden rounded-2xl border border-outline bg-surface-raised transition-colors hover:border-brand hover:bg-brand-soft/25 focus-within:border-brand focus-within:bg-brand-soft/25"
                  [class.border-brand]="task.isCompleted"
                >
                  <a
                    class="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-subtle"
                    [routerLink]="task.link"
                    [fragment]="task.id"
                    [attr.aria-label]="'Open ' + task.title + ' in ' + task.program"
                  ></a>
                  <div class="pointer-events-none relative z-10 flex min-h-24 items-stretch">
                    @if (task.canComplete) {
                      <span class="flex w-14 shrink-0 items-center justify-center bg-brand-soft/70 px-3 py-4">
                        <button
                          type="button"
                          class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-brand-soft disabled:cursor-default disabled:opacity-60"
                          [class.border-brand-strong]="task.isCompleted"
                          [class.bg-brand-strong]="task.isCompleted"
                          [class.text-brand-on]="task.isCompleted"
                          [class.border-brand]="!task.isCompleted"
                          [class.bg-surface]="!task.isCompleted"
                          [class.text-brand-strong]="!task.isCompleted"
                          [disabled]="requirementsStore.savingTaskIds().includes(task.id)"
                          [attr.aria-label]="
                            task.isCompleted ? 'Mark ' + task.title + ' incomplete' : 'Mark ' + task.title + ' complete'
                          "
                          [attr.aria-pressed]="task.isCompleted"
                          (click)="requirementsStore.toggle(task.requirement)"
                        >
                          @if (requirementsStore.savingTaskIds().includes(task.id)) {
                            <span
                              class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                              aria-hidden="true"
                            ></span>
                          } @else if (task.isCompleted) {
                            <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path
                                d="M3.25 8.25 6.5 11.5l6.25-7"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          }
                        </button>
                      </span>
                    } @else {
                      <span
                        class="flex w-14 shrink-0 items-center justify-center border-r border-outline bg-surface-subtle text-ink-muted"
                        title="Read-only requirement"
                      >
                        <mat-icon aria-hidden="true">assignment</mat-icon>
                      </span>
                    }

                    <div class="min-w-0 flex-1 self-center p-4">
                      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] font-bold">
                        <span class="uppercase tracking-wide text-brand-strong">{{ task.dueLabel }}</span>
                      </div>
                      <h4 class="mt-1.5 text-sm font-bold leading-5 text-ink">{{ task.title }}</h4>
                      @if (!task.canComplete) {
                        <span class="sr-only">
                          {{
                            task.isEnrolled
                              ? 'Read-only requirement. Updated by your program team.'
                              : 'Opens this task’s month in Tasks Review.'
                          }}
                        </span>
                      }
                      <p class="mt-1 flex h-5 items-center gap-1.5 text-xs text-ink-muted">
                        <mat-icon class="shrink-0 text-brand-strong" aria-hidden="true">school</mat-icon>
                        <span class="truncate leading-none">{{ task.program }}</span>
                      </p>
                    </div>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="mt-5 rounded-2xl border border-dashed border-outline bg-surface-raised px-5 py-8 text-center">
              <span
                class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"
              >
                <mat-icon aria-hidden="true">event_available</mat-icon>
              </span>
              @if (requirementsStore.visiblePrograms().length || !requirementsStore.programs().length) {
                <p class="mt-3 text-sm font-bold text-ink">Nothing due this day</p>
                <p class="mt-1 text-xs leading-5 text-ink-muted">
                  You can focus on another step or choose a marked date.
                </p>
              } @else {
                <p class="mt-3 text-sm font-bold text-ink">No programs selected</p>
                <p class="mt-1 text-xs leading-5 text-ink-muted">
                  Choose a program from the Programs menu to see its tasks.
                </p>
              }
            </div>
          }
        </aside>
      </div>
    </section>
  `,
  host: { class: 'block' },
})
export class RequirementsCalendarComponent {
  readonly requirementsStore = inject(ParticipantRequirementsStore);
  private readonly locale = inject(LOCALE_ID);
  readonly weekdays = DAYS;
  readonly today = new Date();
  readonly visibleMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedDate = signal(toIsoDate(this.today));
  readonly programMenuOpen = signal(false);
  readonly programMenuPositions = PROGRAM_MENU_POSITIONS;
  readonly programSearchThreshold = 5;
  readonly programFilterLabel = computed(() => {
    const total = this.requirementsStore.programs().length;
    const visible = this.requirementsStore.visiblePrograms().length;
    return `Filter calendar by program, ${visible === total ? 'all' : `${visible} of ${total}`} selected`;
  });
  readonly monthHeading = computed(() => formatDate(this.visibleMonth(), 'MMMM', this.locale));
  readonly yearHeading = computed(() => `${this.visibleMonth().getFullYear()}`);
  readonly leadingBlanks = computed(() => Array.from({ length: this.visibleMonth().getDay() }));
  readonly calendarDays = computed<readonly CalendarDay[]>(() => {
    const month = this.visibleMonth();
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const todayIso = toIsoDate(this.today);
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const iso = toIsoDate(date);
      const tasks = this.requirementsStore.tasksByDate()[iso] ?? [];
      const dueLabel = tasks.length ? `, ${tasks.length} item${tasks.length === 1 ? '' : 's'} due` : ', nothing due';
      return {
        day: index + 1,
        iso,
        isToday: iso === todayIso,
        tasks,
        indicatorTasks: tasks.slice(0, 2),
        label: `${formatDate(date, 'EEEE, MMMM d, yyyy', this.locale)}${dueLabel}`,
      };
    });
  });
  readonly selectedTasks = computed(() => this.requirementsStore.tasksByDate()[this.selectedDate()] ?? []);
  readonly selectedDayHeading = computed(() =>
    formatDate(new Date(`${this.selectedDate()}T12:00:00`), 'EEEE, MMMM d', this.locale),
  );

  constructor() {
    this.requirementsStore.load();
  }

  closeProgramMenuOnEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeProgramMenu();
    }
  }
  closeProgramMenu(): void {
    this.programMenuOpen.set(false);
    this.requirementsStore.setProgramQuery('');
  }

  showToday(): void {
    this.visibleMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(toIsoDate(this.today));
  }
  changeMonth(offset: number): void {
    const current = this.visibleMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.visibleMonth.set(next);
    this.selectedDate.set(toIsoDate(next));
  }
}
