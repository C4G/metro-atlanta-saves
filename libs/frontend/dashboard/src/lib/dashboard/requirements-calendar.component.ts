import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ParticipantRequirement } from '@mas/models';

type CalendarTask = {
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
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Component({
  selector: 'mas-requirements-calendar',
  imports: [MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-2xl border border-outline bg-surface" aria-labelledby="calendar-heading">
      <div class="flex flex-col gap-4 border-b border-outline px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Schedule</p>
          <h2 id="calendar-heading" class="mt-1 text-xl font-bold text-ink">Calendar</h2>
          <p class="mt-1 text-sm text-ink-muted">Select a day to see what is due.</p>
        </div>
        <div class="flex items-center gap-2" aria-label="Calendar navigation">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline text-ink transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Previous month"
            (click)="showPreviousMonth()"
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
            (click)="showNextMonth()"
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
          <div class="grid grid-cols-7 gap-1" role="grid" [attr.aria-label]="monthHeading() + ' ' + yearHeading()">
            @for (weekday of weekdays; track weekday) {
              <div
                class="pb-2 text-center text-[0.625rem] font-bold uppercase tracking-wide text-ink-subtle sm:text-xs"
                role="columnheader"
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
                role="gridcell"
                class="group relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-transparent p-1 text-center transition-colors hover:border-brand/40 hover:bg-brand-soft/40 focus:z-10 focus:border-brand focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand sm:min-h-20 sm:gap-2 sm:p-2"
                [class.bg-brand-soft]="selectedDate() === day.iso"
                [attr.aria-label]="day.label"
                [attr.aria-pressed]="selectedDate() === day.iso"
                (click)="selectDay(day.iso)"
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
          @if (selectedTasks().length) {
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
                          class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-brand-soft disabled:cursor-wait disabled:opacity-60"
                          [class.border-brand-strong]="task.isCompleted"
                          [class.bg-brand-strong]="task.isCompleted"
                          [class.text-brand-on]="task.isCompleted"
                          [class.border-brand]="!task.isCompleted"
                          [class.bg-surface]="!task.isCompleted"
                          [class.text-brand-strong]="!task.isCompleted"
                          [disabled]="savingTaskIds().has(task.id)"
                          [attr.aria-label]="
                            task.isCompleted ? 'Mark ' + task.title + ' incomplete' : 'Mark ' + task.title + ' complete'
                          "
                          [attr.aria-pressed]="task.isCompleted"
                          (click)="toggleTask(task)"
                        >
                          @if (savingTaskIds().has(task.id)) {
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
                    }

                    <div class="min-w-0 flex-1 self-center p-4">
                      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] font-bold">
                        <span class="uppercase tracking-wide text-brand-strong">{{ task.dueLabel }}</span>
                      </div>
                      <h4 class="mt-1.5 text-sm font-bold leading-5 text-ink">{{ task.title }}</h4>
                      <p class="mt-1 flex h-5 items-center gap-1.5 text-xs text-ink-muted">
                        <mat-icon
                          class="!flex !h-4 !w-4 shrink-0 items-center justify-center !text-base !leading-none"
                          aria-hidden="true"
                        >
                          school
                        </mat-icon>
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
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  readonly weekdays = DAYS;
  readonly today = new Date();
  readonly visibleMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedDate = signal(toIsoDate(this.today));
  readonly requirements = signal<readonly ParticipantRequirement[]>([]);
  readonly savingTaskIds = signal<ReadonlySet<string>>(new Set());
  readonly tasksByDate = computed<Readonly<Record<string, readonly CalendarTask[]>>>(() => {
    const grouped: Record<string, CalendarTask[]> = {};
    for (const requirement of this.requirements()) {
      const date = toIsoDate(new Date(requirement.dueAt));
      (grouped[date] ??= []).push({
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
  readonly monthHeading = computed(() => this.visibleMonth().toLocaleDateString(undefined, { month: 'long' }));
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
        label: `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${dueLabel}`,
      };
    });
  });
  readonly selectedTasks = computed(() => this.tasksByDate()[this.selectedDate()] ?? []);
  readonly selectedDayHeading = computed(() =>
    new Date(`${this.selectedDate()}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  );

  constructor() {
    this.http.get<ParticipantRequirement[]>('/api/users-on-programs/user/requirements').subscribe({
      next: (requirements) => this.requirements.set(requirements),
      error: () =>
        this.snackBar.open('We could not load your calendar. Please try again.', undefined, { duration: 5000 }),
    });
  }

  selectDay(iso: string): void {
    this.selectedDate.set(iso);
  }

  private formatDueLabel(value: string): string {
    const dueAt = new Date(value);
    const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueAt);
    const isToday = toIsoDate(dueAt) === toIsoDate(this.today);
    const isEndOfDay =
      (dueAt.getHours() === 0 && dueAt.getMinutes() === 0) || (dueAt.getHours() === 23 && dueAt.getMinutes() === 59);
    const time = isEndOfDay
      ? 'End of day'
      : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(dueAt);
    return `Due ${isToday ? `today, ${date}` : date} · ${time}`;
  }

  toggleTask(task: CalendarTask): void {
    this.savingTaskIds.update((current) => {
      const next = new Set(current);
      next.add(task.id);
      return next;
    });
    const url = `/api/users-on-programs/user/program/${task.programId}/requirements/${task.id}/completion`;
    const request = task.isCompleted ? this.http.delete(url) : this.http.post(url, {});
    request.subscribe({
      next: () => {
        this.requirements.update((requirements) =>
          requirements.map((requirement) =>
            requirement.id === task.id ? { ...requirement, isCompleted: !task.isCompleted } : requirement,
          ),
        );
        this.finishSaving(task.id);
      },
      error: () => {
        this.finishSaving(task.id);
        this.snackBar.open('We could not update this task. Please try again.', undefined, { duration: 5000 });
      },
    });
  }

  showPreviousMonth(): void {
    this.changeMonth(-1);
  }
  showNextMonth(): void {
    this.changeMonth(1);
  }
  showToday(): void {
    this.visibleMonth.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDate.set(toIsoDate(this.today));
  }
  private changeMonth(offset: number): void {
    const current = this.visibleMonth();
    const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
    this.visibleMonth.set(next);
    this.selectedDate.set(toIsoDate(next));
  }

  private finishSaving(taskId: string): void {
    this.savingTaskIds.update((current) => {
      const next = new Set(current);
      next.delete(taskId);
      return next;
    });
  }
}
