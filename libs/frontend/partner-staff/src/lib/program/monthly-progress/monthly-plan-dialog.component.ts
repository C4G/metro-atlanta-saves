import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateInputComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import {
  EducationalContentStore,
  FrequentTasksStore,
  ProgramsStore,
  TaskReviewStore,
} from '@mas/frontend-shared-data-access';
import { openWindow } from '../ui/open-window';
import {
  CONTROL,
  CONTROL_SM,
  CONTROL_SOLID,
  CONTROL_SOLID_SM,
  FIELD,
  ICON_CONTROL,
  ICON_TILE,
  LABEL,
  ROW,
  SEGMENT,
} from '../ui/staff-ui';
import { WindowFrameComponent } from '../ui/window-frame.component';
import { MAX_MONTHS, MonthlyPlanEditorStore, toDateInput } from './monthly-plan-editor.store';

export type MonthlyPlanDialogData = { month: number };

export const openMonthlyPlan = (dialog: MatDialog, injector: Injector, month: number) => {
  injector.get(TaskReviewStore).clearPlanError();
  return openWindow<MonthlyPlanDialogComponent, MonthlyPlanDialogData>(dialog, MonthlyPlanDialogComponent, {
    width: '67.5rem',
    labelledBy: 'monthly-plan-heading',
    data: { month },
    injector,
  });
};

const STAR_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50';
const SMALL_ICON_CONTROL =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-surface-raised/70 text-ink-muted transition-colors hover:border-brand/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

@Component({
  selector: 'mas-monthly-plan-dialog',
  imports: [DateInputComponent, MatIcon, NgTemplateOutlet, SpinnerComponent, WindowFrameComponent],
  providers: [FrequentTasksStore, MonthlyPlanEditorStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-window-frame
      heading="Monthly plan"
      headingId="monthly-plan-heading"
      subtitle="Open a month to add or edit its tasks."
      [busy]="review.planSaving()"
    >
      <div windowActions class="flex items-center gap-2.5 max-sm:order-last max-sm:w-full max-sm:justify-between">
        <span class="text-xs font-bold text-ink-muted">Program length</span>
        <div [class]="segmentClass + ' items-center'">
          <button
            type="button"
            [class]="stepClass"
            aria-label="Shorten the program"
            [disabled]="editor.atMinimum()"
            (click)="editor.setMonths(editor.months() - 1)"
          >
            <mat-icon class="mas-icon-md" aria-hidden="true">remove</mat-icon>
          </button>
          <output class="min-w-20 text-center text-sm font-bold tabular-nums" aria-live="polite">
            {{ editor.months() }} {{ editor.months() === 1 ? 'month' : 'months' }}
          </output>
          <button
            type="button"
            [class]="stepClass"
            aria-label="Lengthen the program"
            [disabled]="editor.atMaximum()"
            (click)="editor.setMonths(editor.months() + 1)"
          >
            <mat-icon class="mas-icon-md" aria-hidden="true">add</mat-icon>
          </button>
        </div>
      </div>

      <div class="grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div class="flex min-w-0 flex-col gap-3 p-3 sm:p-5">
          <div class="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <button
              type="button"
              [class]="iconControlClass"
              aria-label="Show earlier months"
              [disabled]="!editor.canGoEarlier()"
              (click)="editor.showEarlier()"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">chevron_left</mat-icon>
            </button>
            <div
              role="tablist"
              aria-label="Months"
              class="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-6 [&::-webkit-scrollbar]:hidden"
            >
              @for (tab of editor.tabs(); track tab.n) {
                <button
                  type="button"
                  role="tab"
                  class="min-h-10 min-w-24 shrink-0 truncate rounded-xl border px-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand md:min-w-0"
                  [class]="tab.isSelected ? chipOnClass : chipOffClass"
                  [attr.aria-selected]="tab.isSelected"
                  aria-controls="plan-month-panel"
                  (click)="editor.select(tab.n)"
                >
                  {{ tab.label }}
                </button>
              }
            </div>
            <button
              type="button"
              [class]="iconControlClass"
              aria-label="Show later months"
              [disabled]="!editor.canGoLater()"
              (click)="editor.showLater()"
            >
              <mat-icon class="mas-icon-md" aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>

          @let month = editor.month();
          <div id="plan-month-panel" role="tabpanel" [attr.aria-label]="month.label" class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-base font-bold">{{ month.label }}</h3>
              <span class="text-xs font-bold text-ink-muted">
                {{ month.tasks.length }} {{ month.tasks.length === 1 ? 'task' : 'tasks' }}
              </span>
            </div>
            @if (editor.atMinimum() && editor.minimumMonths() > 1) {
              <p
                class="flex items-start gap-2 rounded-xl border border-warn-ink/40 bg-warn-soft px-3 py-2.5 text-xs font-bold leading-5 text-warn-ink"
              >
                <mat-icon class="mas-icon-sm shrink-0" aria-hidden="true">info</mat-icon>
                Month {{ editor.minimumMonths() }} still has tasks. Move or remove them to shorten the program.
              </p>
            }
            @for (task of month.tasks; track task.key) {
              @if (task.isEditing) {
                <ng-container *ngTemplateOutlet="taskForm" />
              } @else {
                <div [class]="rowClass + ' flex items-center gap-2.5 py-2 pl-3.5 pr-2'">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold">{{ task.name }}</span>
                    <span class="block truncate text-xs text-ink-muted">{{ task.meta }}</span>
                  </span>
                  @if (!month.n) {
                    <label class="sr-only" [for]="'move-' + task.key">Month for {{ task.name }}</label>
                    <select
                      #move
                      [id]="'move-' + task.key"
                      [class]="selectClass"
                      (change)="move.value && editor.moveToMonth(task.key, +move.value)"
                    >
                      <option value="">Choose month</option>
                      @for (option of editor.monthOptions(); track option) {
                        <option [value]="option">Month {{ option }}</option>
                      }
                    </select>
                  }
                  <button
                    type="button"
                    [class]="starButtonClass + ' ' + (task.isStarred ? starOnClass : starOffClass)"
                    [attr.aria-pressed]="task.isStarred"
                    [attr.aria-label]="task.starLabel"
                    [title]="task.starLabel"
                    (click)="editor.toggleStar(task.key)"
                  >
                    <mat-icon class="mas-icon-md" aria-hidden="true">
                      {{ task.isStarred ? 'star' : 'star_border' }}
                    </mat-icon>
                  </button>
                  <button
                    type="button"
                    [class]="controlSmClass"
                    [attr.aria-label]="'Edit ' + task.name"
                    (click)="editor.startEditing(task.key)"
                  >
                    Edit
                  </button>
                </div>
              }
            } @empty {
              @if (!editor.formView()?.isNew) {
                <p class="rounded-xl border border-dashed border-outline p-5 text-center text-sm text-ink-muted">
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
                  class="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand/55 text-sm font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  (click)="editor.startAdding()"
                >
                  <mat-icon class="mas-icon-sm" aria-hidden="true">add</mat-icon>
                  Add a task to {{ month.label }}
                </button>
              }
            }
            @if (review.planError()) {
              <p role="alert" class="text-sm leading-6 text-danger">{{ review.planError() }}</p>
            }
          </div>

          <ng-template #taskForm>
            @if (editor.formView(); as form) {
              <form
                class="overflow-hidden rounded-xl border border-brand/55 bg-surface-raised"
                aria-labelledby="task-form-heading"
                (submit)="$event.preventDefault(); editor.submitForm()"
              >
                <div class="flex items-center justify-between gap-3 border-b border-outline/55 py-2.5 pl-4 pr-2.5">
                  <h4 id="task-form-heading" class="text-sm font-bold">
                    {{ form.isNew ? 'New task for ' + month.label : 'Edit task' }}
                  </h4>
                  <button
                    type="button"
                    [class]="smallIconControlClass"
                    aria-label="Close without saving"
                    (click)="editor.cancelForm()"
                  >
                    <mat-icon class="mas-icon-sm" aria-hidden="true">close</mat-icon>
                  </button>
                </div>
                <div class="flex flex-col gap-3 p-4">
                  <div class="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div class="flex flex-col gap-1.5">
                      <label for="plan-task-name" [class]="labelClass">Task name</label>
                      <input
                        #name
                        id="plan-task-name"
                        [class]="fieldClass"
                        [value]="form.name"
                        placeholder="For example Upload bank statement"
                        (input)="editor.updateForm({ name: name.value })"
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label for="plan-task-due" [class]="labelClass">
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
                    <div class="flex flex-col gap-1.5">
                      <span [class]="labelClass">Content</span>
                      <div [class]="rowClass + ' flex items-center gap-3 p-2'">
                        <span [class]="iconTileClass + ' text-xs font-bold'" aria-hidden="true">
                          {{ attached.mark }}
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-bold">{{ attached.title }}</span>
                          <span class="block truncate text-xs text-ink-muted">{{ attached.meta }}</span>
                        </span>
                        <button
                          type="button"
                          [class]="smallIconControlClass"
                          aria-label="Remove content"
                          (click)="editor.updateForm({ educationalContentId: null })"
                        >
                          <mat-icon class="mas-icon-sm" aria-hidden="true">close</mat-icon>
                        </button>
                      </div>
                    </div>
                  } @else if (form.pickingContent) {
                    <div [class]="rowClass + ' overflow-hidden'">
                      <div class="flex items-center gap-2 border-b border-outline/55 py-1.5 pl-3 pr-1.5">
                        <input
                          #contentQuery
                          class="min-h-9 min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                          [value]="form.contentQuery"
                          placeholder="Search learning content"
                          aria-label="Search learning content"
                          (input)="editor.updateForm({ contentQuery: contentQuery.value })"
                        />
                        <button
                          type="button"
                          [class]="controlSmClass"
                          (click)="editor.updateForm({ pickingContent: false, contentQuery: '' })"
                        >
                          Done
                        </button>
                      </div>
                      <ul class="max-h-52 overflow-y-auto p-1">
                        @for (item of form.contentItems; track item.id) {
                          <li>
                            <button
                              type="button"
                              class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                              (click)="editor.pickContent(item.id)"
                            >
                              <span [class]="iconTileClass + ' text-xs font-bold'" aria-hidden="true">
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
                      class="inline-flex min-h-9 items-center gap-1.5 self-start rounded-xl border border-dashed border-brand/55 px-3 text-xs font-bold text-brand-strong transition-colors hover:border-brand hover:bg-brand-soft/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      (click)="editor.updateForm({ pickingContent: true })"
                    >
                      <mat-icon class="mas-icon-sm" aria-hidden="true">add</mat-icon>
                      Add content
                      <span class="font-normal text-ink-muted">(optional)</span>
                    </button>
                  }
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 border-t border-outline/55 px-4 py-2.5">
                  @if (form.isNew) {
                    <button
                      type="button"
                      [class]="controlSmClass"
                      [class.text-brand-strong]="form.saveToFrequent"
                      [attr.aria-pressed]="form.saveToFrequent"
                      (click)="editor.updateForm({ saveToFrequent: !form.saveToFrequent })"
                    >
                      <mat-icon class="mas-icon-sm" aria-hidden="true">
                        {{ form.saveToFrequent ? 'star' : 'star_border' }}
                      </mat-icon>
                      {{ form.saveToFrequent ? 'Saved to frequently used' : 'Save to frequently used' }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      [class]="controlSmClass + ' text-danger'"
                      (click)="form.key && editor.removeTask(form.key)"
                    >
                      <mat-icon class="mas-icon-sm" aria-hidden="true">delete</mat-icon>
                      Remove task
                    </button>
                  }
                  <span class="flex gap-2">
                    <button type="button" [class]="controlSmClass" (click)="editor.cancelForm()">Cancel</button>
                    <button type="submit" [class]="solidSmClass" [disabled]="!form.canSubmit">
                      {{ form.isNew ? 'Add task' : 'Save task' }}
                    </button>
                  </span>
                </div>
              </form>
            }
          </ng-template>
        </div>

        <aside
          class="flex min-w-0 flex-col gap-3 border-t border-outline/55 bg-surface-subtle/35 p-3 sm:p-5 md:border-l md:border-t-0"
          aria-labelledby="frequent-heading"
        >
          <div class="flex items-center justify-between">
            <h3 id="frequent-heading" class="text-sm font-bold">Frequently used</h3>
            <span class="text-xs font-bold text-ink-muted">{{ editor.library().length }}</span>
          </div>
          <p class="flex items-start gap-1.5 text-xs leading-5 text-ink-muted">
            <mat-icon class="mas-icon-sm shrink-0 text-brand-strong" aria-hidden="true">star</mat-icon>
            Star a task in the month to save it here. Shared with your partner’s staff.
          </p>
          @if (frequent.error()) {
            <p role="alert" class="text-xs text-danger">{{ frequent.error() }}</p>
          }
          @if (editor.library().length) {
            <ul class="flex flex-col gap-2">
              @for (item of editor.library(); track item.id) {
                <li [class]="rowClass + ' flex items-center gap-2 py-1.5 pl-3 pr-1.5'">
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold">{{ item.name }}</span>
                    <span class="block truncate text-xs text-ink-muted">{{ item.meta }}</span>
                  </span>
                  @if (item.isAdded) {
                    <span class="px-1.5 text-xs font-bold text-ink-muted">Added</span>
                  } @else {
                    <button
                      type="button"
                      [class]="controlSmClass"
                      [disabled]="!month.n"
                      [attr.aria-label]="'Add ' + item.name + ' to ' + month.label"
                      (click)="editor.addFromLibrary(item.id)"
                    >
                      Add
                    </button>
                  }
                  <button
                    type="button"
                    [class]="starButtonClass + ' ' + starOnClass"
                    [disabled]="item.isPending"
                    [attr.aria-label]="'Remove ' + item.name + ' from frequently used'"
                    title="Remove from frequently used"
                    (click)="frequent.remove(item.id)"
                  >
                    <mat-icon class="mas-icon-md" aria-hidden="true">star</mat-icon>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="rounded-xl border border-dashed border-outline px-4 py-5 text-center text-sm text-ink-muted">
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

      <button
        windowFooter
        type="button"
        [class]="controlClass"
        [disabled]="review.planSaving()"
        (click)="dialogRef.close()"
      >
        Cancel
      </button>
      <button windowFooter type="button" [class]="solidClass" [disabled]="review.planSaving()" (click)="save()">
        @if (review.planSaving()) {
          <mas-spinner />
        }
        Save plan
      </button>
    </mas-window-frame>
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
  readonly controlClass = CONTROL;
  readonly controlSmClass = CONTROL_SM;
  readonly solidClass = CONTROL_SOLID;
  readonly solidSmClass = CONTROL_SOLID_SM;
  readonly iconControlClass = ICON_CONTROL;
  readonly smallIconControlClass = SMALL_ICON_CONTROL;
  readonly iconTileClass = ICON_TILE;
  readonly fieldClass = FIELD;
  readonly labelClass = LABEL;
  readonly rowClass = ROW;
  readonly segmentClass = SEGMENT;
  readonly starButtonClass = STAR_BUTTON;
  readonly starOnClass = 'border-brand/55 bg-brand-soft/70 text-brand-strong';
  readonly starOffClass = 'border-brand/25 text-ink-muted hover:border-brand/70 hover:text-ink';
  readonly selectClass =
    'min-h-9 rounded-lg border border-brand/25 bg-surface-raised/70 px-2 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand';
  readonly stepClass =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-ink transition-colors hover:border-brand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40';
  readonly chipOnClass = 'border-brand bg-surface-raised text-brand-strong ring-1 ring-inset ring-brand';
  readonly chipOffClass = 'border-brand/25 bg-surface-raised/70 text-ink-muted hover:border-brand/70 hover:text-ink';

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
        this.snackBar.open('Monthly plan saved');
        this.dialogRef.close();
      },
    });
  }
}
