import { HttpClient } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExtendedCheckpoint } from '@mas/models';
import { CheckpointName } from '@mas/prisma-client/browser';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap } from 'rxjs';
import { ProgramsStore } from '../programs/programs.store';
import { monthNumber, monthOfProgram } from './program-month';
import { UsersOnProgramsStore } from './users-on-programs.store';

type ProgressResponse = { checkpointNames: CheckpointName[]; checkpoints: ExtendedCheckpoint[] };
type ProgressSubmission = {
  name: string;
  savedMoney: number;
  creditScore: number | null;
  application: string;
  onSaved: () => void;
};

export type TrackerMonthState = 'complete' | 'current' | 'attention' | 'upcoming' | 'past';

const STATE_LABELS: Record<TrackerMonthState, string> = {
  complete: 'Complete',
  current: 'This month',
  attention: 'Needs attention',
  upcoming: 'Upcoming',
  past: 'No tasks',
};

const byMonthOrder = (a: CheckpointName, b: CheckpointName) =>
  (monthNumber(a.name) || Number.MAX_SAFE_INTEGER) - (monthNumber(b.name) || Number.MAX_SAFE_INTEGER) ||
  a.sequence - b.sequence ||
  a.name.localeCompare(b.name, undefined, { numeric: true });

const RING_CIRCUMFERENCE = 2 * Math.PI * 15;

type MonthlyProgressState = {
  programId: string | null;
  checkpointNames: CheckpointName[];
  checkpoints: ExtendedCheckpoint[];
  loading: boolean;
  loadFailed: boolean;
  saving: boolean;
  saveError: string;
  selectedNumber: number | null;
};

const initialState: MonthlyProgressState = {
  programId: null,
  checkpointNames: [],
  checkpoints: [],
  loading: false,
  loadFailed: false,
  saving: false,
  saveError: '',
  selectedNumber: null,
};

export const MonthlyProgressStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    months: computed(() =>
      store
        .checkpointNames()
        .filter((item) => item.type === 'Savings' || /^month\s+\d+$/i.test(item.name.trim()))
        .sort(byMonthOrder)
        .map((item) => {
          const entries = store.checkpoints().filter((checkpoint) => checkpoint.name === item.name);
          const checkpoint: ExtendedCheckpoint | null = entries.at(0) ?? null;
          return {
            name: item.name,
            checkpoint,
            verified: entries.some((entry) => entry.images.some((image) => image.imageVerified)),
            hasProgress:
              !!checkpoint &&
              (checkpoint.savedMoney !== null || checkpoint.creditScore !== null || !!checkpoint.application?.trim()),
          };
        }),
    ),
  })),
  withComputed(
    (
      { months },
      usersOnProgramsStore = inject(UsersOnProgramsStore),
      programsStore = inject(ProgramsStore),
      locale = inject(LOCALE_ID),
    ) => {
      const tasks = computed(() =>
        usersOnProgramsStore.userProgramProgress().map((task) => ({
          ...task,
          dueLabel: task.dueAt ? formatDate(task.dueAt, 'MMM d', locale) : null,
        })),
      );
      const numbered = computed(() =>
        months().map((month, index) => ({ ...month, number: monthNumber(month.name) || index + 1 })),
      );
      const currentMonth = computed(() =>
        Math.min(
          Math.max(monthOfProgram(programsStore.program()?.startDate, new Date()), 1),
          Math.max(numbered().length, 1),
        ),
      );
      return {
        currentMonth,
        trackerMonths: computed(() =>
          numbered().map((month) => {
            const monthTasks = tasks().filter((task) => task.month === month.number);
            const completeCount = monthTasks.filter((task) => task.isCompleted).length;
            const percentComplete = monthTasks.length ? Math.round((completeCount / monthTasks.length) * 100) : 0;
            const isComplete = monthTasks.length > 0 && completeCount === monthTasks.length;
            const state: TrackerMonthState = isComplete
              ? 'complete'
              : month.number === currentMonth()
                ? 'current'
                : month.number > currentMonth()
                  ? 'upcoming'
                  : monthTasks.length
                    ? 'attention'
                    : 'past';
            return {
              ...month,
              tasks: monthTasks,
              completeCount,
              percentComplete,
              isComplete,
              state,
              stateLabel: STATE_LABELS[state],
              ringDash: `${((percentComplete / 100) * RING_CIRCUMFERENCE).toFixed(1)} ${RING_CIRCUMFERENCE.toFixed(1)}`,
              updatedLabel:
                month.hasProgress && month.checkpoint
                  ? `Updated ${formatDate(month.checkpoint.updatedAt, 'mediumDate', locale)}`
                  : null,
            };
          }),
        ),
        anytimeTasks: computed(() => {
          const numbers = new Set(numbered().map((month) => month.number));
          return tasks().filter((task) => !task.month || !numbers.has(task.month));
        }),
      };
    },
  ),
  withComputed(({ trackerMonths, currentMonth, selectedNumber }) => {
    const selectedMonth = computed(() => {
      const number = selectedNumber() ?? currentMonth();
      return trackerMonths().find((month) => month.number === number) ?? trackerMonths().at(0) ?? null;
    });
    return {
      selectedMonth,
      isFirstMonth: computed(() => trackerMonths().at(0)?.number === selectedMonth()?.number),
      isLastMonth: computed(() => trackerMonths().at(-1)?.number === selectedMonth()?.number),
      isCurrentMonth: computed(() => selectedMonth()?.number === currentMonth()),
    };
  }),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    selectMonth: (selectedNumber: number) => patchState(store, { selectedNumber }),
    showCurrentMonth: () => patchState(store, { selectedNumber: null }),
    stepMonth: (step: number) => {
      const months = store.trackerMonths();
      const next = months[months.findIndex((month) => month.number === store.selectedMonth()?.number) + step];
      if (next) patchState(store, { selectedNumber: next.number });
    },
    load: rxMethod<string>(
      pipe(
        switchMap((programId) => {
          patchState(store, {
            programId,
            checkpointNames: [],
            checkpoints: [],
            loading: true,
            loadFailed: false,
            saveError: '',
            selectedNumber: null,
          });
          return http.get<ProgressResponse>(`/api/checkpoints/my/program/${programId}`).pipe(
            tapResponse({
              next: (data) => patchState(store, data),
              error: () => patchState(store, { loadFailed: true }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
    save: rxMethod<ProgressSubmission>(
      pipe(
        exhaustMap(({ name, onSaved, ...body }) => {
          patchState(store, { saving: true, saveError: '' });
          return http
            .put<ExtendedCheckpoint>(
              `/api/checkpoints/my/program/${store.programId()}/month/${encodeURIComponent(name)}`,
              body,
            )
            .pipe(
              tapResponse({
                next: (checkpoint) => {
                  patchState(store, {
                    checkpoints: [checkpoint, ...store.checkpoints().filter((entry) => entry.id !== checkpoint.id)],
                  });
                  snackBar.open(`${name} progress saved.`, undefined, { duration: 4000 });
                  onSaved();
                },
                error: () =>
                  patchState(store, {
                    saveError: 'We could not save your progress. Your entries are still here—please try again.',
                  }),
                finalize: () => patchState(store, { saving: false }),
              }),
            );
        }),
      ),
    ),
  })),
);
