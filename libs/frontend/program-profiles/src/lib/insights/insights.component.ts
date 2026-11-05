import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { LoaderComponent, SectionPanelComponent } from '@mas/frontend-shared-components';
import { MonthlyProgressStore, ParticipantInsightsStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-insights',
  imports: [LoaderComponent, SectionPanelComponent],
  providers: [MonthlyProgressStore, ParticipantInsightsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (progressStore.loading()) {
      <mas-loader label="Loading your insights" />
    } @else if (progressStore.loadFailed()) {
      <div class="rounded-2xl border border-outline/65 bg-surface/60 p-6" role="alert">
        <p class="text-sm text-ink-muted">We could not load your insights.</p>
        <button
          type="button"
          (click)="progressStore.load(id())"
          class="mt-3 inline-flex min-h-10 items-center rounded-xl border border-brand/25 bg-surface-raised/70 px-3 text-xs font-bold text-ink transition-colors hover:border-brand/70 hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Try again
        </button>
      </div>
    } @else {
      @let progress = insights.progress();
      <div class="space-y-6 sm:space-y-8">
        <mas-section-panel heading="Overall progress" headingId="overall-progress-heading">
          <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
            <article [class]="statClass">
              <h3 [class]="statLabelClass">Progress</h3>
              <span class="relative mt-2 flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center">
                <svg
                  viewBox="0 0 36 36"
                  class="absolute inset-0 h-[4.5rem] w-[4.5rem]"
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
                </svg>
                <span class="relative text-base font-bold tabular-nums text-ink" aria-hidden="true">
                  {{ progress.percent }}%
                </span>
              </span>
            </article>

            <article [class]="statClass">
              <h3 [class]="statLabelClass">Total saved</h3>
              <p class="mt-2 text-3xl font-black tabular-nums">{{ insights.savings().totalLabel }}</p>
              @if (insights.savings().latestLabel; as latest) {
                <p [class]="badgeClass">{{ latest }}</p>
              } @else {
                <p class="mt-2 text-xs text-ink-muted">Add your first monthly update to start the count.</p>
              }
            </article>

            <article [class]="statClass">
              <h3 [class]="statLabelClass">Credit score change</h3>
              <p class="mt-2 text-3xl font-black tabular-nums text-brand-strong">
                {{ insights.credit().changeLabel }}
                <span class="ml-1 text-xs font-bold text-ink-muted">points</span>
              </p>
              @if (insights.credit().rangeLabel; as range) {
                <p [class]="badgeClass">{{ range }}</p>
              } @else {
                <p class="mt-2 text-xs text-ink-muted">Add your credit score in two months to see the change.</p>
              }
            </article>

            <article [class]="statClass">
              <h3 [class]="statLabelClass">Receipts</h3>
              <p class="mt-2 text-3xl font-black tabular-nums">{{ insights.receipts().count }}</p>
              <p [class]="badgeClass">
                Across {{ insights.receipts().monthCount }}
                {{ insights.receipts().monthCount === 1 ? 'month' : 'months' }}
              </p>
            </article>
          </div>
        </mas-section-panel>

        <div class="grid gap-6 sm:gap-8 lg:grid-cols-5">
          <mas-section-panel class="min-w-0 lg:col-span-3" heading="Savings by month" headingId="savings-chart-heading">
            <p panelActions class="flex items-baseline gap-1.5 whitespace-nowrap">
              <span class="text-sm font-bold text-ink-muted">Total saved:</span>
              <span class="text-xl font-black tabular-nums">{{ insights.savings().totalLabel }}</span>
            </p>
            <div class="p-5 sm:p-6">
              <div class="flex h-56 items-end gap-2 border-b border-outline sm:gap-2.5">
                @for (bar of insights.savingsBars(); track bar.number) {
                  <div class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span
                      aria-hidden="true"
                      class="max-w-full truncate text-xs font-bold tabular-nums"
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
                      [style.height]="bar.hasSavings ? bar.heightPercent + '%' : '0'"
                      [class.bg-brand-strong]="bar.isSelected"
                      [class.bg-brand]="bar.hasSavings && !bar.isSelected"
                    ></button>
                  </div>
                }
              </div>
              <div class="mt-2 flex gap-2 sm:gap-2.5" aria-hidden="true">
                @for (bar of insights.savingsBars(); track bar.number) {
                  <span
                    class="min-w-0 flex-1 text-center text-xs font-bold"
                    [class.text-brand-strong]="bar.isSelected"
                    [class.text-ink-muted]="!bar.isSelected"
                  >
                    {{ bar.short }}
                  </span>
                }
              </div>
            </div>
          </mas-section-panel>

          <mas-section-panel class="min-w-0 lg:col-span-2" heading="Credit score" headingId="credit-chart-heading">
            <div class="p-5 sm:p-6">
              @if (insights.creditChart(); as chart) {
                <svg viewBox="0 0 320 200" class="h-auto w-full" role="img" [attr.aria-label]="chart.ariaLabel">
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
                    <text [attr.x]="dot.x" y="190" text-anchor="middle" class="fill-ink-muted text-xs">
                      M{{ dot.number }}
                    </text>
                  }
                </svg>
              } @else {
                <p class="rounded-xl border border-dashed border-outline p-6 text-center text-sm text-ink-muted">
                  Add your credit score in a monthly update to see it here.
                </p>
              }
            </div>
          </mas-section-panel>
        </div>

        <mas-section-panel heading="Months completed" headingId="months-complete-heading">
          <div class="p-5 sm:p-6">
            <ol class="grid grid-cols-5 gap-2 sm:grid-cols-10">
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
          </div>
        </mas-section-panel>
      </div>
    }
  `,
  host: { class: 'block' },
})
export default class InsightsComponent {
  readonly id = input.required<string>();
  readonly progressStore = inject(MonthlyProgressStore);
  readonly insights = inject(ParticipantInsightsStore);
  readonly statClass =
    'flex flex-col items-center justify-center rounded-xl border border-brand/25 bg-surface-raised/70 p-5 text-center';
  readonly statLabelClass = 'text-xs font-bold uppercase tracking-[0.1em] text-ink-subtle';
  readonly badgeClass =
    'mt-2 inline-flex rounded-lg border border-brand/40 bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-strong';
  readonly loadEffect = effect(() => {
    const id = this.id();
    untracked(() => this.progressStore.load(id));
  });
}
