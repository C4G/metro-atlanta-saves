import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  INSIGHTS_PERIODS,
  ParticipantStatus,
  ProgramInsightsStore,
  ProgramsStore,
  TaskReviewStore,
} from '@mas/frontend-shared-data-access';

const STATUS_BAR: Record<ParticipantStatus, string> = {
  onTrack: 'bg-brand',
  behind: 'bg-warn-ink',
  notStarted: 'bg-outline',
};

@Component({
  selector: 'mas-program-insights',
  providers: [ProgramInsightsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="insights-heading" class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="insights-heading" class="text-2xl font-semibold tracking-tight">Program insights</h2>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-bold text-ink-muted">
            <span class="sr-only">Period</span>
            <select
              #period
              (change)="setPeriod(period.value)"
              class="min-h-11 cursor-pointer appearance-none rounded-xl border border-outline bg-surface px-4 text-center text-sm font-bold text-ink hover:bg-brand-soft/40 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              @for (option of periods; track option.value) {
                <option [value]="option.value" [selected]="insights.period() === option.value">
                  {{ option.label }}
                </option>
              }
            </select>
          </label>
          <button
            type="button"
            (click)="exportReport()"
            [disabled]="!review.data()"
            class="min-h-11 rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-brand-strong hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            Export report
          </button>
        </div>
      </header>

      @if (!review.data() && !review.loadFailed()) {
        <div role="status" class="space-y-4">
          <span class="sr-only">Loading insights</span>
          <div aria-hidden="true" class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            @for (tile of [1, 2, 3, 4, 5, 6]; track tile) {
              <div
                class="animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none space-y-2.5 p-4"
              >
                <span class="mx-auto block h-3 w-2/3 rounded-md bg-outline/50"></span>
                <span class="mx-auto block h-7 w-1/2 rounded-md bg-outline/50"></span>
                <span class="mx-auto block h-3 w-3/4 rounded-md bg-outline/50"></span>
              </div>
            }
          </div>
          <div aria-hidden="true" class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div
              class="animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none p-5"
            >
              <span class="block h-5 w-1/3 rounded-md bg-outline/50"></span>
              <div class="mt-5 flex h-48 items-end gap-1.5">
                @for (bar of skeletonBars; track $index) {
                  <span class="flex-1 rounded-t-md bg-outline/50" [style.height.%]="bar"></span>
                }
              </div>
            </div>
            <div
              class="animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none space-y-3 p-5"
            >
              <span class="block h-5 w-1/2 rounded-md bg-outline/50"></span>
              <span class="block h-3 rounded-full bg-outline/50"></span>
              @for (row of [1, 2, 3]; track row) {
                <span class="block h-4 rounded-md bg-outline/50"></span>
              }
              <span class="block h-12 rounded-xl bg-outline/50"></span>
            </div>
          </div>
          <div aria-hidden="true" class="grid gap-4 md:grid-cols-2">
            @for (board of [1, 2]; track board) {
              <div
                class="animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none space-y-3 p-5"
              >
                <span class="block h-5 w-2/5 rounded-md bg-outline/50"></span>
                @for (row of [1, 2, 3, 4, 5]; track row) {
                  <div class="flex items-center gap-3">
                    <span class="h-8 w-8 shrink-0 rounded-full bg-outline/50"></span>
                    <span class="h-4 flex-1 rounded-md bg-outline/50"></span>
                    <span class="h-4 w-14 rounded-md bg-outline/50"></span>
                  </div>
                }
              </div>
            }
          </div>
          <div
            aria-hidden="true"
            class="animate-pulse rounded-2xl border border-outline bg-surface-raised motion-reduce:animate-none space-y-3 p-5"
          >
            <span class="block h-5 w-1/4 rounded-md bg-outline/50"></span>
            @for (row of [1, 2, 3, 4, 5, 6]; track row) {
              <span class="block h-8 rounded-md bg-outline/50"></span>
            }
          </div>
        </div>
      } @else if (review.loadFailed()) {
        <div role="alert" class="rounded-2xl border border-outline bg-surface-raised p-6">
          <p class="text-sm text-danger">We could not load insights.</p>
          <button
            type="button"
            (click)="review.load(review.programId())"
            class="mt-3 min-h-11 rounded-xl px-4 text-sm font-bold text-brand-strong underline focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else if (review.data()) {
        <section aria-label="Key numbers" class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          @for (kpi of insights.kpis(); track kpi.label) {
            <div
              class="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-raised p-4 text-center"
            >
              <p class="text-xs font-bold text-ink-muted">{{ kpi.label }}</p>
              <p
                class="mt-1.5 text-2xl font-bold tabular-nums"
                [class.text-brand-strong]="kpi.tone === 'brand'"
                [class.text-warn-ink]="kpi.tone === 'warn'"
              >
                {{ kpi.value }}
              </p>
              <p class="mt-1 text-xs text-ink-muted">{{ kpi.note }}</p>
            </div>
          }
        </section>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          @let savings = insights.savingsByMonth();
          <section aria-labelledby="savings-month" class="rounded-2xl border border-outline bg-surface-raised p-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 id="savings-month" class="text-base font-bold">Program savings by month</h3>
              <span class="rounded-lg bg-brand-soft px-2.5 py-1 text-sm font-bold text-brand-strong">
                Total {{ savings.total }}
              </span>
            </div>
            @if (savings.bars.length) {
              <ol class="mt-5 flex h-48 items-end gap-1.5" aria-label="Savings for each month">
                @for (bar of savings.bars; track bar.number) {
                  <li class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span class="truncate text-[0.6875rem] font-bold tabular-nums text-ink-muted" aria-hidden="true">
                      {{ bar.label }}
                    </span>
                    <span
                      role="img"
                      [attr.aria-label]="bar.ariaLabel"
                      class="block w-full rounded-t-md"
                      [style.height.%]="bar.heightPercent || 2"
                      [class.bg-brand-strong]="bar.isCurrent"
                      [class.bg-brand]="!bar.isCurrent && bar.value !== null"
                      [class.border]="bar.value === null"
                      [class.border-dashed]="bar.value === null"
                      [class.border-outline]="bar.value === null"
                    ></span>
                    <span class="text-[0.6875rem] font-bold text-ink-subtle" aria-hidden="true">M{{ bar.number }}</span>
                  </li>
                }
              </ol>
            } @else {
              <p class="mt-4 text-sm text-ink-muted">Set up the program’s months to see savings by month.</p>
            }
          </section>

          @let status = insights.status();
          <section aria-labelledby="status-heading" class="rounded-2xl border border-outline bg-surface-raised p-5">
            <h3 id="status-heading" class="text-base font-bold">Participant status</h3>
            <p class="mt-1 text-xs text-ink-muted">{{ status.basis }}</p>
            <div aria-hidden="true" class="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-subtle">
              @for (group of status.groups; track group.status) {
                <span [class]="statusBar[group.status]" [style.width.%]="group.percent"></span>
              }
            </div>
            <ul class="mt-3 space-y-1.5">
              @for (group of status.groups; track group.status) {
                <li class="flex items-center gap-2.5 text-sm">
                  <span aria-hidden="true" class="h-2.5 w-2.5 rounded-full" [class]="statusBar[group.status]"></span>
                  <span class="flex-1">{{ group.label }}</span>
                  <span class="font-bold tabular-nums">{{ group.count }}</span>
                  <span class="w-10 text-right text-xs tabular-nums text-ink-muted">{{ group.percent }}%</span>
                </li>
              }
            </ul>
            <div class="mt-4 grid grid-cols-2 gap-3 border-t border-outline pt-4">
              <div>
                <p class="text-xs text-ink-muted">Receipts reviewed</p>
                <p class="mt-0.5 text-lg font-bold tabular-nums">{{ status.receiptsLabel }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-muted">Tasks waiting for review</p>
                <p class="mt-0.5 text-lg font-bold tabular-nums text-review-ink">{{ status.awaitingReview }}</p>
              </div>
            </div>
          </section>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          @for (board of insights.boards(); track board.id) {
            <section
              [attr.aria-labelledby]="board.id + '-heading'"
              class="rounded-2xl border border-outline bg-surface-raised p-5"
            >
              <h3 [id]="board.id + '-heading'" class="text-base font-bold">{{ board.title }}</h3>
              <ol class="mt-3 space-y-2">
                @for (row of board.rows; track row.id) {
                  <li class="flex items-center gap-3">
                    <span class="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-ink-subtle">
                      {{ row.rank }}
                    </span>
                    <span
                      aria-hidden="true"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong"
                    >
                      {{ row.initials }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ row.name }}</span>
                      <span aria-hidden="true" class="mt-1 block h-1.5 rounded-full bg-surface-subtle">
                        <span class="block h-1.5 rounded-full bg-brand" [style.width.%]="row.barPercent"></span>
                      </span>
                    </span>
                    <span
                      class="w-16 shrink-0 text-right text-sm font-bold tabular-nums"
                      [class.text-brand-strong]="board.id === 'credit'"
                    >
                      {{ row.label }}
                    </span>
                  </li>
                } @empty {
                  <li class="py-3 text-sm text-ink-muted">{{ board.empty }}</li>
                }
              </ol>
            </section>
          }
        </div>

        <section
          aria-labelledby="everyone-heading"
          class="overflow-x-auto rounded-2xl border border-outline bg-surface-raised"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline p-4 sm:px-5">
            <h3 id="everyone-heading" class="text-base font-bold">Every participant</h3>
            <div role="group" aria-label="Sort by" class="flex flex-wrap gap-1.5">
              @for (option of insights.sorts(); track option.value) {
                <button
                  type="button"
                  (click)="insights.setSort(option.value)"
                  [attr.aria-pressed]="option.isActive"
                  class="min-h-9 rounded-lg border px-3 text-xs font-bold hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  [class.border-brand]="option.isActive"
                  [class.bg-brand-soft]="option.isActive"
                  [class.text-brand-strong]="option.isActive"
                  [class.border-outline]="!option.isActive"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </div>
          <table class="w-full min-w-[40rem] text-left text-sm">
            <caption class="sr-only">Savings, credit score, tasks and receipts for every participant</caption>
            <thead>
              <tr class="border-b border-outline text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">
                <th scope="col" class="px-5 py-2.5">Participant</th>
                <th scope="col" class="px-3 py-2.5">Saved</th>
                <th scope="col" class="px-3 py-2.5">Credit score</th>
                <th scope="col" class="px-3 py-2.5">Tasks done</th>
                <th scope="col" class="px-5 py-2.5">Receipts</th>
              </tr>
            </thead>
            <tbody>
              @for (row of insights.table(); track row.id) {
                <tr class="border-b border-outline last:border-b-0">
                  <th scope="row" class="px-5 py-2.5 font-bold">{{ row.name }}</th>
                  <td class="px-3 py-2.5 font-bold tabular-nums">{{ row.savedLabel }}</td>
                  <td class="px-3 py-2.5 tabular-nums">
                    {{ row.scoreLabel }}
                    @if (row.deltaLabel) {
                      <span
                        class="ml-1 text-xs font-bold"
                        [class.text-brand-strong]="!row.isDecline"
                        [class.text-danger]="row.isDecline"
                      >
                        {{ row.deltaLabel }}
                      </span>
                    }
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="flex items-center gap-2">
                      <span aria-hidden="true" class="h-1.5 w-20 rounded-full bg-surface-subtle">
                        <span class="block h-1.5 rounded-full bg-brand" [style.width.%]="row.taskPercent"></span>
                      </span>
                      <span class="text-xs font-bold tabular-nums text-ink-muted">
                        {{ row.tasksDone }}/{{ row.taskTotal }}
                      </span>
                    </span>
                  </td>
                  <td class="px-5 py-2.5 tabular-nums">{{ row.receipts }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-sm text-ink-muted">No participants yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class ProgramInsightsComponent {
  readonly review = inject(TaskReviewStore);
  readonly insights = inject(ProgramInsightsStore);
  private readonly programs = inject(ProgramsStore);
  readonly periods = INSIGHTS_PERIODS;
  readonly statusBar = STATUS_BAR;
  readonly skeletonBars = [40, 62, 70, 78, 84, 92, 18, 18, 18, 18];

  setPeriod(value: string): void {
    const period = this.periods.find((option) => option.value === value);
    if (period) this.insights.setPeriod(period.value);
  }

  exportReport(): void {
    const url = URL.createObjectURL(new Blob([this.insights.reportCsv()], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.programs.program()?.name ?? 'program'} insights.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
