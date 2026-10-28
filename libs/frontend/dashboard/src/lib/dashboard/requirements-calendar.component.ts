import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ParticipantRequirementsStore } from '@mas/frontend-shared-data-access';
import { RouterLink } from '@angular/router';
import { ParticipantRequirement } from '@mas/models';

type CalendarTask = {
  requirement: ParticipantRequirement;
  id: string;
  title: string;
  program: string;
  programId: string;
  dueAt: string;
  dueLabel: string;
  isCompleted: boolean;
  canComplete: boolean;
};

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

@Component({
  selector: 'mas-requirements-calendar',
  imports: [MatIcon, RouterLink],
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
        <div class="flex items-center gap-2" aria-label="Calendar navigation">
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
            <p class="mt-5 text-sm text-ink-muted">Loading your calendar…</p>
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
                    [routerLink]="['/program-profiles', task.programId, 'course-progress']"
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
                        <span class="sr-only">Read-only requirement. Updated by your program team.</span>
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
              <p class="mt-3 text-sm font-bold text-ink">Nothing due this day</p>
              <p class="mt-1 text-xs leading-5 text-ink-muted">
                You can focus on another step or choose a marked date.
              </p>
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
  readonly tasksByDate = computed<Readonly<Record<string, readonly CalendarTask[]>>>(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    for (const requirement of this.requirementsStore.requirements()) {
      const date = toIsoDate(new Date(requirement.dueAt));
      (grouped[date] ??= []).push({
        requirement,
        id: requirement.id,
        title: requirement.name,
        program: requirement.programName,
        programId: requirement.programId,
        dueAt: requirement.dueAt,
        dueLabel: this.formatDueLabel(requirement.dueAt),
        isCompleted: requirement.isCompleted,
        canComplete: requirement.canComplete,
      });
    }
    return grouped;
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
      const tasks = this.tasksByDate()[iso] ?? [];
      const dueLabel = tasks.length ? `, ${tasks.length} item${tasks.length === 1 ? '' : 's'} due` : ', nothing due';
      return {
        day: index + 1,
        iso,
        isToday: iso === todayIso,
        tasks,
        indicatorTasks: tasks.slice(0, 3),
        label: `${formatDate(date, 'EEEE, MMMM d, yyyy', this.locale)}${dueLabel}`,
      };
    });
  });
  readonly selectedTasks = computed(() => this.tasksByDate()[this.selectedDate()] ?? []);
  readonly selectedDayHeading = computed(() =>
    formatDate(new Date(`${this.selectedDate()}T12:00:00`), 'EEEE, MMMM d', this.locale),
  );

  constructor() {
    this.requirementsStore.load();
  }

  private formatDueLabel(value: string): string {
    const dueAt = new Date(value);
    const date = formatDate(dueAt, 'MMM d', this.locale);
    const isToday = toIsoDate(dueAt) === toIsoDate(this.today);
    const isEndOfDay =
      (dueAt.getHours() === 0 && dueAt.getMinutes() === 0) || (dueAt.getHours() === 23 && dueAt.getMinutes() === 59);
    const time = isEndOfDay ? 'End of day' : formatDate(dueAt, 'h:mm a', this.locale);
    return `Due ${isToday ? `today, ${date}` : date} · ${time}`;
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
