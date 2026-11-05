import { formatCurrency } from '@angular/common';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { TaskReviewStore } from './task-review.store';

export type InsightsPeriod = 'all' | 'month' | 'quarter';
export type InsightsSort = 'saved' | 'credit' | 'tasks' | 'name';
export type ParticipantStatus = 'onTrack' | 'behind' | 'notStarted';

type ProgramInsightsState = { period: InsightsPeriod; sort: InsightsSort };

const initialState: ProgramInsightsState = { period: 'all', sort: 'saved' };

export const INSIGHTS_PERIODS: { value: InsightsPeriod; label: string }[] = [
  { value: 'all', label: 'All months so far' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'Last 3 months' },
];

const SORTS: { value: InsightsSort; label: string }[] = [
  { value: 'saved', label: 'Most saved' },
  { value: 'credit', label: 'Credit gain' },
  { value: 'tasks', label: 'Tasks done' },
  { value: 'name', label: 'Name' },
];

const STATUSES: { value: ParticipantStatus; label: string }[] = [
  { value: 'onTrack', label: 'On track' },
  { value: 'behind', label: 'Behind on tasks' },
  { value: 'notStarted', label: 'Not started' },
];

// Points gained between the first and latest monthly credit scores; null until there are two scores.
export const creditChange = (scores: number[]) => (scores.length > 1 ? (scores.at(-1) ?? 0) - scores[0] : null);

// Someone is on track when every task from the months before this one is done.
export const participantStatus = ({
  hasActivity,
  overdueOpen,
}: {
  hasActivity: boolean;
  overdueOpen: number;
}): ParticipantStatus => (!hasActivity ? 'notStarted' : overdueOpen ? 'behind' : 'onTrack');

// Quotes a spreadsheet cell when it holds a comma, quote, or line break.
export const csvCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;

export const ProgramInsightsStore = signalStore(
  withState(initialState),
  withComputed(({ period, sort }, review = inject(TaskReviewStore), locale = inject(LOCALE_ID)) => {
    const money = (value: number, digits = '1.0-0') => formatCurrency(value, locale, '$', 'USD', digits);
    const periodMonths = computed(() => {
      const current = review.currentMonth();
      const first = period() === 'month' ? current : period() === 'quarter' ? Math.max(1, current - 2) : 1;
      return new Set(review.months().flatMap(({ number }) => (number >= first && number <= current ? [number] : [])));
    });
    const people = computed(() =>
      review.participantRows().map((row) => {
        const cells = [...row.months.values()];
        const inPeriod = cells.filter(({ month }) => periodMonths().has(month));
        const scores = cells
          .sort((a, b) => a.month - b.month)
          .flatMap(({ checkpoint }) => (checkpoint?.creditScore == null ? [] : [checkpoint.creditScore]));
        const totals = review.participantTotals().get(row.id);
        const saved = inPeriod.reduce((sum, { checkpoint }) => sum + (checkpoint?.savedMoney ?? 0), 0);
        const documents = inPeriod.flatMap(({ documents }) => documents);
        return {
          id: row.id,
          name: row.name,
          initials: row.initials,
          saved,
          scores,
          delta: creditChange(scores),
          tasksDone: totals?.tasksDone ?? 0,
          taskTotal: totals?.taskTotal ?? 0,
          periodDone: inPeriod.reduce((sum, cell) => sum + cell.completeCount, 0),
          periodTasks: inPeriod.reduce((sum, cell) => sum + cell.tasks.length, 0),
          receipts: documents.length,
          receiptsReviewed: documents.filter(({ imageVerified }) => imageVerified).length,
          status: participantStatus({
            hasActivity: (totals?.tasksDone ?? 0) > 0 || (totals?.saved ?? 0) > 0,
            overdueOpen: cells
              .filter(({ month }) => month < review.currentMonth())
              .reduce((sum, cell) => sum + cell.tasks.length - cell.completeCount, 0),
          }),
        };
      }),
    );
    const table = computed(() =>
      [...people()]
        .sort((a, b) =>
          sort() === 'name'
            ? a.name.localeCompare(b.name, locale, { sensitivity: 'base' })
            : sort() === 'saved'
              ? b.saved - a.saved
              : sort() === 'credit'
                ? (b.delta ?? -Infinity) - (a.delta ?? -Infinity)
                : b.tasksDone - a.tasksDone,
        )
        .map((person) => ({
          ...person,
          savedLabel: money(person.saved, '1.2-2'),
          scoreLabel: !person.scores.length
            ? 'No score yet'
            : person.scores.length === 1
              ? String(person.scores[0])
              : `${person.scores[0]} → ${person.scores.at(-1)}`,
          deltaLabel: person.delta === null ? '' : signed(person.delta),
          isDecline: (person.delta ?? 0) < 0,
          taskPercent: person.taskTotal ? Math.round((person.tasksDone / person.taskTotal) * 100) : 0,
        })),
    );
    const top = (
      rows: { id: string; name: string; initials: string; value: number }[],
      format: (v: number) => string,
    ) => {
      const best = rows[0]?.value || 1;
      return rows.slice(0, 5).map((row, index) => ({
        ...row,
        rank: index + 1,
        label: format(row.value),
        barPercent: Math.max(4, Math.round((row.value / best) * 100)),
      }));
    };
    return {
      periodLabel: computed(() => INSIGHTS_PERIODS.find(({ value }) => value === period())?.label ?? ''),
      kpis: computed(() => {
        const all = people();
        const done = all.reduce((sum, person) => sum + person.periodDone, 0);
        const possible = all.reduce((sum, person) => sum + person.periodTasks, 0);
        const total = all.reduce((sum, person) => sum + person.saved, 0);
        const scored = all.flatMap(({ delta }) => (delta === null ? [] : [delta]));
        const average = scored.length ? scored.reduce((sum, delta) => sum + delta, 0) / scored.length : null;
        const declined = scored.filter((delta) => delta < 0).length;
        const notSaving = all.filter(({ saved }) => !saved).length;
        return [
          {
            label: 'Tasks complete',
            value: possible ? `${Math.round((done / possible) * 100)}%` : '—',
            note: `${done} of ${possible} ${possible === 1 ? 'task' : 'tasks'}`,
            tone: 'ink',
          },
          {
            label: 'Total saved',
            value: money(total),
            note: `Across ${all.length} ${all.length === 1 ? 'participant' : 'participants'}`,
            tone: 'ink',
          },
          {
            label: 'Average saved',
            value: money(all.length ? Math.round(total / all.length) : 0),
            note: 'Per participant',
            tone: 'ink',
          },
          {
            label: 'Avg credit change',
            value: average === null ? '—' : signed(Number(average.toFixed(1))),
            note: scored.length ? `${scored.length} with two scores` : 'No one has two scores yet',
            tone: average !== null && average > 0 ? 'brand' : 'ink',
          },
          {
            label: 'Credit improved',
            value: scored.length ? `${scored.filter((delta) => delta > 0).length} of ${scored.length}` : '—',
            note: declined ? `${declined} went down` : 'No one went down',
            tone: 'ink',
          },
          {
            label: 'Not saving yet',
            value: String(notSaving),
            note: 'No savings recorded',
            tone: notSaving ? 'warn' : 'ink',
          },
        ];
      }),
      savingsByMonth: computed(() => {
        const totals = review.months().map(({ number, name }) => {
          const value = review
            .participantRows()
            .reduce((sum, row) => sum + (row.months.get(number)?.checkpoint?.savedMoney ?? 0), 0);
          return { number, name, value: number > review.currentMonth() ? null : value };
        });
        const max = Math.max(1, ...totals.map(({ value }) => value ?? 0));
        return {
          total: money(totals.reduce((sum, { value }) => sum + (value ?? 0), 0)),
          bars: totals.map((month) => ({
            ...month,
            label: month.value === null ? '' : money(month.value),
            heightPercent: month.value === null ? 0 : Math.max(3, Math.round((month.value / max) * 100)),
            isCurrent: month.number === review.currentMonth(),
            ariaLabel:
              month.value === null ? `${month.name}: not started yet` : `${month.name}: ${money(month.value)} saved`,
          })),
        };
      }),
      status: computed(() => {
        const all = people();
        const groups = STATUSES.map(({ value, label }) => {
          const count = all.filter((person) => person.status === value).length;
          return {
            status: value,
            label,
            count,
            percent: all.length ? Math.round((count / all.length) * 100) : 0,
          };
        });
        const receipts = all.reduce((sum, person) => sum + person.receipts, 0);
        return {
          groups,
          basis: `Based on tasks through Month ${review.currentMonth()}`,
          receiptsLabel: `${all.reduce((sum, person) => sum + person.receiptsReviewed, 0)} of ${receipts}`,
          awaitingReview: review.awaitingReviewTotal(),
        };
      }),
      boards: computed(() => [
        {
          id: 'savers',
          title: 'Top 5 savers',
          rows: top(
            people()
              .filter(({ saved }) => saved > 0)
              .sort((a, b) => b.saved - a.saved)
              .map(({ id, name, initials, saved }) => ({ id, name, initials, value: saved })),
            (value) => money(value),
          ),
          empty: 'No savings recorded yet.',
        },
        {
          id: 'credit',
          title: 'Top 5 credit score gains',
          rows: top(
            people()
              .flatMap(({ id, name, initials, delta }) =>
                delta !== null && delta > 0 ? [{ id, name, initials, value: delta }] : [],
              )
              .sort((a, b) => b.value - a.value),
            signed,
          ),
          empty: 'No credit score gains yet.',
        },
      ]),
      sorts: computed(() => SORTS.map((option) => ({ ...option, isActive: option.value === sort() }))),
      table,
      reportCsv: computed(() =>
        [
          [
            'Participant',
            'Saved',
            'First credit score',
            'Latest credit score',
            'Credit change',
            'Tasks done',
            'Receipts',
          ],
          ...table().map((row) => [
            row.name,
            row.saved.toFixed(2),
            row.scores.at(0) ?? '',
            row.scores.at(-1) ?? '',
            row.delta ?? '',
            `${row.tasksDone}/${row.taskTotal}`,
            row.receipts,
          ]),
        ]
          .map((cells) => cells.map(csvCell).join(','))
          .join('\n'),
      ),
    };
  }),
  withMethods((store) => ({
    setPeriod: (period: InsightsPeriod) => patchState(store, { period }),
    setSort: (sort: InsightsSort) => patchState(store, { sort }),
  })),
);
