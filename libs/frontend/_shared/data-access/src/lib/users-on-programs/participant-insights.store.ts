import { formatCurrency } from '@angular/common';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { MonthlyProgressStore } from './monthly-progress.store';
import { UsersOnProgramsStore } from './users-on-programs.store';

type ParticipantInsightsState = {
  focusedMonth: number | null;
};

const initialState: ParticipantInsightsState = { focusedMonth: null };

const RING_CIRCUMFERENCE = 2 * Math.PI * 15;
const CHART = { left: 40, right: 280, top: 50, bottom: 150 };

const money = (value: number, locale: string) => formatCurrency(value, locale, '$', 'USD', '1.2-2');

export const ParticipantInsightsStore = signalStore(
  withState(initialState),
  withComputed(
    (
      { focusedMonth },
      progressStore = inject(MonthlyProgressStore),
      usersOnProgramsStore = inject(UsersOnProgramsStore),
      locale = inject(LOCALE_ID),
    ) => {
      const months = progressStore.trackerMonths;
      const savedMonths = computed(() =>
        months().filter((month) => month.checkpoint?.savedMoney !== null && month.checkpoint?.savedMoney !== undefined),
      );
      const latestSaved = computed(() => savedMonths().at(-1) ?? null);
      const selectedBar = computed(
        () => savedMonths().find(({ number }) => number === focusedMonth()) ?? latestSaved(),
      );
      const scored = computed(() =>
        months().flatMap((month) => {
          const score = month.checkpoint?.creditScore;
          return score === null || score === undefined ? [] : [{ number: month.number, score }];
        }),
      );
      const tasks = usersOnProgramsStore.userProgramProgress;
      const completedTasks = computed(() => tasks().filter((task) => task.isCompleted).length);

      return {
        progress: computed(() => {
          const percent = usersOnProgramsStore.percentageCompleted();
          return {
            percent,
            ringDash: `${((percent / 100) * RING_CIRCUMFERENCE).toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}`,
            completed: completedTasks(),
            total: tasks().length,
            monthsComplete: months().filter(({ isComplete }) => isComplete).length,
            monthCount: months().length,
          };
        }),
        savings: computed(() => {
          const latest = latestSaved();
          return {
            totalLabel: usersOnProgramsStore.userProgramSavings(),
            latestLabel:
              latest && latest.checkpoint?.savedMoney !== null && latest.checkpoint?.savedMoney !== undefined
                ? `+${money(latest.checkpoint.savedMoney, locale)} in ${latest.name}`
                : null,
          };
        }),
        credit: computed(() => {
          const all = months().flatMap((month) =>
            month.checkpoint?.creditScore === null || month.checkpoint?.creditScore === undefined
              ? []
              : [month.checkpoint.creditScore],
          );
          const change = usersOnProgramsStore.userCreditIncrease();
          return {
            change,
            changeLabel: `${change > 0 ? '+' : ''}${change}`,
            rangeLabel: all.length > 1 ? `${all[0]} → ${all.at(-1)}` : null,
          };
        }),
        receipts: computed(() => {
          const checkpoints = progressStore.checkpoints();
          const count = checkpoints.reduce((sum, checkpoint) => sum + checkpoint.images.length, 0);
          const monthNames = new Set(
            checkpoints.filter((checkpoint) => checkpoint.images.length > 0).map(({ name }) => name),
          );
          return { count, monthCount: monthNames.size };
        }),
        savingsBars: computed(() => {
          const max = Math.max(1, ...months().map((month) => month.checkpoint?.savedMoney ?? 0));
          return months().map((month) => {
            const saved = month.checkpoint?.savedMoney ?? null;
            return {
              number: month.number,
              short: `M${month.number}`,
              label: saved === null ? '' : formatCurrency(saved, locale, '$', 'USD', '1.0-0'),
              hasSavings: saved !== null,
              heightPercent: saved === null ? 0 : Math.max(4, Math.round((saved / max) * 100)),
              isSelected: selectedBar()?.number === month.number,
              ariaLabel:
                saved === null ? `${month.name}: no savings recorded` : `${month.name}: ${money(saved, locale)} saved`,
            };
          });
        }),
        creditChart: computed(() => {
          const points = scored();
          if (!points.length) return null;
          const scores = points.map(({ score }) => score);
          const low = Math.min(...scores);
          const span = Math.max(...scores) - low || 1;
          const step = points.length > 1 ? (CHART.right - CHART.left) / (points.length - 1) : 0;
          const dots = points.map(({ number, score }, index) => ({
            number,
            score,
            x: points.length > 1 ? CHART.left + index * step : (CHART.left + CHART.right) / 2,
            y: points.length > 1 ? CHART.bottom - ((score - low) / span) * (CHART.bottom - CHART.top) : 100,
            isLatest: index === points.length - 1,
          }));
          return {
            dots,
            line: dots.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
            ariaLabel: `Credit score by month: ${points.map(({ number, score }) => `Month ${number} ${score}`).join(', ')}`,
          };
        }),
        monthDots: computed(() =>
          months().map((month) => ({
            number: month.number,
            name: month.name,
            isComplete: month.isComplete,
            isCurrent: month.state === 'current',
            label: `${month.name}: ${month.stateLabel}`,
          })),
        ),
      };
    },
  ),
  withMethods((store) => ({
    focusMonth: (focusedMonth: number) => patchState(store, { focusedMonth }),
  })),
);
