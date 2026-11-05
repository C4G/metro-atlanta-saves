import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { LoaderComponent } from '@mas/frontend-shared-components';
import { MonthlyProgressStore, ParticipantInsightsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-insights',
  imports: [LoaderComponent],
  providers: [MonthlyProgressStore, ParticipantInsightsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-6 sm:py-8" aria-labelledby="insights-heading">
      <header>
        @if (progressStore.trackerMonths().length) {
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-strong">
            Month {{ progressStore.currentMonth() }} of {{ progressStore.trackerMonths().length }}
          </p>
        }
        <h2 id="insights-heading" class="mt-1 text-2xl font-black tracking-tight">My insights</h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-ink-muted">How your savings, credit and tasks are adding up.</p>
      </header>

      @if (progressStore.loading()) {
        <mas-loader class="mt-6" label="Loading your insights" />
      } @else if (progressStore.loadFailed()) {
        <div class="mt-6 rounded-2xl border border-outline bg-surface-raised p-6" role="alert">
          <p class="text-sm text-ink-muted">We could not load your insights.</p>
          <button
            type="button"
            (click)="progressStore.load(id())"
            class="mt-3 min-h-11 rounded-xl border border-outline px-4 text-sm font-bold text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Try again
          </button>
        </div>
      } @else {
        @let progress = insights.progress();
        <section aria-label="Highlights" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            class="flex items-center justify-center gap-4 rounded-2xl border border-outline bg-surface-raised p-5"
          >
            <svg
              viewBox="0 0 36 36"
              class="h-[4.5rem] w-[4.5rem] shrink-0"
              role="img"
              [attr.aria-label]="progress.percent + ' percent of tasks done'"
            >
              <circle cx="18" cy="18" r="15" fill="none" stroke-width="4" class="stroke-ink/10" />
              @if (progress.percent > 0) {
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke-width="4"
                  stroke-linecap="round"
                  class="stroke-brand"
                  transform="rotate(-90 18 18)"
                  [attr.stroke-dasharray]="progress.ringDash"
                />
              }
              <text x="18" y="21" text-anchor="middle" class="fill-ink text-[0.53rem] font-bold">
                {{ progress.percent }}%
              </text>
            </svg>
            <div class="min-w-0 text-center">
              <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">Progress</h3>
              <p class="mt-1 text-base font-bold">{{ progress.completed }} of {{ progress.total }} tasks</p>
              <p class="mt-0.5 text-xs text-ink-muted">
                {{ progress.monthsComplete }} of {{ progress.monthCount }} months complete
              </p>
            </div>
          </article>
          <article
            class="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-raised p-5 text-center"
          >
            <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">Total saved</h3>
            <p class="mt-2 text-3xl font-black tabular-nums">{{ insights.savings().totalLabel }}</p>
            @if (insights.savings().latestLabel; as latest) {
              <p
                class="mt-2 inline-flex rounded-lg border border-brand/40 bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-strong"
              >
                {{ latest }}
              </p>
            } @else {
              <p class="mt-2 text-xs text-ink-muted">Add your first monthly update to start the count.</p>
            }
          </article>
          <article
            class="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-raised p-5 text-center"
          >
            <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">Credit score change</h3>
            <p class="mt-2 text-3xl font-black tabular-nums text-brand-strong">
              {{ insights.credit().changeLabel }}
              <span class="ml-1 text-xs font-bold text-ink-muted">points</span>
            </p>
            <p class="mt-2 text-xs text-ink-muted">
              {{ insights.credit().rangeLabel ?? 'Add your credit score in two months to see the change.' }}
            </p>
          </article>
          <article
            class="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-raised p-5 text-center"
          >
            <h3 class="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">Receipts</h3>
            <p class="mt-2 text-3xl font-black tabular-nums">{{ insights.receipts().count }}</p>
            <p class="mt-2 text-xs text-ink-muted">
              Uploaded across {{ insights.receipts().monthCount }}
              {{ insights.receipts().monthCount === 1 ? 'month' : 'months' }}
            </p>
          </article>
        </section>

        <div class="mt-4 grid gap-4 lg:grid-cols-5">
          <section
            aria-labelledby="savings-chart-heading"
            class="min-w-0 rounded-2xl border border-outline bg-surface-raised p-5 sm:p-6 lg:col-span-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="savings-chart-heading" class="text-lg font-bold">Savings by month</h3>
                <p class="mt-0.5 text-sm text-ink-muted" aria-live="polite">
                  @if (insights.selectedSavings(); as selected) {
                    {{ selected.name }}:
                    <strong class="text-ink">{{ selected.amount }}</strong>
                  } @else {
                    No savings recorded yet.
                  }
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle">Total saved</p>
                <p class="mt-0.5 text-xl font-black tabular-nums">{{ insights.savings().totalLabel }}</p>
              </div>
            </div>
            <div class="mt-5 flex h-56 items-end gap-2 border-b border-outline sm:gap-2.5">
              @for (bar of insights.savingsBars(); track bar.number) {
                <div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span
                    aria-hidden="true"
                    class="max-w-full truncate text-[0.6875rem] font-bold tabular-nums"
                    [class.text-brand-strong]="bar.isSelected"
                    [class.text-ink-muted]="!bar.isSelected"
                  >
                    {{ bar.label }}
                  </span>
                  <button
                    type="button"
                    (click)="insights.focusMonth(bar.number)"
                    [disabled]="!bar.hasSavings"
                    [attr.aria-pressed]="bar.isSelected"
                    [attr.aria-label]="bar.ariaLabel"
                    class="w-full rounded-t-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-default"
                    [style.height]="bar.hasSavings ? bar.heightPercent + '%' : '0.375rem'"
                    [class.bg-brand-strong]="bar.isSelected"
                    [class.bg-brand]="bar.hasSavings && !bar.isSelected"
                    [class.border]="!bar.hasSavings"
                    [class.border-dashed]="!bar.hasSavings"
                    [class.border-outline]="!bar.hasSavings"
                  ></button>
                </div>
              }
            </div>
            <div class="mt-2 flex gap-2 sm:gap-2.5" aria-hidden="true">
              @for (bar of insights.savingsBars(); track bar.number) {
                <span
                  class="min-w-0 flex-1 text-center text-[0.6875rem] font-bold"
                  [class.text-brand-strong]="bar.isSelected"
                  [class.text-ink-muted]="!bar.isSelected"
                >
                  {{ bar.short }}
                </span>
              }
            </div>
          </section>

          <section
            aria-labelledby="credit-chart-heading"
            class="min-w-0 rounded-2xl border border-outline bg-surface-raised p-5 sm:p-6 lg:col-span-2"
          >
            <h3 id="credit-chart-heading" class="text-lg font-bold">Credit score</h3>
            @if (insights.creditChart(); as chart) {
              <p class="mt-0.5 text-sm text-ink-muted">
                {{
                  insights.credit().change > 0
                    ? 'Up ' + insights.credit().change + ' points since you started'
                    : 'Your monthly credit scores'
                }}
              </p>
              <svg viewBox="0 0 320 200" class="mt-4 h-auto w-full" role="img" [attr.aria-label]="chart.ariaLabel">
                <line x1="20" y1="170" x2="300" y2="170" class="stroke-outline" stroke-width="1" />
                <polyline
                  [attr.points]="chart.line"
                  fill="none"
                  class="stroke-brand"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                @for (dot of chart.dots; track dot.number) {
                  <circle
                    [attr.cx]="dot.x"
                    [attr.cy]="dot.y"
                    [attr.r]="dot.isLatest ? 6 : 5"
                    stroke-width="3"
                    class="stroke-brand"
                    [class.fill-brand]="dot.isLatest"
                    [class.fill-surface-raised]="!dot.isLatest"
                  />
                  <text
                    [attr.x]="dot.x"
                    [attr.y]="dot.y - 14"
                    text-anchor="middle"
                    class="text-xs font-bold"
                    [class.fill-brand-strong]="dot.isLatest"
                    [class.fill-ink]="!dot.isLatest"
                  >
                    {{ dot.score }}
                  </text>
                  <text [attr.x]="dot.x" y="190" text-anchor="middle" class="fill-ink-muted text-[0.6875rem]">
                    M{{ dot.number }}
                  </text>
                }
              </svg>
            } @else {
              <p class="mt-6 rounded-xl border border-dashed border-outline p-6 text-center text-sm text-ink-muted">
                Add your credit score in a monthly update to see it here.
              </p>
            }
          </section>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-2">
          <section
            aria-labelledby="months-complete-heading"
            class="rounded-2xl border border-outline bg-surface-raised p-5 sm:p-6"
          >
            <h3 id="months-complete-heading" class="text-lg font-bold">Months completed</h3>
            <p class="mt-0.5 text-sm text-ink-muted">
              {{ progress.monthsComplete }} of {{ progress.monthCount }} months have every task done
            </p>
            <ol class="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              @for (month of insights.monthDots(); track month.number) {
                <li
                  class="flex h-11 items-center justify-center rounded-xl text-xs font-bold"
                  [attr.aria-label]="month.label"
                  [title]="month.label"
                  [class.bg-brand]="month.isComplete"
                  [class.text-brand-on]="month.isComplete"
                  [class.border]="!month.isComplete"
                  [class.border-brand]="month.isCurrent && !month.isComplete"
                  [class.bg-brand-soft]="month.isCurrent && !month.isComplete"
                  [class.text-brand-strong]="month.isCurrent && !month.isComplete"
                  [class.border-dashed]="!month.isCurrent && !month.isComplete"
                  [class.border-outline]="!month.isCurrent && !month.isComplete"
                  [class.text-ink-subtle]="!month.isCurrent && !month.isComplete"
                >
                  {{ month.number }}
                </li>
              }
            </ol>
          </section>

          <section
            aria-labelledby="coming-up-heading"
            class="rounded-2xl border border-outline bg-surface-raised p-5 sm:p-6"
          >
            <h3 id="coming-up-heading" class="text-lg font-bold">Coming up</h3>
            @if (insights.comingUp().length) {
              <ul class="mt-3 space-y-2">
                @for (task of insights.comingUp(); track task.requirementId) {
                  <li class="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle px-4 py-3">
                    <span class="min-w-0 truncate text-sm font-bold">{{ task.name }}</span>
                    <span
                      class="shrink-0 text-xs font-bold"
                      [class.text-warn-ink]="task.isOverdue"
                      [class.text-ink-muted]="!task.isOverdue"
                    >
                      {{ task.dueLabel }}
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-3 rounded-xl bg-surface-subtle px-4 py-3 text-sm text-ink-muted">
                You're all caught up on dated tasks.
              </p>
            }
          </section>
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export default class InsightsComponent {
  readonly id = input.required<string>();
  readonly progressStore = inject(MonthlyProgressStore);
  readonly insights = inject(ParticipantInsightsStore);
  readonly loadEffect = effect(() => {
    const id = this.id();
    untracked(() => this.progressStore.load(id));
  });
}
