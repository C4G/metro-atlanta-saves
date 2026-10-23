import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-course-progress',
  imports: [MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="tasks-heading">
      <div class="mb-5 sm:flex sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">Your next steps</p>
          <h2 id="tasks-heading" class="mt-1 text-2xl font-black tracking-tight">My tasks</h2>
          <p class="mt-2 text-sm text-ink-muted">Complete each requirement at a pace that works for you.</p>
        </div>
        <p class="mt-3 w-fit shrink-0 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong sm:mt-0">
          {{ completedCount() }} of {{ tasks().length }} complete
        </p>
      </div>

      @if (tasks().length) {
        <div class="grid gap-4 lg:grid-cols-2">
          @for (task of tasks(); track task.requirementId) {
            <article
              [id]="task.requirementId"
              class="group flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-outline bg-surface-raised transition-colors hover:border-brand/65 hover:bg-brand-soft/20 focus-within:border-brand target:border-brand target:bg-brand-soft/20"
            >
              <div class="flex flex-1 flex-col p-5 sm:p-6">
                <div class="mb-4 flex min-h-6 flex-wrap items-center justify-between gap-3">
                  <span class="text-xs font-semibold text-ink-subtle">
                    {{ task.isActionRequirement ? 'Action Task' : 'Program Requirement' }}
                  </span>
                  @if (!task.canComplete) {
                    <span
                      class="shrink-0 rounded-lg border border-outline bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-muted"
                    >
                      Read only
                    </span>
                  } @else if (task.isCompleted) {
                    <span class="shrink-0 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-strong">
                      Completed
                    </span>
                  }
                </div>
                <div class="flex items-center gap-4">
                  @if (task.canComplete) {
                    <button
                      type="button"
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft/70 text-brand-strong transition-colors hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-raised disabled:cursor-default"
                      [disabled]="usersOnProgramsStore.savingRequirementIds().includes(task.requirementId)"
                      [attr.aria-label]="
                        task.isCompleted
                          ? 'Mark ' + task.requirementName + ' incomplete'
                          : 'Mark ' + task.requirementName + ' complete'
                      "
                      [attr.aria-pressed]="task.isCompleted"
                      (click)="toggleTask(task.requirementId, task.isCompleted)"
                    >
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-strong"
                        [class.bg-brand-strong]="task.isCompleted"
                        [class.text-brand-on]="task.isCompleted"
                      >
                        @if (usersOnProgramsStore.savingRequirementIds().includes(task.requirementId)) {
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
                      </span>
                    </button>
                  } @else {
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-outline bg-surface-subtle text-ink-muted"
                    >
                      <mat-icon aria-hidden="true">assignment</mat-icon>
                    </div>
                  }

                  <div class="min-w-0 flex-1">
                    <h3 class="break-words text-base font-bold leading-6 tracking-tight text-ink sm:text-lg">
                      {{ task.requirementName }}
                    </h3>
                    @if (!task.canComplete) {
                      <p class="mt-1 text-xs leading-5 text-ink-subtle">Updated by your program team.</p>
                    }
                  </div>
                </div>
              </div>
              <footer
                class="flex flex-wrap items-center justify-between gap-3 border-t border-outline bg-surface-subtle/50 px-5 py-3.5 sm:px-6"
              >
                <div class="text-xs leading-5">
                  <p class="font-semibold text-ink-subtle">{{ task.dueLabel ? 'Due date' : 'Schedule' }}</p>
                  <p class="font-bold text-ink-muted">{{ task.dueLabel || 'No due date' }}</p>
                </div>
                @if (task.completionLink) {
                  <a
                    [href]="task.completionLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex min-h-10 items-center justify-center rounded-xl border border-outline bg-surface-raised px-4 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    Open content
                  </a>
                }
              </footer>
            </article>
          }
        </div>
      } @else {
        <div class="rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">task_alt</mat-icon>
          <h3 class="mt-3 text-lg font-bold">No tasks yet</h3>
          <p class="mt-1 text-sm text-ink-muted">Your program tasks will appear here when they are assigned.</p>
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class CourseProgressComponent {
  usersOnProgramsStore = inject(UsersOnProgramsStore);
  private readonly locale = inject(LOCALE_ID);
  tasks = computed(() =>
    this.usersOnProgramsStore
      .userProgramProgress()
      .map((task) => ({ ...task, dueLabel: task.dueAt ? formatDate(task.dueAt, 'MMM d, y', this.locale) : null })),
  );
  completedCount = computed(() => this.tasks().filter((task) => task.isCompleted).length);

  toggleTask(requirementId: string, isCompleted: boolean): void {
    this.usersOnProgramsStore.setRequirementCompletion({ requirementId, isCompleted: !isCompleted });
  }
}
