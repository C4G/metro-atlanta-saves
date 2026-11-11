import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { LoaderComponent, SectionPanelComponent } from '@mas/frontend-shared-components';
import {
  INSIGHTS_PERIODS,
  ParticipantStatus,
  ProgramInsightsStore,
  ProgramsStore,
  TaskReviewStore,
} from '@mas/frontend-shared-data-access';
import { AVATAR_SM, CONTROL, CONTROL_PRIMARY, SEGMENT, SEGMENT_BUTTON } from '../ui/staff-ui';

const STATUS_BAR: Record<ParticipantStatus, string> = {
  onTrack: 'bg-brand-strong',
  behind: 'bg-warn-ink',
  notStarted: 'bg-ink/15',
};


const BADGE =
  'inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums';

export const CHANGE_BADGES = {
  up: `${BADGE} border-brand/35 bg-brand-soft/80 text-brand-strong`,
  down: `${BADGE} border-danger/35 bg-danger/10 text-danger`,
  none: `${BADGE} border-transparent bg-surface-subtle text-ink-muted`,
};

@Component({
  selector: 'mas-program-insights',
  imports: [LoaderComponent, MatIcon, NgTemplateOutlet, SectionPanelComponent],
  providers: [ProgramInsightsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #period>
      <label class="relative block max-sm:w-full">
        <span class="sr-only">Period</span>
        <select
          #periodSelect
          [class]="controlClass + ' w-full cursor-pointer appearance-none pr-9'"
          (change)="setPeriod(periodSelect.value)"
        >
          @for (option of periods; track option.value) {
            <option [value]="option.value" [selected]="insights.period() === option.value">{{ option.label }}</option>
          }
        </select>
        <mat-icon
          class="mas-icon-sm pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        >
          expand_more
        </mat-icon>
      </label>
    </ng-template>
    <ng-template #export>
      <button type="button" [class]="primaryClass" (click)="exportReport()">
        <mat-icon class="mas-icon-sm" aria-hidden="true">download</mat-icon>
        Export report
      </button>
    </ng-template>

    @if (!review.data() && !review.loadFailed()) {
      <mas-loader label="Loading insights" />
    } @else if (review.loadFailed()) {
      <div role="alert" class="rounded-2xl border border-outline/65 bg-surface/60 p-6">
        <p class="text-sm text-ink-muted">We could not load insights.</p>
        <button type="button" [class]="controlClass + ' mt-3'" (click)="review.load(review.programId())">
          Try again
        </button>
      </div>
    } @else {
      <div class="flex flex-col gap-6">
        <div class="sm:hidden">
          <ng-container *ngTemplateOutlet="period" />
        </div>
        <mas-section-panel heading="Program overview" headingId="overview-heading">
          <div panelActions class="flex flex-wrap items-center gap-2">
            <div class="hidden sm:block">
              <ng-container *ngTemplateOutlet="period" />
            </div>
            <ng-container *ngTemplateOutlet="export" />
          </div>
          <div class="grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-5 md:grid-cols-3 lg:grid-cols-6">
            @for (kpi of insights.kpis(); track kpi.label) {
              <article
                class="flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-brand/25 bg-surface-raised/70 p-3 text-center"
              >
                <h3 class="text-xs font-bold text-ink-muted">{{ kpi.label }}</h3>
                <p
                  class="text-2xl font-bold tabular-nums sm:text-3xl"
                  [class]="
                    kpi.tone === 'brand' ? 'text-brand-strong' : kpi.tone === 'warn' ? 'text-warn-ink' : 'text-ink'
                  "
                >
                  {{ kpi.value }}
                </p>
              </article>
            }
          </div>
        </mas-section-panel>

        <div class="grid grid-cols-[minmax(0,1fr)] items-stretch gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          @let savings = insights.savingsByMonth();
          <mas-section-panel heading="Program savings by month" headingId="savings-heading">
            <span panelActions class="rounded-full bg-brand-soft/80 px-2.5 py-0.5 text-xs font-bold text-brand-strong">
              Total {{ savings.total }}
            </span>
            @if (savings.bars.length) {
              <ol class="flex h-56 items-end gap-1.5 px-4 pb-4 pt-6 sm:px-5" aria-label="Savings for each month">
                @for (bar of savings.bars; track bar.number) {
                  <li class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                    <span
                      class="w-full truncate text-center text-xs font-bold tabular-nums text-ink-muted"
                      aria-hidden="true"
                    >
                      {{ bar.label }}
                    </span>
                    <span
                      role="img"
                      class="block w-full rounded-t-lg"
                      [attr.aria-label]="bar.ariaLabel"
                      [style.height.%]="bar.heightPercent || 2"
                      [class]="
                        bar.value === null
                          ? 'border border-dashed border-outline'
                          : bar.isCurrent
                            ? 'bg-brand-strong'
                            : 'bg-brand'
                      "
                    ></span>
                    <span class="text-xs font-bold text-ink-muted" aria-hidden="true">M{{ bar.number }}</span>
                  </li>
                }
              </ol>
            } @else {
              <p class="p-5 text-sm text-ink-muted">Set up the program’s months to see savings by month.</p>
            }
          </mas-section-panel>

          @let status = insights.status();
          <mas-section-panel heading="Participant status" headingId="status-heading">
            <div class="flex flex-col gap-4 p-4 sm:p-5">
              <div class="flex h-2.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                @for (group of status.groups; track group.status) {
                  <span class="block h-full" [class]="statusBar[group.status]" [style.width.%]="group.percent"></span>
                }
              </div>
              <ul class="flex flex-col gap-2">
                @for (group of status.groups; track group.status) {
                  <li class="flex items-center gap-2.5 text-sm">
                    <span class="h-2.5 w-2.5 rounded-full" [class]="statusBar[group.status]" aria-hidden="true"></span>
                    <span class="flex-1">{{ group.label }}</span>
                    <span class="font-bold tabular-nums">{{ group.count }}</span>
                    <span class="w-10 text-right text-xs tabular-nums text-ink-muted">{{ group.percent }}%</span>
                  </li>
                }
              </ul>
              <dl class="grid grid-cols-2 border-t border-outline/55 pt-4 text-center">
                <div class="px-2">
                  <dt class="text-xs text-ink-muted">Receipts reviewed</dt>
                  <dd class="mt-1 text-lg font-bold tabular-nums">{{ status.receiptsLabel }}</dd>
                </div>
                <div class="border-l border-outline/55 px-2">
                  <dt class="text-xs text-ink-muted">Tasks waiting for review</dt>
                  <dd class="mt-1 text-lg font-bold tabular-nums text-brand-strong">{{ status.awaitingReview }}</dd>
                </div>
              </dl>
            </div>
          </mas-section-panel>
        </div>

        <div
          class="grid grid-cols-[minmax(0,1fr)] items-stretch gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
        >
          @for (board of insights.boards(); track board.id) {
            <mas-section-panel [heading]="board.title" [headingId]="board.id + '-heading'">
              <ol class="flex flex-col gap-3 p-4 sm:p-5">
                @for (row of board.rows; track row.id) {
                  <li class="flex items-center gap-3">
                    <span class="w-4 shrink-0 text-center text-xs tabular-nums text-ink-muted">{{ row.rank }}</span>
                    <span [class]="avatarSmClass" aria-hidden="true">{{ row.initials }}</span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-bold">{{ row.name }}</span>
                      <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                        <span class="block h-full rounded-full bg-brand" [style.width.%]="row.barPercent"></span>
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
                  <li class="text-sm text-ink-muted">{{ board.empty }}</li>
                }
              </ol>
            </mas-section-panel>
          }
        </div>

        <mas-section-panel heading="Program overview" headingId="participants-table-heading">
          <div
            panelActions
            role="group"
            aria-label="Sort by"
            [class]="segmentClass + ' max-sm:w-full max-sm:overflow-x-auto'"
          >
            @for (option of insights.sorts(); track option.value) {
              <button
                type="button"
                [class]="segmentButtonClass + ' max-sm:flex-1'"
                [attr.aria-pressed]="option.isActive"
                (click)="insights.setSort(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[44rem] text-sm">
              <caption class="sr-only">Savings, credit score, tasks and receipts for every participant</caption>
              <thead>
                <tr class="border-b border-outline/55">
                  @for (column of insights.columns(); track column.label; let index = $index) {
                    <th
                      scope="col"
                      class="whitespace-nowrap py-3 text-xs font-bold text-ink-muted"
                      [class]="index === 0 ? 'pl-4 pr-3 text-left sm:pl-5' : 'px-3 text-center'"
                      [attr.aria-sort]="column.ariaSort"
                    >
                      <span
                        [class]="
                          column.isSorted
                            ? 'inline-flex min-h-7 items-center rounded-lg border border-brand/70 bg-surface-raised px-2.5 text-brand-strong'
                            : ''
                        "
                      >
                        {{ column.label }}
                      </span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of insights.table(); track row.id) {
                  <tr class="border-b border-outline/35 last:border-b-0">
                    <th scope="row" class="py-3 pl-4 pr-3 text-left font-bold sm:pl-5">{{ row.name }}</th>
                    <td class="px-3 py-3 text-center font-bold tabular-nums">{{ row.savedLabel }}</td>
                    <td class="whitespace-nowrap px-3 py-3 text-center tabular-nums">{{ row.scoreLabel }}</td>
                    <td class="px-3 py-3 text-center">
                      <span [class]="row.deltaLabel ? (row.isDecline ? badges.down : badges.up) : badges.none">
                        {{ row.deltaLabel || '—' }}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      <span class="mx-auto flex max-w-52 items-center gap-2">
                        <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                          <span class="block h-full rounded-full bg-brand" [style.width.%]="row.taskPercent"></span>
                        </span>
                        <span class="text-xs font-bold tabular-nums text-ink-muted">
                          {{ row.tasksDone }}/{{ row.taskTotal }}
                        </span>
                      </span>
                    </td>
                    <td class="px-3 py-3 text-center tabular-nums">{{ row.receipts }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-8 text-center text-sm text-ink-muted">No participants yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mas-section-panel>
      </div>
    }
  `,
  host: { class: 'block' },
})
export default class ProgramInsightsComponent {
  readonly review = inject(TaskReviewStore);
  readonly insights = inject(ProgramInsightsStore);
  private readonly programs = inject(ProgramsStore);
  readonly periods = INSIGHTS_PERIODS;
  readonly statusBar = STATUS_BAR;
  readonly badges = CHANGE_BADGES;
  readonly controlClass = CONTROL;
  readonly primaryClass = CONTROL_PRIMARY;
  readonly segmentClass = SEGMENT;
  readonly segmentButtonClass = SEGMENT_BUTTON;
  readonly avatarSmClass = AVATAR_SM;

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
