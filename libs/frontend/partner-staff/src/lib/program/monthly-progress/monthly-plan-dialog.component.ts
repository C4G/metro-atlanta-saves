import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  EducationalContentStore,
  FrequentTasksStore,
  ProgramsStore,
  TaskReviewStore,
} from '@mas/frontend-shared-data-access';
import { MAX_MONTHS, MonthlyPlanEditorStore, toDateInput } from './monthly-plan-editor.store';

export type MonthlyPlanDialogData = { month: number };

// Opens the plan editor on a month; the injector shares the program's monthly review data with the dialog.
export const openMonthlyPlan = (dialog: MatDialog, injector: Injector, month: number) => {
  injector.get(TaskReviewStore).clearPlanError();
  const data: MonthlyPlanDialogData = { month };
  return dialog.open(MonthlyPlanDialogComponent, {
    data,
    injector,
    width: '67.5rem',
    panelClass: 'mas-plain-dialog',
    backdropClass: 'mas-plain-backdrop',
    maxWidth: 'calc(100vw - 2rem)',
    ariaLabelledBy: 'monthly-plan-heading',
    autoFocus: 'dialog',
  });
};

const STAR = 'M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z';

import { DateInputComponent, SpinnerComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-monthly-plan-dialog',
  imports: [DateInputComponent, SpinnerComponent, MatIcon, NgTemplateOutlet],
  providers: [FrequentTasksStore, MonthlyPlanEditorStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="monthly-plan-heading" class="flex max-h-[90vh] flex-col text-ink">
      <header class="flex flex-wrap items-center justify-between gap-4 border-b border-outline px-7 py-5">
        <div>
          <h2 id="monthly-plan-heading" class="text-[1.375rem] font-bold leading-tight">Monthly plan</h2>
          <p class="mt-1 text-sm text-ink-muted">Open a month to add or edit its tasks.</p>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-[0.8125rem] font-bold text-ink-muted">Program length</span>
          <div class="flex items-center gap-1 rounded-[0.875rem] border border-outline bg-canvas p-1">
            <button
              type="button"
              (click)="editor.setMonths(editor.months() - 1)"
              [disabled]="editor.atMinimum()"
              aria-label="Remove a month"
              class="flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[0.625rem] border border-outline bg-surface-raised text-ink hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:bg-surface-raised"
            >
              <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl !leading-none">remove</mat-icon>
            </button>
            <output class="min-w-[5.625rem] text-center text-[0.9375rem] font-bold tabular-nums" aria-live="polite">
              {{ editor.months() }} {{ editor.months() === 1 ? 'month' : 'months' }}
            </output>
            <button
              type="button"
              (click)="editor.setMonths(editor.months() + 1)"
              [disabled]="editor.atMaximum()"
              aria-label="Add a month"
              class="flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[0.625rem] border border-outline bg-surface-raised text-ink hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:bg-surface-raised"
            >
              <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl !leading-none">add</mat-icon>
            </button>
          </div>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:items-stretch">
        <div class="min-w-0 flex-1">
          <div class="flex items-stretch gap-2 px-7 pt-[1.125rem]">
            <button
              type="button"
              (click)="editor.showEarlier()"
              [disabled]="!editor.canGoEarlier()"
              aria-label="Show earlier months"
              class="flex w-10 shrink-0 items-center justify-center rounded-xl border border-outline bg-surface-raised text-ink hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:bg-surface-raised"
            >
              <mat-icon aria-hidden="true">chevron_left</mat-icon>
            </button>
            <div role="tablist" aria-label="Months" class="grid min-w-0 flex-1 grid-cols-6 gap-1.5">
              @for (tab of editor.tabs(); track tab.n) {
                <button
                  type="button"
                  role="tab"
                  (click)="editor.select(tab.n)"
                  [attr.aria-selected]="tab.isSelected"
                  aria-controls="plan-month-panel"
                  class="min-h-11 min-w-0 truncate rounded-xl border px-1 text-[0.8125rem] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [class.border-brand-strong]="tab.isSelected"
                  [class.bg-brand-strong]="tab.isSelected"
                  [class.text-brand-on]="tab.isSelected"
                  [class.border-outline]="!tab.isSelected"
                  [class.bg-surface-raised]="!tab.isSelected"
                  [class.text-ink]="!tab.isSelected"
                >
                  {{ tab.label }}
                </button>
              }
            </div>
            <button
              type="button"
              (click)="editor.showLater()"
              [disabled]="!editor.canGoLater()"
              aria-label="Show later months"
              class="flex w-10 shrink-0 items-center justify-center rounded-xl border border-outline bg-surface-raised text-ink hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40 disabled:hover:bg-surface-raised"
            >
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
          @let month = editor.month();
          <div id="plan-month-panel" role="tabpanel" [attr.aria-label]="month.label" class="px-7 pb-[1.375rem] pt-3.5">
            <h3 class="mb-2.5 text-[1.0625rem] font-bold">{{ month.label }}</h3>
            @if (editor.atMinimum() && editor.minimumMonths() > 1) {
              <p class="mb-2.5 text-xs leading-5 text-ink-muted">
                Month {{ editor.minimumMonths() }} still has tasks. Move or remove them to shorten the program.
              </p>
            }
            <div class="flex flex-col gap-2">
              @for (task of month.tasks; track task.key) {
                @if (task.isEditing) {
                  <ng-container *ngTemplateOutlet="taskForm" />
                } @else {
                  <div
                    class="flex items-center gap-3 rounded-[0.875rem] border border-outline bg-surface-raised py-3 pl-4 pr-3"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ task.name }}</span>
                      <span class="block truncate text-xs text-ink-muted">{{ task.meta }}</span>
                    </span>
                    @if (!month.n) {
                      <label class="sr-only" [for]="'move-' + task.key">Month for {{ task.name }}</label>
                      <select
                        #move
                        [id]="'move-' + task.key"
                        (change)="move.value && editor.moveToMonth(task.key, +move.value)"
                        class="min-h-9 rounded-[0.625rem] border border-outline bg-surface px-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="">Choose month…</option>
                        @for (option of editor.monthOptions(); track option) {
                          <option [value]="option">Month {{ option }}</option>
                        }
                      </select>
                    }
                    <button
                      type="button"
                      (click)="editor.toggleStar(task.key)"
                      [attr.aria-pressed]="task.isStarred"
                      [attr.aria-label]="task.starLabel"
                      [title]="task.starLabel"
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      [class.border-brand]="task.isStarred"
                      [class.bg-brand-soft]="task.isStarred"
                      [class.text-brand-strong]="task.isStarred"
                      [class.border-outline]="!task.isStarred"
                      [class.text-ink-muted]="!task.isStarred"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        [attr.fill]="task.isStarred ? 'currentColor' : 'none'"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path [attr.d]="star" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      (click)="editor.startEditing(task.key)"
                      [attr.aria-label]="'Edit ' + task.name"
                      class="min-h-9 rounded-[0.625rem] border border-outline bg-surface px-3 text-xs font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      Edit
                    </button>
                  </div>
                }
              } @empty {
                @if (!editor.formView()?.isNew) {
                  <p
                    class="rounded-[0.875rem] border border-dashed border-outline p-5 text-center text-sm text-ink-muted"
                  >
                    No tasks in {{ month.label }} yet.
                  </p>
                }
              }
              @if (month.n) {
                @if (editor.formView()?.isNew) {
                  <ng-container *ngTemplateOutlet="taskForm" />
                } @else {
                  <button
                    type="button"
                    (click)="editor.startAdding()"
                    class="min-h-[2.875rem] w-full rounded-[0.875rem] border border-dashed border-brand text-sm font-bold text-brand-strong hover:bg-brand-soft/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    + Add a task to {{ month.label }}
                  </button>
                }
              }
            </div>
            @if (review.planError()) {
              <p role="alert" class="mt-3 text-sm leading-6 text-danger">{{ review.planError() }}</p>
            }
          </div>

          <ng-template #taskForm>
            @if (editor.formView(); as form) {
              <form
                (submit)="$event.preventDefault(); editor.submitForm()"
                aria-labelledby="task-form-heading"
                class="overflow-hidden rounded-[1.125rem] border border-brand bg-surface-raised"
              >
                <div class="flex items-center justify-between gap-3 border-b border-outline py-3 pl-[1.125rem] pr-4">
                  <h4 id="task-form-heading" class="text-[0.9375rem] font-bold">
                    {{ form.isNew ? 'New task for ' + month.label : 'Edit task' }}
                  </h4>
                  <button
                    type="button"
                    (click)="editor.cancelForm()"
                    aria-label="Close without saving"
                    class="flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-[0.625rem] border border-outline bg-surface text-ink-muted hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <mat-icon aria-hidden="true" class="!h-[1.125rem] !w-[1.125rem] !text-lg !leading-none">
                      close
                    </mat-icon>
                  </button>
                </div>
                <div class="flex flex-col gap-3.5 px-[1.125rem] py-4">
                  <div class="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div>
                      <label for="plan-task-name" class="mb-1.5 block text-xs font-bold text-ink-muted">
                        Task name
                      </label>
                      <input
                        #name
                        id="plan-task-name"
                        [value]="form.name"
                        (input)="editor.updateForm({ name: name.value })"
                        placeholder="e.g. Upload bank statement"
                        class="min-h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label for="plan-task-due" class="mb-1.5 block text-xs font-bold text-ink-muted">
                        Due date
                        <span class="font-normal">(optional)</span>
                      </label>
                      <mas-date-input
                        inputId="plan-task-due"
                        [value]="form.due"
                        [min]="month.minDue"
                        [max]="month.maxDue"
                        (valueChange)="editor.updateForm({ due: $event })"
                      />
                    </div>
                  </div>
                  @if (form.content; as attached) {
                    <div>
                      <span class="mb-1.5 block text-xs font-bold text-ink-muted">Content</span>
                      <div
                        class="flex items-center gap-3 rounded-xl border border-outline bg-surface py-2.5 pl-3 pr-2.5"
                      >
                        <span
                          aria-hidden="true"
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.625rem] bg-brand-soft text-[0.6875rem] font-black text-brand-strong"
                        >
                          {{ attached.mark }}
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-bold">{{ attached.title }}</span>
                          <span class="block truncate text-xs text-ink-muted">{{ attached.meta }}</span>
                        </span>
                        <button
                          type="button"
                          (click)="editor.updateForm({ educationalContentId: null })"
                          aria-label="Remove content"
                          class="flex h-8 w-8 items-center justify-center rounded-[0.5625rem] border border-outline text-ink-muted hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base !leading-none">close</mat-icon>
                        </button>
                      </div>
                    </div>
                  } @else if (form.pickingContent) {
                    <div class="overflow-hidden rounded-[0.875rem] border border-outline bg-surface">
                      <div class="flex items-center gap-2 border-b border-outline py-2 pl-3 pr-2">
                        <input
                          #contentQuery
                          [value]="form.contentQuery"
                          (input)="editor.updateForm({ contentQuery: contentQuery.value })"
                          placeholder="Search learning content"
                          aria-label="Search learning content"
                          class="min-h-9 min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                        />
                        <button
                          type="button"
                          (click)="editor.updateForm({ pickingContent: false, contentQuery: '' })"
                          class="min-h-8 rounded-[0.5625rem] border border-outline bg-surface-raised px-2.5 text-xs font-bold hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          Done
                        </button>
                      </div>
                      <ul class="max-h-[12.5rem] overflow-y-auto p-1">
                        @for (item of form.contentItems; track item.id) {
                          <li>
                            <button
                              type="button"
                              (click)="editor.pickContent(item.id)"
                              class="flex w-full items-center gap-3 rounded-[0.625rem] px-2.5 py-2 text-left hover:bg-brand-soft/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              <span
                                aria-hidden="true"
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[0.625rem] font-black text-brand-strong"
                              >
                                {{ item.mark }}
                              </span>
                              <span class="min-w-0">
                                <span class="block truncate text-sm font-bold">{{ item.title }}</span>
                                <span class="block truncate text-xs text-ink-muted">{{ item.meta }}</span>
                              </span>
                            </button>
                          </li>
                        } @empty {
                          <li class="px-2.5 py-3 text-sm text-ink-muted">No content matches.</li>
                        }
                      </ul>
                    </div>
                  } @else {
                    <button
                      type="button"
                      (click)="editor.updateForm({ pickingContent: true })"
                      class="inline-flex min-h-9 items-center gap-1.5 self-start rounded-[0.625rem] border border-dashed border-brand px-3 text-[0.8125rem] font-bold text-brand-strong hover:bg-brand-soft/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      + Add content
                      <span class="font-normal text-ink-muted">(optional)</span>
                    </button>
                  }
                </div>
                <div
                  class="flex flex-wrap items-center justify-between gap-3 border-t border-outline bg-surface-subtle px-[1.125rem] py-3"
                >
                  @if (form.isNew) {
                    <button
                      type="button"
                      (click)="editor.updateForm({ saveToFrequent: !form.saveToFrequent })"
                      [attr.aria-pressed]="form.saveToFrequent"
                      class="inline-flex min-h-9 items-center gap-2 rounded-[0.625rem] border px-3 text-[0.8125rem] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      [class.border-brand]="form.saveToFrequent"
                      [class.bg-brand-soft]="form.saveToFrequent"
                      [class.text-brand-strong]="form.saveToFrequent"
                      [class.border-outline]="!form.saveToFrequent"
                      [class.bg-surface]="!form.saveToFrequent"
                      [class.text-ink]="!form.saveToFrequent"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        [attr.fill]="form.saveToFrequent ? 'currentColor' : 'none'"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path [attr.d]="star" />
                      </svg>
                      {{ form.saveToFrequent ? 'Saved to frequently used' : 'Save to frequently used' }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="form.key && editor.removeTask(form.key)"
                      class="min-h-9 rounded-[0.625rem] border border-danger px-3 text-[0.8125rem] font-bold text-danger hover:bg-danger/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    >
                      Remove task
                    </button>
                  }
                  <span class="flex gap-2">
                    <button
                      type="button"
                      (click)="editor.cancelForm()"
                      class="min-h-10 rounded-xl border border-outline bg-surface px-3.5 text-[0.8125rem] font-bold text-ink hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      [disabled]="!form.canSubmit"
                      class="min-h-10 rounded-xl border border-brand-strong bg-brand-strong px-4 text-[0.8125rem] font-bold text-brand-on hover:bg-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                    >
                      {{ form.isNew ? 'Add task' : 'Save task' }}
                    </button>
                  </span>
                </div>
              </form>
            }
          </ng-template>
        </div>

        <aside
          aria-labelledby="frequent-heading"
          class="flex shrink-0 flex-col gap-3.5 border-t border-outline bg-surface-subtle px-5 py-[1.375rem] md:w-80 md:border-l md:border-t-0"
        >
          <div>
            <div class="flex items-center justify-between">
              <h3 id="frequent-heading" class="text-[0.9375rem] font-bold">Frequently used</h3>
              <span class="min-w-6 rounded-lg bg-surface px-2 py-0.5 text-center text-xs font-bold text-ink-muted">
                {{ editor.library().length }}
              </span>
            </div>
            <p class="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-ink-muted">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                class="mt-[0.1875rem] shrink-0 text-brand-strong"
                aria-hidden="true"
              >
                <path [attr.d]="star" />
              </svg>
              Star a task in the month to save it here. Shared with your partner’s staff.
            </p>
          </div>
          @if (frequent.error()) {
            <p role="alert" class="text-xs text-danger">{{ frequent.error() }}</p>
          }
          @if (editor.library().length) {
            <ul class="overflow-hidden rounded-[0.875rem] border border-outline bg-surface-raised">
              @for (item of editor.library(); track item.id) {
                <li
                  class="flex items-center gap-2.5 py-[0.6875rem] pl-3.5 pr-2.5"
                  [class.border-t]="!$first"
                  [class.border-outline]="!$first"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-[0.8125rem] font-bold">{{ item.name }}</span>
                    <span class="mt-px block truncate text-[0.6875rem] text-ink-muted">{{ item.meta }}</span>
                  </span>
                  <button
                    type="button"
                    (click)="editor.addFromLibrary(item.id)"
                    [disabled]="item.isAdded || !month.n"
                    [attr.aria-label]="
                      item.isAdded ? item.name + ' is in ' + month.label : 'Add ' + item.name + ' to ' + month.label
                    "
                    class="min-h-8 min-w-16 rounded-[0.5625rem] border px-2.5 text-xs font-bold enabled:hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [class.border-outline]="!item.isAdded"
                    [class.bg-surface]="!item.isAdded"
                    [class.text-brand-strong]="!item.isAdded"
                    [class.border-transparent]="item.isAdded"
                    [class.text-ink-muted]="item.isAdded"
                  >
                    {{ item.isAdded ? 'Added' : 'Add' }}
                  </button>
                  <button
                    type="button"
                    (click)="frequent.remove(item.id)"
                    [disabled]="item.isPending"
                    [attr.aria-label]="'Remove ' + item.name + ' from frequently used'"
                    title="Remove from frequently used"
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.5625rem] text-brand-strong hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path [attr.d]="star" />
                    </svg>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p
              class="rounded-[0.875rem] border border-dashed border-outline px-4 py-[1.375rem] text-center text-[0.8125rem] text-ink-muted"
            >
              @if (frequent.loading()) {
                <span role="status" class="inline-flex items-center gap-2 text-brand-strong">
                  <mas-spinner />
                  <span class="sr-only">Loading frequently used tasks</span>
                </span>
              } @else {
                Nothing saved yet.
              }
            </p>
          }
        </aside>
      </div>

      <footer class="flex items-center justify-end gap-2 border-t border-outline px-7 py-4">
        <button
          type="button"
          (click)="dialogRef.close()"
          [disabled]="review.planSaving()"
          class="min-h-11 rounded-xl border border-outline bg-surface px-[1.125rem] text-sm font-bold text-ink hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="save()"
          [disabled]="review.planSaving()"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-strong bg-brand-strong px-[1.125rem] text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-wait disabled:opacity-60"
        >
          <span class="relative inline-flex items-center justify-center">
            <span [class.invisible]="review.planSaving()">Save plan</span>
            @if (review.planSaving()) {
              <mas-spinner class="absolute" />
              <span class="sr-only">Save plan</span>
            }
          </span>
        </button>
      </footer>
    </section>
  `,
})
export class MonthlyPlanDialogComponent {
  private readonly data = inject<MonthlyPlanDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MonthlyPlanDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly programsStore = inject(ProgramsStore);
  readonly review = inject(TaskReviewStore);
  readonly frequent = inject(FrequentTasksStore);
  readonly editor = inject(MonthlyPlanEditorStore);
  readonly star = STAR;

  constructor() {
    inject(EducationalContentStore).getContentList([]);
    this.frequent.load(this.review.programId());
    this.editor.start({
      months: Math.min(MAX_MONTHS, Math.max(this.review.months().length, 1)),
      month: this.data.month,
      tasks: (this.review.data()?.requirements ?? []).map((requirement) => ({
        id: requirement.id,
        name: requirement.name,
        month: requirement.month,
        due: toDateInput(requirement.dueAt),
        educationalContentId: requirement.educationalContentId,
      })),
    });
  }

  save(): void {
    this.review.savePlan({
      ...this.editor.submission(),
      onSaved: () => {
        this.programsStore.getProgram(this.review.programId());
        this.snackBar.open('Monthly plan saved.');
        this.dialogRef.close();
      },
    });
  }
}
