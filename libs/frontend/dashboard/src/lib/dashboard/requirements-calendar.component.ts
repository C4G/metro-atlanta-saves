import { DOCUMENT, formatDate, NgClass, NgTemplateOutlet } from '@angular/common';
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

type DueTask = CalendarTask & {
  daysAway: number;
  isOverdue: boolean;
  rel: string;
  weekday: string;
  day: string;
  month: string;
};

type DueGroup = Pick<DueTask, 'isOverdue' | 'rel' | 'weekday' | 'day' | 'month'> & {
  iso: string;
  tasks: DueTask[];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 30;
const WEEK_DAYS = 7;
const relativeDue = (daysAway: number, isOverdue: boolean): string => {
  if (isOverdue) return 'Overdue';
  if (daysAway === -1) return 'Yesterday';
  if (daysAway < 0) return `${-daysAway} days ago`;
  if (daysAway === 0) return 'Today';
  if (daysAway === 1) return 'Tomorrow';
  return `In ${daysAway} days`;
};
const groupByDate = (tasks: DueTask[]): DueGroup[] => {
  const groups: DueGroup[] = [];
  for (const task of tasks) {
    const iso = toIsoDate(new Date(task.dueAt));
    const group = groups.find((candidate) => candidate.iso === iso);
    if (group) {
      group.tasks.push(task);
      if (task.isOverdue && !group.isOverdue) {
        group.isOverdue = true;
        group.rel = task.rel;
      }
    } else {
      const { isOverdue, rel, weekday, day, month } = task;
      groups.push({ iso, isOverdue, rel, weekday, day, month, tasks: [task] });
    }
  }
  return groups;
};
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
  imports: [
    SpinnerComponent,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkTrapFocus,
    MatIcon,
    NgClass,
    NgTemplateOutlet,
    RouterLink,
  ],
  providers: [ParticipantRequirementsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="overflow-hidden rounded-2xl border border-outline/65 bg-surface/60"
      aria-label="Requirement calendar"
    >
      <div
        class="flex flex-col gap-4 border-b border-outline/55 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Schedule</p>
          <h2 class="mt-1 text-xl font-bold text-ink">Calendar</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div
            class="flex w-full gap-1 rounded-xl border border-brand/25 bg-surface-raised/70 p-1 sm:w-auto"
            role="group"
            aria-label="Calendar view"
          >
            <button
              type="button"
              class="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:min-h-8 sm:flex-none"
              [class.bg-surface-raised]="view() === 'month'"
              [class.text-brand-strong]="view() === 'month'"
              [ngClass]="view() === 'month' ? 'border-brand/70' : 'border-transparent hover:border-brand/40'"
              [class.text-ink-muted]="view() !== 'month'"
              [attr.aria-pressed]="view() === 'month'"
              (click)="view.set('month')"
            >
              <mat-icon class="mas-icon-sm" aria-hidden="true">calendar_month</mat-icon>
              Month
            </button>
            <button
              type="button"
              class="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:min-h-8 sm:flex-none"
              [class.bg-surface-raised]="view() === 'due'"
              [class.text-brand-strong]="view() === 'due'"
              [ngClass]="view() === 'due' ? 'border-brand/70' : 'border-transparent hover:border-brand/40'"
              [class.text-ink-muted]="view() !== 'due'"
              [attr.aria-pressed]="view() === 'due'"
              (click)="view.set('due')"
            >
              <mat-icon class="mas-icon-sm" aria-hidden="true">checklist</mat-icon>
              Due soon
              @if (dueOpenCount()) {
                <span
                  class="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-xs text-brand-on"
                >
                  {{ dueOpenCount() }}
                </span>
              }
            </button>
          </div>
          <button
            #programOrigin="cdkOverlayOrigin"
            cdkOverlayOrigin
            type="button"
            class="flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-60"
            [ngClass]="
              requirementsStore.allProgramsVisible()
                ? 'border-brand/25 bg-surface-raised/70 text-ink'
                : 'border-brand/70 bg-brand-soft text-brand-strong'
            "
            aria-haspopup="dialog"
            aria-controls="calendar-program-filter"
            [attr.aria-expanded]="programMenuOpen()"
            [attr.aria-label]="programFilterLabel()"
            [disabled]="!requirementsStore.programs().length"
            (click)="programMenuOpen.set(!programMenuOpen())"
          >
            <mat-icon class="mas-icon-sm" aria-hidden="true">filter_list</mat-icon>
            @if (requirementsStore.allProgramsVisible()) {
              <span>All programs</span>
            } @else {
              <span>Programs</span>
              <span
                class="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-strong px-1.5 text-xs text-brand-on"
              >
                {{ requirementsStore.visiblePrograms().length }}
              </span>
            }
            <mat-icon
              class="mas-icon-sm transition-transform motion-reduce:transition-none"
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
              class="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-brand/25 bg-surface-raised text-ink shadow-xl"
              role="dialog"
              aria-label="Filter calendar by program"
              cdkTrapFocus
              cdkTrapFocusAutoCapture
            >
              @if (requirementsStore.programs().length > programSearchThreshold) {
                <div class="border-b border-outline/55 p-3">
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
                      class="min-h-10 w-full rounded-xl border border-brand/25 bg-surface-raised/70 py-2 pl-11 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-brand/70 hover:bg-surface-raised focus:border-brand/70 focus:bg-surface-raised focus:ring-2 focus:ring-brand/25"
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
                    class="min-h-8 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-50 disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70"
                    [disabled]="requirementsStore.allProgramsVisible()"
                    (click)="requirementsStore.showAllPrograms()"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    class="min-h-8 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-default disabled:opacity-50 disabled:hover:border-brand/25 disabled:hover:bg-surface-raised/70"
                    [disabled]="!requirementsStore.visiblePrograms().length"
                    (click)="requirementsStore.hideAllPrograms()"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <ul
                class="max-h-64 space-y-2 overflow-y-auto px-3 pb-3 pt-1"
                aria-labelledby="calendar-program-list-label"
              >
                @for (program of requirementsStore.matchingPrograms(); track program.id) {
                  <li>
                    <label
                      class="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-2 py-1.5 transition-colors hover:border-brand/70 hover:bg-surface-raised has-[:focus-visible]:border-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-brand"
                      [ngClass]="
                        program.isVisible ? 'border-brand/70 bg-surface-raised' : 'border-brand/25 bg-surface-raised/70'
                      "
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
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-colors"
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
              <div
                class="flex items-center justify-between gap-3 border-t border-outline/55 bg-surface-subtle/45 px-4 py-3"
              >
                <p class="text-xs text-ink-muted" aria-live="polite">
                  Showing {{ requirementsStore.visiblePrograms().length }} of {{ requirementsStore.programs().length }}
                </p>
                <button
                  type="button"
                  class="min-h-10 rounded-xl border border-brand/25 bg-surface-raised/70 px-4 text-xs font-bold text-brand-strong transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand"
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
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand"
              [attr.aria-label]="view() === 'due' ? 'Previous week' : 'Previous month'"
              (click)="previous()"
            >
              <mat-icon aria-hidden="true">chevron_left</mat-icon>
            </button>
            <button
              type="button"
              class="min-h-10 rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand"
              (click)="goToToday()"
            >
              Today
            </button>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand"
              [attr.aria-label]="view() === 'due' ? 'Next week' : 'Next month'"
              (click)="next()"
            >
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </div>

      @if (view() === 'due') {
        @let due = dueSoon();
        @if (requirementsStore.loading()) {
          <p class="flex items-center gap-2 p-6 text-sm text-ink-muted" role="status">
            <mas-spinner class="text-brand" />
            <span class="sr-only">Loading your tasks</span>
          </p>
        } @else if (requirementsStore.loadFailed()) {
          <div class="p-6">
            <p class="text-sm text-ink-muted">We could not load your tasks.</p>
            <button
              type="button"
              class="mt-3 rounded-xl border border-outline px-4 py-2 text-sm font-bold text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
              (click)="requirementsStore.load()"
            >
              Try again
            </button>
          </div>
        } @else if (!due.hasTasks) {
          <div class="p-5 sm:p-6">
            <div class="rounded-2xl border border-dashed border-outline bg-surface-raised px-5 py-8 text-center">
              <span
                class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong"
              >
                <mat-icon aria-hidden="true">event_available</mat-icon>
              </span>
              @if (requirementsStore.visiblePrograms().length || !requirementsStore.programs().length) {
                @if (due.isFromToday) {
                  <p class="mt-3 text-sm font-bold text-ink">Nothing due in the next {{ dueSoonDays }} days</p>
                  <p class="mt-1 text-xs leading-5 text-ink-muted">Later tasks are in the Month view.</p>
                } @else {
                  <p class="mt-3 text-sm font-bold text-ink">Nothing due {{ due.rangeLabel }}</p>
                  <p class="mt-1 text-xs leading-5 text-ink-muted">
                    Use the arrows to look at other weeks, or open the Month view.
                  </p>
                }
                <button
                  type="button"
                  class="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline px-4 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                  (click)="view.set('month')"
                >
                  <mat-icon class="mas-icon-sm" aria-hidden="true">calendar_month</mat-icon>
                  Open the month
                </button>
              } @else {
                <p class="mt-3 text-sm font-bold text-ink">No programs selected</p>
                <p class="mt-1 text-xs leading-5 text-ink-muted">
                  Choose a program from the Programs menu to see its tasks.
                </p>
              }
            </div>
          </div>
        } @else {
          <div class="grid lg:grid-cols-[minmax(0,1fr)_23.75rem]">
            <div class="px-2 pb-2 pt-4 sm:px-5 sm:pt-6">
              <p class="mb-2 ml-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-strong lg:hidden">
                After that
              </p>
              <ol class="list-none" aria-label="Due tasks by date">
                @for (group of due.overdueGroups; track group.iso) {
                  <ng-container *ngTemplateOutlet="timelineGroup; context: { $implicit: group }" />
                }
                <li class="flex gap-2 sm:gap-3">
                  <div class="w-10 shrink-0 pt-2 text-right sm:w-14">
                    @if (due.isFromToday) {
                      <p class="text-xs font-bold uppercase tracking-wide text-brand-strong">Today</p>
                    }
                  </div>
                  <div
                    class="relative w-5 shrink-0 before:absolute before:inset-y-0 before:left-[9px] before:w-0.5 before:bg-outline sm:w-6 sm:before:left-[11px]"
                    aria-hidden="true"
                  >
                    <span
                      class="absolute left-0.5 top-2.5 h-4 w-4 rounded-full border-[3px] border-brand-strong bg-surface sm:left-1"
                    ></span>
                  </div>
                  <div class="flex flex-1 items-center gap-3 pb-4 pt-1.5">
                    <span class="text-sm font-bold text-brand-strong">
                      {{ due.isFromToday ? todayHeading : due.rangeLabel }}
                    </span>
                    <span class="flex-1 border-t border-brand/30" aria-hidden="true"></span>
                  </div>
                </li>
                @for (group of due.weekGroups; track group.iso) {
                  <ng-container *ngTemplateOutlet="timelineGroup; context: { $implicit: group }" />
                }
                @if (due.laterGroups.length) {
                  <li class="flex gap-2 sm:gap-3">
                    <div class="w-10 shrink-0 sm:w-14"></div>
                    <div
                      class="relative w-5 shrink-0 before:absolute before:inset-y-0 before:left-[9px] before:w-0.5 before:bg-outline sm:w-6 sm:before:left-[11px]"
                      aria-hidden="true"
                    ></div>
                    <p class="pb-4 pt-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">
                      {{ due.laterHeading }}
                    </p>
                  </li>
                  @for (group of due.laterGroups; track group.iso) {
                    <ng-container *ngTemplateOutlet="timelineGroup; context: { $implicit: group }" />
                  }
                }
              </ol>
            </div>

            <aside
              class="relative order-first overflow-hidden border-b border-outline/55 bg-surface-subtle/45 p-4 sm:p-6 lg:order-none lg:border-b-0 lg:border-l"
              aria-label="Next up"
              aria-live="polite"
            >
              <span
                class="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full border-[20px] border-brand opacity-10"
                aria-hidden="true"
              ></span>
              <span
                class="pointer-events-none absolute -top-11 right-8 h-24 w-24 rounded-full border-2 border-brand opacity-25"
                aria-hidden="true"
              ></span>
              <div class="relative">
                <div class="flex items-baseline justify-between gap-2">
                  <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Next up</p>
                  <span class="text-xs text-ink-muted">{{ due.nextUp?.rel ?? 'All done' }}</span>
                </div>
                <div class="mt-2 space-y-2">
                  @if (due.nextUp; as task) {
                    <ng-container *ngTemplateOutlet="miniRow; context: { $implicit: task }" />
                  } @else {
                    <p class="py-2 text-xs text-ink-muted">You are all caught up. Nothing else is due soon.</p>
                  }
                </div>
              </div>
              <div class="relative hidden lg:block">
                <div class="mt-5 border-t border-outline pt-5">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">After that</p>
                    <span class="text-xs text-ink-muted">{{ leftLabel(due.afterThat) }}</span>
                  </div>
                  <div class="mt-2 space-y-2">
                    @for (task of due.afterThat; track task.id) {
                      <ng-container *ngTemplateOutlet="miniRow; context: { $implicit: task }" />
                    } @empty {
                      <p class="py-2 text-xs text-ink-muted">Nothing else this week.</p>
                    }
                  </div>
                </div>
                @if (due.later.length) {
                  <div class="mt-5 border-t border-outline pt-5">
                    <div class="flex items-baseline justify-between gap-2">
                      <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">
                        {{ due.laterHeading }}
                      </p>
                      <span class="text-xs text-ink-muted">{{ leftLabel(due.later) }}</span>
                    </div>
                    <div class="mt-2 space-y-2">
                      @for (task of due.later; track task.id) {
                        <ng-container *ngTemplateOutlet="miniRow; context: { $implicit: task }" />
                      }
                    </div>
                  </div>
                }
              </div>
            </aside>
          </div>
        }
      } @else {
        <div class="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.65fr)]">
          <div class="border-b border-outline/55 p-3 sm:p-5 lg:border-b-0 lg:border-r">
            <div class="mb-4 flex items-end justify-between gap-4 px-1">
              <h3 class="font-serif text-2xl font-semibold text-ink">{{ monthHeading() }}</h3>
              <span class="text-xs font-semibold text-ink-subtle">{{ yearHeading() }}</span>
            </div>
            <div class="grid grid-cols-7 gap-1" role="group" [attr.aria-label]="monthHeading() + ' ' + yearHeading()">
              @for (weekday of weekdays; track weekday) {
                <div class="pb-2 text-center text-xs font-bold uppercase tracking-wide text-ink-subtle sm:text-xs">
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

          <aside class="relative overflow-hidden bg-surface-subtle/45 p-5 sm:p-6" aria-live="polite">
            <span
              class="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full border-[20px] border-brand opacity-10"
              aria-hidden="true"
            ></span>
            <span
              class="pointer-events-none absolute -top-11 right-8 h-24 w-24 rounded-full border-2 border-brand opacity-25"
              aria-hidden="true"
            ></span>
            <div class="relative">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Selected day</p>
                @if (selectedTasks().length) {
                  <span class="text-xs text-ink-muted">{{ leftLabel(selectedTasks()) }}</span>
                }
              </div>
              <h3 class="mt-2 text-lg font-bold text-ink">{{ selectedDayHeading() }}</h3>
              @if (requirementsStore.loading()) {
                <p class="mt-5 flex items-center gap-2 text-sm text-ink-muted" role="status">
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
                <div class="mt-4 space-y-2">
                  @for (task of selectedTasks(); track task.id) {
                    <ng-container *ngTemplateOutlet="miniRow; context: { $implicit: task, opensTask: true }" />
                  }
                </div>
              } @else if (requirementsStore.visiblePrograms().length || !requirementsStore.programs().length) {
                <p class="py-3 text-xs text-ink-muted">Nothing due this day. Choose a marked date to see its tasks.</p>
              } @else {
                <p class="py-3 text-xs text-ink-muted">
                  No programs selected. Choose a program from the Programs menu to see its tasks.
                </p>
              }
            </div>
          </aside>
        </div>
      }
    </section>

    <ng-template #timelineGroup let-group>
      <li class="flex gap-2 sm:gap-3">
        <div class="w-10 shrink-0 pt-1.5 text-right sm:w-14">
          <p
            class="text-xs font-bold uppercase tracking-wide"
            [class.text-warn-ink]="group.isOverdue"
            [class.text-ink-muted]="!group.isOverdue"
          >
            {{ group.weekday }}
          </p>
          <p class="font-serif text-2xl font-semibold leading-8 text-ink">{{ group.day }}</p>
          <p class="text-xs text-ink-muted">{{ group.month }}</p>
        </div>
        <div
          class="relative w-5 shrink-0 before:absolute before:inset-y-0 before:left-[9px] before:w-0.5 before:bg-outline sm:w-6 sm:before:left-[11px]"
          aria-hidden="true"
        >
          <span
            class="absolute left-[3px] top-4 h-3.5 w-3.5 rounded-full border-[3px] border-surface ring-1 sm:left-[5px]"
            [class.bg-warn-ink]="group.isOverdue"
            [class.ring-warn-ink]="group.isOverdue"
            [class.bg-brand-strong]="!group.isOverdue"
            [class.ring-brand-strong]="!group.isOverdue"
          ></span>
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-2 pb-5 pt-2">
          <span
            class="self-start rounded-full px-2 py-0.5 text-xs font-bold"
            [class.bg-warn-soft]="group.isOverdue"
            [class.text-warn-ink]="group.isOverdue"
            [class.bg-brand-soft]="!group.isOverdue"
            [class.text-brand-strong]="!group.isOverdue"
          >
            {{ group.rel }}
          </span>
          @for (task of group.tasks; track task.id) {
            @let isNext = dueSoon().nextUp?.id === task.id;
            <article
              [id]="'due-task-' + task.id"
              class="group relative scroll-m-24 overflow-hidden rounded-xl border bg-surface-raised/70 transition-colors focus-within:border-brand/70 hover:border-brand/70 hover:bg-surface-raised"
              [ngClass]="{
                'border-brand/70': isNext || focusedTaskId() === task.id,
                'ring-2 ring-brand/40': focusedTaskId() === task.id,
                'border-brand/25': !isNext && focusedTaskId() !== task.id,
              }"
            >
              <a
                class="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
                [routerLink]="task.link"
                [fragment]="task.id"
                [attr.aria-label]="'Open ' + task.title + ' in ' + task.program"
              ></a>
              <div class="pointer-events-none relative z-10 flex min-h-16 items-stretch">
                @if (task.canComplete) {
                  <span class="flex w-12 shrink-0 items-center justify-center px-3 py-4">
                    <ng-container *ngTemplateOutlet="completeButton; context: { $implicit: task }" />
                  </span>
                } @else {
                  <span
                    class="flex w-12 shrink-0 items-center justify-center text-ink-muted"
                    title="Read-only requirement"
                  >
                    <mat-icon aria-hidden="true">assignment</mat-icon>
                  </span>
                }
                <div class="min-w-0 flex-1 self-center px-3 py-3 sm:px-4">
                  <h4 class="text-sm font-bold leading-5 text-ink">{{ task.title }}</h4>
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
                    <mat-icon class="mas-icon-sm shrink-0 text-brand-strong" aria-hidden="true">school</mat-icon>
                    <span class="truncate leading-none">{{ task.program }}</span>
                  </p>
                </div>
                @if (isNext) {
                  <span class="self-center pr-3 sm:pr-4">
                    <span class="rounded-full bg-brand-strong px-2 py-0.5 text-xs font-bold text-brand-on">
                      Next up
                    </span>
                  </span>
                }
              </div>
            </article>
          }
        </div>
      </li>
    </ng-template>

    <ng-template #miniRow let-task let-opensTask="opensTask">
      <div
        class="flex min-h-14 items-center gap-3 rounded-xl border border-brand/25 bg-surface-raised/70 px-2 py-1 transition-colors hover:border-brand/70 hover:bg-surface-raised"
        [class.bg-surface-raised]="focusedTaskId() === task.id"
        [class.ring-1]="focusedTaskId() === task.id"
        [class.ring-inset]="focusedTaskId() === task.id"
        [class.ring-brand]="focusedTaskId() === task.id"
      >
        <div class="w-10 shrink-0 text-center" [class.text-warn-ink]="task.isOverdue">
          <p class="text-xs font-bold uppercase tracking-wide" [class.text-ink-muted]="!task.isOverdue">
            {{ task.weekday }}
          </p>
          <p class="font-serif text-xl font-semibold leading-6" [class.text-ink]="!task.isOverdue">{{ task.day }}</p>
        </div>
        @if (opensTask) {
          <a
            class="flex min-w-0 flex-1 flex-col rounded-lg py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            [routerLink]="task.link"
            [fragment]="task.id"
            [attr.aria-label]="'Open ' + task.title + ' in ' + task.program"
          >
            <span class="text-sm font-bold leading-5 text-ink">{{ task.title }}</span>
            <span class="truncate text-xs text-ink-muted">{{ task.program }} · {{ task.dueTime }}</span>
          </a>
        } @else {
          <button
            type="button"
            class="flex min-w-0 flex-1 flex-col rounded-lg py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            [attr.aria-label]="'Show ' + task.title + ' in the timeline'"
            (click)="focusTask(task.id)"
          >
            <span class="text-sm font-bold leading-5 text-ink">{{ task.title }}</span>
            <span class="truncate text-xs text-ink-muted">{{ task.program }}</span>
          </button>
        }
        @if (task.canComplete) {
          <ng-container *ngTemplateOutlet="completeButton; context: { $implicit: task }" />
        } @else {
          <span class="flex h-6 w-6 shrink-0 items-center justify-center text-ink-muted" title="Read-only requirement">
            <mat-icon class="mas-icon-md" aria-hidden="true">assignment</mat-icon>
          </span>
        }
      </div>
    </ng-template>

    <ng-template #completeButton let-task>
      <button
        type="button"
        class="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-default disabled:opacity-60"
        [class.border-brand-strong]="task.isCompleted"
        [class.bg-brand-strong]="task.isCompleted"
        [class.text-brand-on]="task.isCompleted"
        [class.border-brand]="!task.isCompleted"
        [class.bg-surface]="!task.isCompleted"
        [class.text-brand-strong]="!task.isCompleted"
        [disabled]="requirementsStore.savingTaskIds().includes(task.id)"
        [attr.aria-label]="task.isCompleted ? 'Mark ' + task.title + ' incomplete' : 'Mark ' + task.title + ' complete'"
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
    </ng-template>
  `,
  host: { class: 'block' },
})
export class RequirementsCalendarComponent {
  readonly requirementsStore = inject(ParticipantRequirementsStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly document = inject(DOCUMENT);
  readonly weekdays = DAYS;
  readonly today = new Date();
  readonly dueSoonDays = DUE_SOON_DAYS;
  readonly view = signal<'due' | 'month'>('due');
  readonly focusedTaskId = signal<string | null>(null);
  readonly todayHeading = formatDate(this.today, 'EEEE, MMMM d', this.locale);
  readonly dueOffset = signal(0);
  readonly dueSoon = computed(() => this.buildDueSoon(this.dueOffset()));
  readonly dueOpenCount = computed(() => this.buildDueSoon(0).openCount);
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
  readonly selectedTasks = computed(() =>
    (this.requirementsStore.tasksByDate()[this.selectedDate()] ?? []).map((task) => this.toDueTask(task)),
  );
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

  private toDueTask(task: CalendarTask): DueTask {
    const startOfToday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const dueAt = new Date(task.dueAt);
    const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate()).getTime();
    const daysAway = Math.round((dueDay - startOfToday.getTime()) / DAY_MS);
    const isOverdue = daysAway < 0 && task.canComplete && !task.isCompleted;
    return {
      ...task,
      daysAway,
      isOverdue,
      rel: relativeDue(daysAway, isOverdue),
      weekday: formatDate(dueAt, 'EEE', this.locale),
      day: formatDate(dueAt, 'd', this.locale),
      month: formatDate(dueAt, 'MMM', this.locale),
    };
  }

  private buildDueSoon(offset: number) {
    const startOfToday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const tasks = Object.values(this.requirementsStore.tasksByDate())
      .flat()
      .map((task) => this.toDueTask(task))
      .filter((task) => {
        const fromStart = task.daysAway - offset;
        return (fromStart >= 0 && fromStart < DUE_SOON_DAYS) || (offset === 0 && task.isOverdue);
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    const overdue = tasks.filter((task) => task.daysAway < offset);
    const firstWeek = tasks.filter((task) => task.daysAway >= offset && task.daysAway < offset + WEEK_DAYS);
    const later = tasks.filter((task) => task.daysAway >= offset + WEEK_DAYS);
    const nextUp = tasks.find((task) => !task.isCompleted) ?? null;
    const laterMonths = new Set(later.map((task) => formatDate(task.dueAt, 'MMMM', this.locale)));
    const start = new Date(startOfToday);
    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(end.getDate() + DUE_SOON_DAYS - 1);
    return {
      isFromToday: offset === 0,
      rangeLabel: `${formatDate(start, 'MMM d', this.locale)} – ${formatDate(end, 'MMM d', this.locale)}`,
      hasTasks: tasks.length > 0,
      overdueGroups: groupByDate(overdue),
      weekGroups: groupByDate(firstWeek),
      laterGroups: groupByDate(later),
      nextUp,
      afterThat: [...overdue, ...firstWeek].filter((task) => task.id !== nextUp?.id),
      later: later.filter((task) => task.id !== nextUp?.id),
      laterHeading: laterMonths.size === 1 ? `Later in ${[...laterMonths][0]}` : 'Later',
      openCount: [...overdue, ...firstWeek].filter((task) => !task.isCompleted).length,
    };
  }

  previous(): void {
    if (this.view() === 'due') {
      this.moveDueSoon(-WEEK_DAYS);
    } else {
      this.changeMonth(-1);
    }
  }
  next(): void {
    if (this.view() === 'due') {
      this.moveDueSoon(WEEK_DAYS);
    } else {
      this.changeMonth(1);
    }
  }
  goToToday(): void {
    this.dueOffset.set(0);
    this.focusedTaskId.set(null);
    this.showToday();
  }
  private moveDueSoon(days: number): void {
    this.dueOffset.update((offset) => offset + days);
    this.focusedTaskId.set(null);
  }

  leftLabel(tasks: readonly DueTask[]): string {
    return `${tasks.filter((task) => !task.isCompleted).length} left`;
  }
  focusTask(id: string): void {
    const next = this.focusedTaskId() === id ? null : id;
    this.focusedTaskId.set(next);
    if (next) {
      const reduceMotion = this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.document
        .getElementById(`due-task-${id}`)
        ?.scrollIntoView?.({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
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
