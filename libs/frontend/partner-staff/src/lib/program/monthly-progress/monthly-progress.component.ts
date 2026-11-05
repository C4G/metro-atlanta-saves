import { CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LoaderComponent,
  ReceiptPreviewComponent,
  SectionPanelComponent,
  SpinnerComponent,
} from '@mas/frontend-shared-components';
import { MonthTaskStatus, RosterStatus, TaskReviewStore } from '@mas/frontend-shared-data-access';
import {
  AVATAR,
  AVATAR_SM,
  CONTROL,
  CONTROL_PRIMARY,
  CONTROL_SM,
  ICON_CONTROL,
  ICON_TILE,
  PILLS,
  ROW,
  SEGMENT,
  SEGMENT_BUTTON,
} from '../ui/staff-ui';
import { openMonthlyPlan } from './monthly-plan-dialog.component';

export const ROSTER_PILLS: Record<RosterStatus, string> = {
  review: PILLS.brand,
  done: PILLS.soft,
  open: PILLS.warn,
  upcoming: PILLS.muted,
};

export const taskStatusLabel = (task: MonthTaskStatus) =>
  task.isLegacy
    ? 'Complete in an older program record'
    : !task.isComplete
      ? 'Not complete yet'
      : task.isStaffCompleted
        ? 'Marked done by staff'
        : 'Completed by participant';

const CELL =
  'relative flex min-h-10 w-full min-w-14 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

@Component({
  selector: 'mas-monthly-progress',
  imports: [
    CurrencyPipe,
    LoaderComponent,
    MatIcon,
    NgTemplateOutlet,
    RouterLink,
    SectionPanelComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #viewTools>
      <div class="flex flex-wrap items-center justify-end gap-2 max-sm:w-full">
        <div role="group" aria-label="View" [class]="segmentClass + ' max-sm:w-full'">
          <button
            type="button"
            [class]="segmentButtonClass + ' max-sm:flex-1'"
            [attr.aria-pressed]="store.view() === 'month'"
            (click)="store.setView('month')"
          >
            Month
          </button>
          <button
            type="button"
            [class]="segmentButtonClass + ' max-sm:flex-1'"
            [attr.aria-pressed]="store.view() === 'grid'"
            (click)="store.setView('grid')"
          >
            All months grid
          </button>
        </div>
        <button type="button" [class]="primaryClass + ' max-sm:w-full'" (click)="openPlan()">
          <mat-icon class="mas-icon-sm" aria-hidden="true">edit_calendar</mat-icon>
          Edit monthly plan
        </button>
      </div>
    </ng-template>

    @if (!store.data() && !store.loadFailed()) {
      <mas-loader label="Loading tasks review" />
    } @else if (store.loadFailed()) {
      <div role="alert" class="rounded-2xl border border-outline/65 bg-surface/60 p-6">
        <p class="text-sm text-ink-muted">We could not load tasks review.</p>
        <button type="button" [class]="controlClass + ' mt-3'" (click)="store.load(id())">Try again</button>
      </div>
    } @else if (!store.months().length) {
      <div class="rounded-2xl border border-dashed border-outline bg-surface/60 px-6 py-12 text-center">
        <span [class]="iconTileClass + ' mx-auto'" aria-hidden="true">
          <mat-icon class="mas-icon-md">calendar_month</mat-icon>
        </span>
        <h2 class="mt-3 text-lg font-bold">This program has no months yet</h2>
        <p class="mt-1 text-sm text-ink-muted">Choose how many months it runs, then assign tasks to each month.</p>
        <button type="button" [class]="primaryClass + ' mt-4'" (click)="openPlan()">Set up months</button>
      </div>
    } @else {
      @if (store.saveError()) {
        <p role="alert" class="mb-4 text-sm leading-6 text-danger">{{ store.saveError() }}</p>
      }
      @if (store.view() === 'grid') {
        <mas-section-panel [heading]="'All ' + store.months().length + ' months'" headingId="all-months-heading">
          <ng-container panelActions *ngTemplateOutlet="viewTools" />
          @if (store.programGrid().length) {
            <div class="overflow-x-auto">
              <table class="w-full border-separate border-spacing-0 text-sm">
                <caption class="sr-only">Task completion for every participant in every month</caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      class="sticky left-0 z-10 border-b border-outline/55 bg-surface py-2.5 pl-4 pr-2 text-left text-xs font-bold text-ink-muted sm:static sm:bg-transparent sm:pl-5"
                    >
                      Participant
                    </th>
                    @for (month of store.monthSummaries(); track month.number) {
                      <th
                        scope="col"
                        class="whitespace-nowrap border-b border-outline/55 px-1 py-2.5 text-center text-xs font-bold"
                        [class]="
                          month.state === 'now' ? 'rounded-t-xl bg-brand-soft/45 text-brand-strong' : 'text-ink-muted'
                        "
                        [attr.aria-current]="month.state === 'now' ? 'date' : null"
                      >
                        <abbr [title]="month.name" class="no-underline">M{{ month.number }}</abbr>
                        <span
                          class="block text-xs leading-4"
                          [class]="month.awaitingReview ? 'font-bold text-brand-strong' : 'font-normal text-ink-muted'"
                        >
                          {{
                            month.awaitingReview
                              ? month.awaitingReview + ' to review'
                              : month.state === 'upcoming'
                                ? 'Upcoming'
                                : 'Nothing to review'
                          }}
                        </span>
                      </th>
                    }
                    <th
                      scope="col"
                      class="border-b border-outline/55 py-2.5 pl-2 pr-4 text-right text-xs font-bold text-ink-muted sm:pr-5"
                    >
                      Overall
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of store.programGrid(); track row.id) {
                    <tr class="group">
                      <th
                        scope="row"
                        class="sticky left-0 z-10 border-b border-outline/35 bg-surface py-1 pl-4 pr-2 text-left font-bold group-last:border-b-0 sm:static sm:bg-transparent sm:pl-5"
                      >
                        <span class="flex min-w-32 items-center gap-2.5 whitespace-nowrap sm:min-w-36">
                          <span [class]="avatarSmClass" aria-hidden="true">{{ row.initials }}</span>
                          {{ row.name }}
                        </span>
                      </th>
                      @for (cell of row.cells; track cell.month) {
                        @let allDone = cell.tasks.length > 0 && cell.completeCount === cell.tasks.length;
                        <td
                          class="border-b border-outline/35 p-1 group-last:border-b-0"
                          [class]="cell.month === store.currentMonth() ? 'bg-brand-soft/25' : ''"
                        >
                          @if (cell.isUpcoming && !cell.completeCount) {
                            <span
                              [class]="cellClass + ' border-dashed border-outline text-ink-subtle'"
                              [attr.aria-label]="row.name + ', Month ' + cell.month + ', not open yet'"
                            >
                              —
                            </span>
                          } @else {
                            <button
                              type="button"
                              [class]="
                                cellClass +
                                (allDone
                                  ? ' border-transparent bg-brand-soft/80 text-brand-strong hover:border-brand'
                                  : ' border-warn-ink/40 bg-warn-soft text-warn-ink hover:border-warn-ink')
                              "
                              [attr.aria-label]="
                                row.name +
                                ', Month ' +
                                cell.month +
                                ': ' +
                                cell.completeCount +
                                ' of ' +
                                cell.tasks.length +
                                ' tasks complete, ' +
                                cell.awaitingReview +
                                ' waiting for review. Open this month'
                              "
                              (click)="store.openMonth(row.id, cell.month)"
                            >
                              {{ cell.completeCount }}/{{ cell.tasks.length }}
                              @if (cell.awaitingReview) {
                                <span
                                  class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-brand-strong px-1 text-xs font-bold text-brand-on"
                                  aria-hidden="true"
                                >
                                  {{ cell.awaitingReview }}
                                </span>
                              }
                            </button>
                          }
                        </td>
                      }
                      <td class="border-b border-outline/35 py-1 pl-2 pr-4 text-right group-last:border-b-0 sm:pr-5">
                        <span class="block font-bold tabular-nums">{{ row.percentComplete }}%</span>
                        <span
                          class="block whitespace-nowrap text-xs font-bold"
                          [class]="row.openMonths ? 'text-warn-ink' : 'text-brand-strong'"
                        >
                          {{
                            row.openMonths
                              ? row.openMonths + (row.openMonths === 1 ? ' month open' : ' months open')
                              : 'On track'
                          }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <ul
              class="flex flex-wrap gap-x-4 gap-y-2 border-t border-outline/55 px-4 pb-4 pt-3 text-xs text-ink-muted sm:px-5"
            >
              <li class="flex items-center gap-1.5">
                <span class="h-3.5 w-3.5 rounded bg-brand-soft/80" aria-hidden="true"></span>
                All tasks done
              </li>
              <li class="flex items-center gap-1.5">
                <span class="h-3.5 w-3.5 rounded border border-warn-ink/40 bg-warn-soft" aria-hidden="true"></span>
                In progress
              </li>
              <li class="flex items-center gap-1.5">
                <span class="h-3.5 w-3.5 rounded border border-dashed border-outline" aria-hidden="true"></span>
                Not open yet
              </li>
              <li class="flex items-center gap-1.5">
                <span class="h-3 w-3 rounded-full bg-brand-strong" aria-hidden="true"></span>
                Waiting for your review
              </li>
            </ul>
          } @else {
            <p class="px-6 py-12 text-center text-sm text-ink-muted">
              Participants will appear here once they join this program.
            </p>
          }
        </mas-section-panel>
      } @else {
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          @if (store.focusedSummary(); as month) {
            <section
              class="min-w-0 overflow-hidden rounded-2xl border border-outline/65 bg-surface/60"
              aria-labelledby="focused-month-heading"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-outline/55 px-4 py-4 sm:px-5"
              >
                <div class="flex items-center gap-2.5">
                  <h2 id="focused-month-heading" class="text-base font-bold">{{ month.name }}</h2>
                  @if (month.state === 'now') {
                    <span [class]="pills.soft">This month</span>
                  }
                </div>
                <ng-container *ngTemplateOutlet="viewTools" />
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
                <div role="group" aria-label="Filter participants" [class]="segmentClass + ' max-sm:w-full'">
                  @for (filter of store.rosterFilters(); track filter.value) {
                    <button
                      type="button"
                      [class]="segmentButtonClass + (filter.value === 'open' ? ' max-sm:hidden' : ' max-sm:flex-1')"
                      [attr.aria-pressed]="store.rosterFilter() === filter.value"
                      (click)="store.setRosterFilter(filter.value)"
                    >
                      {{ filter.label }}
                      <span class="font-normal tabular-nums opacity-80">{{ filter.count }}</span>
                    </button>
                  }
                </div>
                <div class="flex gap-2 max-sm:order-first max-sm:w-full">
                  <button
                    type="button"
                    [class]="iconControlClass"
                    aria-label="Previous month"
                    [disabled]="store.isFirstMonth()"
                    (click)="store.stepMonth(-1)"
                  >
                    <mat-icon class="mas-icon-md" aria-hidden="true">chevron_left</mat-icon>
                  </button>
                  <button
                    type="button"
                    [class]="controlClass + ' max-sm:flex-1'"
                    [disabled]="month.state === 'now'"
                    (click)="store.focusOn(null)"
                  >
                    <mat-icon class="mas-icon-sm" aria-hidden="true">today</mat-icon>
                    This month
                  </button>
                  <button
                    type="button"
                    [class]="iconControlClass"
                    aria-label="Next month"
                    [disabled]="store.isLastMonth()"
                    (click)="store.stepMonth(1)"
                  >
                    <mat-icon class="mas-icon-md" aria-hidden="true">chevron_right</mat-icon>
                  </button>
                </div>
              </div>
              <ul class="flex flex-col gap-2 p-3 sm:p-4" aria-label="Participants this month">
                @for (person of store.filteredRoster(); track person.id) {
                  @let selected = store.selectedMonth()?.id === person.id;
                  <li>
                    <button
                      type="button"
                      class="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl border p-2 text-left transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:grid-cols-[2.5rem_minmax(0,1fr)_11rem_6.5rem_auto] sm:pr-3"
                      [class]="selected ? selectedRowClass : rowClass"
                      [attr.aria-pressed]="selected"
                      (click)="select(person.id)"
                    >
                      <span [class]="avatarClass" aria-hidden="true">{{ person.initials }}</span>
                      <span class="truncate text-sm font-bold">{{ person.name }}</span>
                      <span
                        class="col-span-2 col-start-2 row-start-2 flex items-center gap-2.5 sm:col-span-1 sm:col-start-auto sm:row-start-auto"
                      >
                        <span
                          class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10"
                          role="progressbar"
                          aria-valuemin="0"
                          aria-valuemax="100"
                          [attr.aria-valuenow]="person.percentComplete"
                          [attr.aria-label]="person.name + ' task progress'"
                        >
                          <span
                            class="block h-full rounded-full bg-brand"
                            [style.width.%]="person.percentComplete"
                          ></span>
                        </span>
                        <span class="min-w-8 text-right text-xs font-bold tabular-nums text-ink-muted">
                          {{ person.completeCount }}/{{ person.tasks.length }}
                        </span>
                      </span>
                      <span class="hidden text-xs text-ink-muted sm:block">
                        {{ person.documents.length }} {{ person.documents.length === 1 ? 'document' : 'documents' }}
                      </span>
                      <span
                        class="col-start-3 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto"
                        [class]="rosterPills[person.status]"
                      >
                        {{ person.statusLabel }}
                      </span>
                    </button>
                  </li>
                } @empty {
                  <li class="px-6 py-10 text-center text-sm text-ink-muted">
                    {{
                      store.roster().length
                        ? 'Nobody matches this filter.'
                        : 'Participants will appear here once they join this program.'
                    }}
                  </li>
                }
              </ul>
            </section>
          }

          @if (store.selectedMonth(); as detail) {
            <section
              [id]="detailId"
              class="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-outline/65 bg-surface/60"
              aria-labelledby="selected-month-heading"
            >
              <div class="flex items-center gap-3 border-b border-outline/55 px-4 py-4 sm:px-5">
                <span [class]="avatarClass" aria-hidden="true">{{ detail.initials }}</span>
                <div class="min-w-0">
                  <h2 id="selected-month-heading" class="truncate text-base font-bold">{{ detail.name }}</h2>
                  <p class="text-xs text-ink-muted">Month {{ detail.month }}</p>
                </div>
              </div>
              <div class="flex flex-col gap-4 p-4 sm:p-5">
                <div class="flex flex-col gap-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-sm font-bold">Tasks</h3>
                    <button
                      type="button"
                      [class]="controlSmClass"
                      [disabled]="!detail.unreviewedCount"
                      (click)="reviewAll(detail.id, detail.tasks)"
                    >
                      Mark all reviewed
                    </button>
                  </div>
                  @for (task of detail.tasks; track task.requirementId) {
                    @let saving = store.pending().includes(detail.id + ':' + task.requirementId);
                    <article [class]="rowClass + ' overflow-hidden'">
                      <button
                        type="button"
                        role="checkbox"
                        class="flex w-full items-start gap-3 px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-wait"
                        [attr.aria-checked]="task.isComplete"
                        [attr.aria-label]="
                          (task.isComplete ? 'Mark not done: ' : 'Mark done: ') + task.name + ' for ' + detail.name
                        "
                        [disabled]="saving"
                        (click)="toggleDone(detail.id, task)"
                      >
                        <span
                          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2"
                          [class]="task.isComplete ? 'border-brand bg-brand text-brand-on' : 'border-ink-muted/60'"
                          aria-hidden="true"
                        >
                          @if (task.isComplete) {
                            <mat-icon class="!h-4 !w-4 !text-base !leading-none">check</mat-icon>
                          }
                        </span>
                        <span class="min-w-0">
                          <span class="block text-sm font-bold leading-5">{{ task.name }}</span>
                          <span
                            class="mt-1 flex items-center gap-2 text-xs"
                            [class]="task.isComplete ? 'text-brand-strong' : 'text-ink-muted'"
                          >
                            <span
                              class="h-3 w-3 rounded-full border-2"
                              [class]="task.isComplete ? 'border-brand bg-brand' : 'border-ink-muted/45'"
                              aria-hidden="true"
                            ></span>
                            {{ statusLabel(task) }}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        class="flex min-h-10 w-full items-center justify-between gap-3 border-t border-outline/55 px-3.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand disabled:cursor-wait"
                        [class]="task.isReviewed ? 'text-brand-strong' : 'text-ink-muted hover:text-ink'"
                        [attr.aria-pressed]="task.isReviewed"
                        [attr.aria-label]="'Reviewed: ' + task.name + ' for ' + detail.name"
                        [disabled]="saving"
                        (click)="toggleReview(detail.id, task)"
                      >
                        <span class="flex items-center gap-1.5">
                          <mat-icon class="mas-icon-sm" aria-hidden="true">
                            {{ task.isReviewed ? 'verified' : 'verified_user' }}
                          </mat-icon>
                          {{ task.isReviewed ? 'Reviewed' : 'Mark reviewed' }}
                        </span>
                        @if (saving) {
                          <mas-spinner />
                        } @else {
                          <span
                            class="flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded border-2"
                            [class]="task.isReviewed ? 'border-brand bg-brand text-brand-on' : 'border-ink-muted/55'"
                            aria-hidden="true"
                          >
                            @if (task.isReviewed) {
                              <mat-icon class="!h-3.5 !w-3.5 !text-sm !leading-none">check</mat-icon>
                            }
                          </span>
                        }
                      </button>
                    </article>
                  } @empty {
                    <p class="rounded-xl border border-dashed border-outline p-5 text-center text-sm text-ink-muted">
                      No tasks are assigned to Month {{ detail.month }}.
                    </p>
                  }
                  <p class="flex items-start gap-1.5 text-xs leading-4 text-ink-muted">
                    <mat-icon class="mas-icon-sm shrink-0" aria-hidden="true">visibility_off</mat-icon>
                    Reviews are for staff only. Participants never see them.
                  </p>
                </div>

                <div class="border-t border-outline/55"></div>

                <div class="flex flex-col gap-2.5">
                  <h3 class="text-sm font-bold">Monthly update</h3>
                  <dl class="grid grid-cols-2 gap-2">
                    <div class="rounded-xl border border-dashed border-brand/30 p-3">
                      <dt class="text-xs text-ink-muted">Amount saved</dt>
                      <dd class="mt-1 text-lg font-bold tabular-nums">
                        {{
                          detail.checkpoint?.savedMoney === null || detail.checkpoint?.savedMoney === undefined
                            ? '—'
                            : (detail.checkpoint?.savedMoney | currency)
                        }}
                      </dd>
                    </div>
                    <div class="rounded-xl border border-dashed border-brand/30 p-3">
                      <dt class="text-xs text-ink-muted">Credit score</dt>
                      <dd class="mt-1 text-lg font-bold tabular-nums">{{ detail.checkpoint?.creditScore ?? '—' }}</dd>
                    </div>
                  </dl>
                  @if (detail.checkpoint?.application; as notes) {
                    <p
                      class="whitespace-pre-line rounded-xl border border-outline/55 p-3 text-sm leading-6 text-ink-muted"
                    >
                      {{ notes }}
                    </p>
                  }
                </div>

                <div class="border-t border-outline/55"></div>

                <div class="flex flex-col gap-2.5">
                  @let uploading = store.uploading() === detail.id + ':' + detail.month;
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-sm font-bold">Documents</h3>
                    <label
                      [class]="controlSmClass + ' cursor-pointer focus-within:ring-2 focus-within:ring-brand'"
                      [class.pointer-events-none]="uploading"
                      [class.opacity-60]="uploading"
                    >
                      @if (uploading) {
                        <mas-spinner />
                        <span class="sr-only">Uploading receipt</span>
                      } @else {
                        <mat-icon class="mas-icon-sm" aria-hidden="true">upload</mat-icon>
                      }
                      Upload receipt
                      <input
                        #receipts
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        class="sr-only"
                        [disabled]="uploading"
                        [attr.aria-label]="'Upload receipts for ' + detail.name + ', Month ' + detail.month"
                        (change)="uploadReceipts(detail.id, detail.month, receipts)"
                      />
                    </label>
                  </div>
                  @if (store.uploadError()) {
                    <p role="alert" class="text-xs text-danger">{{ store.uploadError() }}</p>
                  }
                  @if (detail.documents.length) {
                    <ul class="flex flex-col gap-2">
                      @for (document of detail.documents; track document.id) {
                        <li [class]="rowClass + ' flex items-center gap-3 p-2'">
                          <span [class]="iconTileClass" aria-hidden="true">
                            <mat-icon class="mas-icon-sm">
                              {{ document.type.includes('pdf') ? 'picture_as_pdf' : 'receipt_long' }}
                            </mat-icon>
                          </span>
                          <span class="min-w-0 flex-1 truncate text-sm font-bold" [title]="document.name">
                            {{ document.name }}
                          </span>
                          <button
                            type="button"
                            [class]="controlSmClass"
                            [attr.aria-label]="'View ' + document.name"
                            (click)="viewDocument(document.id, document.name)"
                          >
                            View
                          </button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="rounded-xl border border-dashed border-outline p-4 text-center text-sm text-ink-muted">
                      No documents uploaded for this month.
                    </p>
                  }
                </div>

                <a
                  [routerLink]="['/partner-staff/programs', id(), 'users', detail.id]"
                  class="inline-flex min-h-10 items-center gap-1 self-start rounded-lg text-sm font-bold text-brand-strong hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Open participant record
                  <mat-icon class="mas-icon-sm" aria-hidden="true">arrow_forward</mat-icon>
                </a>
                <button
                  type="button"
                  [class]="primaryClass + ' w-full'"
                  [disabled]="!store.nextToReview()"
                  (click)="nextToReview()"
                >
                  {{ store.nextToReview() ? 'Next participant to review' : 'Nobody else to review this month' }}
                </button>
              </div>
            </section>
          }
        </div>
      }
    }
  `,
  host: { class: 'block' },
})
export default class MonthlyProgressComponent {
  readonly id = input.required<string>();
  readonly store = inject(TaskReviewStore);
  readonly rosterPills = ROSTER_PILLS;
  readonly pills = PILLS;
  readonly statusLabel = taskStatusLabel;
  readonly segmentClass = SEGMENT;
  readonly segmentButtonClass = SEGMENT_BUTTON;
  readonly controlClass = CONTROL;
  readonly controlSmClass = CONTROL_SM;
  readonly primaryClass = CONTROL_PRIMARY;
  readonly iconControlClass = ICON_CONTROL;
  readonly iconTileClass = ICON_TILE;
  readonly avatarClass = AVATAR;
  readonly avatarSmClass = AVATAR_SM;
  readonly cellClass = CELL;
  readonly rowClass = ROW;
  readonly selectedRowClass = 'border-brand bg-surface-raised ring-1 ring-inset ring-brand';
  readonly detailId = 'participant-month';
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  private openedFragment: string | null = null;

  readonly fragmentEffect = effect(() => {
    const fragment = this.fragment() ?? null;
    if (!fragment || fragment === this.openedFragment) return;
    const month = this.store.data()?.requirements.find(({ id }) => id === fragment)?.month;
    if (!month) return;
    this.openedFragment = fragment;
    untracked(() => {
      this.store.setView('month');
      this.store.focusOn(month);
    });
  });


  select(userId: string): void {
    this.store.select(userId);
    this.revealDetail();
  }

  nextToReview(): void {
    this.store.selectNextToReview();
    this.revealDetail();
  }

  toggleDone(userId: string, task: MonthTaskStatus): void {
    this.store.setCompletion({ userId, requirementId: task.requirementId, complete: !task.isComplete });
  }

  toggleReview(userId: string, task: MonthTaskStatus): void {
    this.store.verify({
      userId,
      requirementId: task.requirementId,
      completedAt: task.completion ? new Date(task.completion.completedAt).toISOString() : undefined,
      verified: !task.isReviewed,
    });
  }

  reviewAll(userId: string, tasks: MonthTaskStatus[]): void {
    for (const task of tasks) {
      if (task.isReviewed) continue;
      this.store.verify({
        userId,
        requirementId: task.requirementId,
        completedAt: task.completion ? new Date(task.completion.completedAt).toISOString() : undefined,
        verified: true,
      });
    }
  }

  viewDocument(id: string, name: string): void {
    this.dialog.open(ReceiptPreviewComponent, {
      data: { id, name },
      width: '60rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaLabelledBy: 'receipt-preview-heading',
    });
  }

  uploadReceipts(userId: string, month: number, input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.store.uploadReceipts({ userId, month, files });
  }

  openPlan(): void {
    openMonthlyPlan(this.dialog, this.injector, this.store.focusedMonth());
  }

  private revealDetail(): void {
    if (typeof window === 'undefined' || !window.matchMedia?.('(max-width: 1023px)').matches) return;
    requestAnimationFrame(() =>
      document.getElementById(this.detailId)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      }),
    );
  }
}
