import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReceiptPreviewComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { MonthTaskStatus, RosterStatus, TaskReviewStore } from '@mas/frontend-shared-data-access';
import { openMonthlyPlan } from './monthly-plan-dialog.component';

const STATUS_CLASSES: Record<RosterStatus, string> = {
  review: 'border-review/40 bg-review-soft text-review-ink',
  done: 'border-brand/40 text-brand-strong',
  open: 'border-warn-ink/30 bg-warn-soft text-warn-ink',
  upcoming: 'border-outline bg-surface-subtle text-ink-muted',
};

@Component({
  selector: 'mas-monthly-progress',
  imports: [SpinnerComponent, CurrencyPipe, MatIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="monthly-progress-heading" class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="monthly-progress-heading" class="text-2xl font-semibold tracking-tight">Tasks review</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (store.data() && store.months().length) {
            <div role="group" aria-label="View" class="flex gap-1 rounded-xl bg-surface-subtle p-1">
              <button
                type="button"
                (click)="store.setView('month')"
                [attr.aria-pressed]="store.view() === 'month'"
                class="min-h-9 rounded-lg px-3.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                [class.bg-surface-raised]="store.view() === 'month'"
                [class.text-brand-strong]="store.view() === 'month'"
                [class.text-ink-muted]="store.view() !== 'month'"
              >
                Month
              </button>
              <button
                type="button"
                (click)="store.setView('grid')"
                [attr.aria-pressed]="store.view() === 'grid'"
                class="min-h-9 rounded-lg px-3.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                [class.bg-surface-raised]="store.view() === 'grid'"
                [class.text-brand-strong]="store.view() === 'grid'"
                [class.text-ink-muted]="store.view() !== 'grid'"
              >
                All months grid
              </button>
            </div>
          }
          <button
            type="button"
            (click)="openPlan()"
            [disabled]="!store.data()"
            class="min-h-11 rounded-xl border border-brand-strong bg-brand-strong px-4 text-sm font-bold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-canvas disabled:opacity-50"
          >
            Edit monthly plan
          </button>
        </div>
      </header>

      @if (!store.data() && !store.loadFailed()) {
        <div role="status" class="space-y-5">
          <span class="sr-only">Loading monthly progress</span>
          <div
            aria-hidden="true"
            class="flex animate-pulse items-center justify-between gap-4 rounded-2xl border border-outline bg-surface-raised px-5 py-4 motion-reduce:animate-none"
          >
            <span class="h-6 w-28 rounded-md bg-outline/50"></span>
            <span class="flex gap-2">
              <span class="h-11 w-11 rounded-xl bg-outline/50"></span>
              <span class="h-11 w-36 rounded-xl bg-outline/50"></span>
              <span class="h-11 w-11 rounded-xl bg-outline/50"></span>
            </span>
          </div>
          <div aria-hidden="true" class="flex flex-wrap items-start gap-5">
            <div
              class="min-w-0 flex-[999_1_36rem] animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none"
            >
              <div class="flex gap-2 border-b border-outline p-4">
                @for (filter of [1, 2, 3, 4]; track filter) {
                  <span class="h-10 w-28 rounded-xl bg-outline/50"></span>
                }
              </div>
              <div class="space-y-1 p-2.5">
                @for (row of skeletonRows; track row) {
                  <div class="flex items-center gap-4 px-3.5 py-3">
                    <span class="h-9 w-9 shrink-0 rounded-full bg-outline/50"></span>
                    <span class="h-4 flex-1 rounded-md bg-outline/50"></span>
                    <span class="h-4 w-16 rounded-md bg-outline/50"></span>
                    <span class="h-7 w-24 rounded-lg bg-outline/50"></span>
                  </div>
                }
              </div>
            </div>
            <div
              class="min-w-0 flex-[1_1_22rem] animate-pulse space-y-4 rounded-2xl border border-outline bg-surface-raised p-5 motion-reduce:animate-none"
            >
              <span class="block h-5 w-1/2 rounded-md bg-outline/50"></span>
              @for (task of [1, 2, 3]; track task) {
                <span class="block h-14 rounded-xl bg-outline/50"></span>
              }
              <span class="block h-24 rounded-xl bg-outline/50"></span>
            </div>
          </div>
        </div>
      } @else if (store.loadFailed()) {
        <div role="alert" class="rounded-2xl border border-outline bg-surface-raised p-6">
          <p class="text-sm text-danger">We could not load monthly progress.</p>
          <button
            type="button"
            (click)="store.load(id())"
            class="mt-3 min-h-11 rounded-xl px-4 text-sm font-bold text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else if (store.data() && !store.months().length) {
        <div class="rounded-2xl border border-dashed border-outline bg-surface-raised px-6 py-12 text-center">
          <mat-icon class="text-brand-strong" aria-hidden="true">calendar_month</mat-icon>
          <h3 class="mt-3 text-lg font-bold">This program has no months yet</h3>
          <p class="mt-1 text-sm text-ink-muted">Choose how many months it runs, then assign tasks to each month.</p>
          <button
            type="button"
            (click)="openPlan()"
            class="mt-4 min-h-11 rounded-xl border border-brand px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Set up months
          </button>
        </div>
      } @else if (store.data()) {
        @if (store.saveError()) {
          <p role="alert" class="text-sm leading-6 text-danger">{{ store.saveError() }}</p>
        }
        @if (store.view() === 'grid') {
          <section
            aria-labelledby="all-months-heading"
            class="overflow-x-auto rounded-2xl border border-outline bg-surface-raised"
          >
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline px-5 py-4">
              <div>
                <h3 id="all-months-heading" class="text-base font-bold">All {{ store.months().length }} months</h3>
                <p class="mt-0.5 text-sm text-ink-muted">
                  Spot who is falling behind across the program. Select a cell to open that month.
                </p>
              </div>
              <p
                class="inline-flex min-h-9 items-center gap-2 rounded-xl bg-review-soft px-3 text-sm font-bold text-review-ink"
              >
                <mat-icon aria-hidden="true" class="!h-4 !w-4 shrink-0 !text-base !leading-none">
                  verified_user
                </mat-icon>
                {{ store.awaitingReviewTotal() }} {{ store.awaitingReviewTotal() === 1 ? 'task' : 'tasks' }} waiting for
                review
              </p>
            </div>
            @if (store.programGrid().length) {
              <table class="w-full min-w-[56rem] border-collapse text-left">
                <caption class="sr-only">Task completion for every participant in every month</caption>
                <thead>
                  <tr class="border-b border-outline">
                    <th scope="col" class="px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">
                      Participant
                    </th>
                    @for (month of store.monthSummaries(); track month.number) {
                      <th scope="col" class="p-1 text-center">
                        <span
                          class="block rounded-xl px-1 py-2"
                          [class.bg-brand-soft]="month.state === 'now'"
                          [attr.aria-current]="month.state === 'now' ? 'date' : null"
                        >
                          <abbr
                            [title]="month.name"
                            class="block text-xs font-bold uppercase tracking-[0.08em] no-underline"
                            [class.text-brand-strong]="month.state === 'now'"
                            [class.text-ink-subtle]="month.state !== 'now'"
                          >
                            M{{ month.number }}
                          </abbr>
                          <span
                            class="mt-0.5 block text-[0.6875rem] font-bold"
                            [class.text-review-ink]="month.awaitingReview > 0"
                            [class.text-ink-muted]="month.awaitingReview === 0"
                          >
                            {{
                              month.awaitingReview
                                ? month.awaitingReview + ' to review'
                                : month.state === 'upcoming'
                                  ? 'Upcoming'
                                  : 'Nothing to review'
                            }}
                          </span>
                        </span>
                      </th>
                    }
                    <th
                      scope="col"
                      class="px-5 py-3 text-right text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle"
                    >
                      Overall
                    </th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of store.programGrid(); track row.id) {
                    <tr class="border-b border-outline last:border-b-0">
                      <th scope="row" class="px-5 py-1.5 font-normal">
                        <span class="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong"
                          >
                            {{ row.initials }}
                          </span>
                          <span class="min-w-0 truncate text-sm font-bold">{{ row.name }}</span>
                        </span>
                      </th>
                      @for (cell of row.cells; track cell.month) {
                        @let allDone = cell.tasks.length > 0 && cell.completeCount === cell.tasks.length;
                        @let idle = cell.isUpcoming && !cell.completeCount;
                        <td class="p-1">
                          <button
                            type="button"
                            (click)="store.openMonth(row.id, cell.month)"
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
                            class="relative flex min-h-11 w-full items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-colors hover:border-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                            [class.border-transparent]="!idle"
                            [class.border-dashed]="idle"
                            [class.border-outline]="idle"
                            [class.bg-brand-strong]="allDone && !idle"
                            [class.text-brand-on]="allDone && !idle"
                            [class.bg-warn-soft]="!allDone && !idle"
                            [class.text-warn-ink]="!allDone && !idle"
                            [class.text-ink-subtle]="idle"
                          >
                            @if (cell.awaitingReview) {
                              <span
                                aria-hidden="true"
                                class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface-raised bg-review px-1 text-[0.625rem] font-bold text-review-on"
                              >
                                {{ cell.awaitingReview }}
                              </span>
                            }
                            {{ idle ? '—' : cell.completeCount + '/' + cell.tasks.length }}
                          </button>
                        </td>
                      }
                      <td class="px-5 py-1.5 text-right">
                        <span class="block text-sm font-bold tabular-nums">{{ row.percentComplete }}%</span>
                        <span
                          class="block text-[0.6875rem] font-bold"
                          [class.text-warn-ink]="row.openMonths > 0"
                          [class.text-brand-strong]="row.openMonths === 0"
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
              <ul class="flex flex-wrap gap-x-5 gap-y-2 border-t border-outline px-5 py-4 text-xs text-ink-muted">
                <li class="flex items-center gap-2">
                  <span aria-hidden="true" class="h-3.5 w-3.5 rounded bg-brand-strong"></span>
                  All tasks done
                </li>
                <li class="flex items-center gap-2">
                  <span aria-hidden="true" class="h-3.5 w-3.5 rounded border border-warn-ink bg-warn-soft"></span>
                  In progress
                </li>
                <li class="flex items-center gap-2">
                  <span aria-hidden="true" class="h-3.5 w-3.5 rounded border border-dashed border-outline"></span>
                  Not open yet
                </li>
                <li class="flex items-center gap-2">
                  <span aria-hidden="true" class="h-3.5 w-3.5 rounded-full bg-review"></span>
                  Waiting for your review
                </li>
              </ul>
            } @else {
              <p class="px-6 py-12 text-center text-sm text-ink-muted">
                Participants will appear here once they join this program.
              </p>
            }
          </section>
        } @else {
          @if (store.focusedSummary(); as month) {
            <section
              aria-labelledby="focused-month-heading"
              class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline bg-surface-raised px-5 py-4"
            >
              <h3 id="focused-month-heading" class="text-xl font-bold">{{ month.name }}</h3>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="store.stepMonth(-1)"
                  [disabled]="store.isFirstMonth()"
                  aria-label="Previous month"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true">chevron_left</mat-icon>
                </button>
                <button
                  type="button"
                  (click)="store.focusOn(null)"
                  [disabled]="month.state === 'now'"
                  class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:text-ink-muted disabled:opacity-60 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true" class="!h-5 !w-5 shrink-0 !text-xl !leading-none">today</mat-icon>
                  Current month
                </button>
                <button
                  type="button"
                  (click)="store.stepMonth(1)"
                  [disabled]="store.isLastMonth()"
                  aria-label="Next month"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-outline bg-surface text-ink hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-surface"
                >
                  <mat-icon aria-hidden="true">chevron_right</mat-icon>
                </button>
              </div>
            </section>
          }

          <div class="flex flex-wrap items-start gap-5">
            <section
              aria-label="Participants this month"
              class="min-w-0 flex-[999_1_36rem] rounded-2xl border border-outline bg-surface-raised"
            >
              <div
                role="group"
                aria-label="Filter participants"
                class="flex flex-wrap gap-2 border-b border-outline p-4"
              >
                @for (filter of store.rosterFilters(); track filter.value) {
                  <button
                    type="button"
                    (click)="store.setRosterFilter(filter.value)"
                    [attr.aria-pressed]="store.rosterFilter() === filter.value"
                    class="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold hover:bg-brand-soft/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    [class.border-brand]="store.rosterFilter() === filter.value"
                    [class.bg-brand-soft]="store.rosterFilter() === filter.value"
                    [class.text-brand-strong]="store.rosterFilter() === filter.value"
                    [class.border-outline]="store.rosterFilter() !== filter.value"
                  >
                    {{ filter.label }}
                    <span
                      aria-hidden="true"
                      class="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-outline bg-surface px-1.5 text-xs tabular-nums text-ink-muted"
                    >
                      {{ filter.count }}
                    </span>
                  </button>
                }
              </div>
              <ul class="p-2.5">
                @for (person of store.filteredRoster(); track person.id) {
                  @let selected = store.selectedMonth()?.id === person.id;
                  <li>
                    <button
                      type="button"
                      (click)="store.select(person.id)"
                      [attr.aria-pressed]="selected"
                      class="my-0.5 flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-3.5 py-3 text-left transition-colors hover:bg-brand-soft/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      [class.border-brand]="selected"
                      [class.bg-brand-soft]="selected"
                      [class.border-transparent]="!selected"
                    >
                      <span
                        aria-hidden="true"
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong"
                        [class.bg-surface-raised]="selected"
                      >
                        {{ person.initials }}
                      </span>
                      <span class="min-w-0 flex-[1_1_9rem] truncate text-sm font-bold">{{ person.name }}</span>
                      <span class="flex flex-[0_1_11rem] items-center gap-2.5">
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
                        <span class="min-w-9 text-xs font-bold tabular-nums text-ink-muted">
                          {{ person.completeCount }}/{{ person.tasks.length }}
                        </span>
                      </span>
                      <span class="min-w-24 text-xs text-ink-muted">
                        {{ person.documents.length }} {{ person.documents.length === 1 ? 'document' : 'documents' }}
                      </span>
                      <span
                        class="inline-flex min-h-8 min-w-28 items-center justify-center rounded-xl border px-3 text-xs font-bold"
                        [class]="statusClasses[person.status]"
                        [class.bg-brand-soft]="person.status === 'done' && !selected"
                        [class.bg-surface-raised]="person.status === 'done' && selected"
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

            @if (store.selectedMonth(); as detail) {
              <aside
                aria-labelledby="selected-month-heading"
                class="min-w-0 flex-[1_1_22rem] rounded-2xl border border-outline bg-surface-raised"
              >
                <div class="border-b border-outline p-5">
                  <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">
                    Month {{ detail.month }}
                  </p>
                  <h3 id="selected-month-heading" class="mt-1 text-xl font-bold">{{ detail.name }}</h3>
                </div>
                <div class="space-y-2.5 p-5">
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Tasks</h4>
                    <button
                      type="button"
                      (click)="reviewAll(detail.id, detail.tasks)"
                      [disabled]="!detail.awaitingReview"
                      class="min-h-9 rounded-xl border border-brand px-3 text-xs font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Mark all reviewed
                    </button>
                  </div>
                  @for (task of detail.tasks; track task.requirementId) {
                    @let saving = store.pending().includes(detail.id + ':' + task.requirementId);
                    <article
                      class="overflow-hidden rounded-2xl border bg-surface"
                      [class.border-review]="!!task.completion && !task.isReviewed"
                      [class.border-outline]="!task.completion || task.isReviewed"
                    >
                      <div class="px-4 pb-3 pt-3.5">
                        <h5 class="text-[0.9375rem] font-bold leading-snug">{{ task.name }}</h5>
                        <p
                          class="mt-1.5 flex items-center gap-2 text-sm"
                          [class.text-ink]="task.isComplete"
                          [class.text-ink-muted]="!task.isComplete"
                        >
                          <span
                            aria-hidden="true"
                            class="flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-full"
                            [class.bg-brand-strong]="task.isComplete"
                            [class.text-brand-on]="task.isComplete"
                            [class.bg-surface-subtle]="!task.isComplete"
                          >
                            @if (task.isComplete) {
                              <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M3.25 8.25 6.5 11.5l6.25-7"
                                  stroke="currentColor"
                                  stroke-width="2.25"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            }
                          </span>
                          {{
                            task.isLegacy
                              ? 'Complete in an older program record'
                              : task.isComplete
                                ? 'Marked complete by participant'
                                : 'Not complete yet'
                          }}
                        </p>
                      </div>
                      <label
                        class="flex min-h-12 items-center justify-between gap-3 border-t border-outline px-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-brand"
                        [class.cursor-pointer]="!!task.completion && !saving"
                        [class.cursor-not-allowed]="!task.completion"
                        [class.bg-review-soft]="task.isReviewed"
                        [class.text-review-ink]="task.isReviewed"
                        [class.bg-surface-subtle]="!task.isReviewed"
                        [class.text-ink]="!task.isReviewed && !!task.completion"
                        [class.text-ink-muted]="!task.completion"
                      >
                        <span class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]">
                          <mat-icon aria-hidden="true" class="!h-4 !w-4 shrink-0 !text-base !leading-none">
                            verified_user
                          </mat-icon>
                          {{
                            task.isReviewed
                              ? 'Reviewed'
                              : task.completion
                                ? 'Mark as reviewed'
                                : 'Review after completion'
                          }}
                        </span>
                        <input
                          #review
                          type="checkbox"
                          class="peer sr-only"
                          [checked]="task.isReviewed"
                          [disabled]="!task.completion || saving"
                          (change)="toggleReview(detail.id, task, review)"
                          [attr.aria-label]="'Reviewed: ' + task.name + ' for ' + detail.name"
                        />
                        @if (saving) {
                          <span
                            aria-hidden="true"
                            class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                          ></span>
                        } @else {
                          <span
                            aria-hidden="true"
                            class="flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-md border-2 peer-disabled:opacity-50"
                            [class.border-review]="task.isReviewed || !!task.completion"
                            [class.bg-review]="task.isReviewed"
                            [class.text-review-on]="task.isReviewed"
                            [class.border-outline]="!task.completion"
                            [class.bg-surface-raised]="!task.isReviewed"
                          >
                            @if (task.isReviewed) {
                              <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M3.25 8.25 6.5 11.5l6.25-7"
                                  stroke="currentColor"
                                  stroke-width="2.25"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                />
                              </svg>
                            }
                          </span>
                        }
                      </label>
                    </article>
                  } @empty {
                    <p class="rounded-2xl border border-dashed border-outline p-5 text-center text-sm text-ink-muted">
                      No tasks are assigned to Month {{ detail.month }}.
                    </p>
                  }
                  <p class="flex items-start gap-1.5 pt-1 text-xs leading-4 text-ink-muted">
                    <mat-icon aria-hidden="true" class="!h-4 !w-4 shrink-0 !text-base !leading-none">
                      visibility_off
                    </mat-icon>
                    Reviews are for staff only. Participants never see them.
                  </p>
                </div>
                <div class="space-y-2 px-5 pb-4">
                  <h4 class="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Monthly update</h4>
                  <dl class="grid grid-cols-2 gap-2">
                    <div class="rounded-xl border border-outline p-3">
                      <dt class="text-xs text-ink-muted">Amount saved</dt>
                      <dd class="mt-1 text-lg font-bold">
                        {{
                          detail.checkpoint?.savedMoney === null || detail.checkpoint?.savedMoney === undefined
                            ? '—'
                            : (detail.checkpoint?.savedMoney | currency)
                        }}
                      </dd>
                    </div>
                    <div class="rounded-xl border border-outline p-3">
                      <dt class="text-xs text-ink-muted">Credit score</dt>
                      <dd class="mt-1 text-lg font-bold">{{ detail.checkpoint?.creditScore ?? '—' }}</dd>
                    </div>
                  </dl>
                  @if (detail.checkpoint?.application; as notes) {
                    <p
                      class="whitespace-pre-line rounded-xl border border-outline p-3 text-sm leading-6 text-ink-muted"
                    >
                      {{ notes }}
                    </p>
                  }
                </div>
                <div class="space-y-2 px-5 pb-5">
                  @let uploading = store.uploading() === detail.id + ':' + detail.month;
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Documents</h4>
                    <label
                      class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline bg-surface px-3 text-xs font-bold text-brand-strong hover:bg-brand-soft focus-within:ring-2 focus-within:ring-brand"
                      [class.pointer-events-none]="uploading"
                      [class.opacity-60]="uploading"
                    >
                      <span class="relative inline-flex items-center justify-center gap-1.5">
                        <span class="inline-flex items-center gap-1.5" [class.invisible]="uploading">
                          <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base !leading-none">upload</mat-icon>
                          Upload receipt
                        </span>
                        @if (uploading) {
                          <mas-spinner class="absolute" />
                          <span class="sr-only">Uploading receipt</span>
                        }
                      </span>
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
                    <ul class="grid grid-cols-2 gap-2">
                      @for (document of detail.documents; track document.id) {
                        <li>
                          <button
                            type="button"
                            (click)="viewDocument(document.id, document.name)"
                            [attr.aria-label]="'View ' + document.name"
                            class="flex w-full flex-col gap-2 rounded-xl border border-outline bg-surface p-2.5 text-left hover:border-brand/50 hover:bg-brand-soft/40 focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            <span
                              aria-hidden="true"
                              class="flex h-16 items-center justify-center rounded-lg bg-surface-subtle text-ink-subtle"
                            >
                              <mat-icon>{{ document.type.includes('pdf') ? 'picture_as_pdf' : 'image' }}</mat-icon>
                            </span>
                            <span class="truncate text-xs font-bold" [title]="document.name">{{ document.name }}</span>
                          </button>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p class="rounded-xl border border-dashed border-outline p-4 text-center text-sm text-ink-muted">
                      No documents uploaded for this month.
                    </p>
                  }
                  <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <a
                      [routerLink]="['/partner-staff/programs', id(), 'users', detail.id]"
                      class="inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-bold text-brand-strong hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      Open participant record
                      <mat-icon aria-hidden="true" class="!h-4 !w-4 shrink-0 !text-base !leading-none">
                        arrow_forward
                      </mat-icon>
                    </a>
                  </div>
                  <button
                    type="button"
                    (click)="store.selectNextToReview()"
                    [disabled]="!store.nextToReview()"
                    class="mt-1 min-h-11 w-full rounded-xl border border-brand px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    {{ store.nextToReview() ? 'Next participant to review' : 'Nobody else to review this month' }}
                  </button>
                </div>
              </aside>
            }
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class MonthlyProgressComponent {
  readonly id = input.required<string>();
  readonly store = inject(TaskReviewStore);
  readonly statusClasses = STATUS_CLASSES;
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  toggleReview(userId: string, task: MonthTaskStatus, checkbox: HTMLInputElement): void {
    checkbox.checked = task.isReviewed;
    if (!task.completion) return;
    this.store.verify({
      userId,
      requirementId: task.requirementId,
      completedAt: new Date(task.completion.completedAt).toISOString(),
      verified: !task.isReviewed,
    });
  }

  reviewAll(userId: string, tasks: MonthTaskStatus[]): void {
    for (const task of tasks) {
      if (!task.completion || task.isReviewed) continue;
      this.store.verify({
        userId,
        requirementId: task.requirementId,
        completedAt: new Date(task.completion.completedAt).toISOString(),
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

  // Links from the dashboard calendar name a task; open the month that holds it once per link.
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

  uploadReceipts(userId: string, month: number, input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.store.uploadReceipts({ userId, month, files });
  }

  openPlan(): void {
    openMonthlyPlan(this.dialog, this.injector, this.store.focusedMonth());
  }
}
