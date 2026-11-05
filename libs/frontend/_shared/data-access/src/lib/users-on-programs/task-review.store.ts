import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, LOCALE_ID } from '@angular/core';
import {
  ProgramMonth,
  SavedMonthlyPlan,
  TaskReviewCheckpoint,
  TaskReviewCompletion,
  TaskReviewData,
  TaskReviewDocument,
} from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, filter, map, mergeMap, Observable, pipe, switchMap, tap } from 'rxjs';
import { monthOfProgram } from './program-month';

const baseUrl = '/api/users-on-programs/program';

export type MonthTaskStatus = {
  requirementId: string;
  name: string;
  completion: TaskReviewCompletion | null;
  isComplete: boolean;
  isReviewed: boolean;
  isLegacy: boolean;
  isStaffCompleted: boolean;
};

export type ParticipantMonth = {
  month: number;
  tasks: MonthTaskStatus[];
  completeCount: number;
  awaitingReview: number;
  checkpoint: TaskReviewCheckpoint | null;
  documents: TaskReviewDocument[];
  isUpcoming: boolean;
};

export type MonthSummary = ProgramMonth & {
  taskCount: number;
  documentCount: number;
  percentComplete: number;
  awaitingReview: number;
  state: 'done' | 'now' | 'upcoming';
};

export type PlanAssignment = {
  requirementId: string;
  month: number | null;
  name?: string;
  dueAt?: string | null;
  educationalContentId?: string | null;
};

export type NewPlanTask = { name: string; month: number; dueAt: string | null; educationalContentId: string | null };

export type MonthlyPlanSubmission = {
  months: number;
  assignments: PlanAssignment[];
  newTasks: NewPlanTask[];
  removedRequirementIds: string[];
  onSaved: () => void;
};

export type ParticipantTotals = { saved: number; tasksDone: number; taskTotal: number };

export type RosterFilter = 'all' | 'review' | 'open';

export type RosterStatus = 'review' | 'done' | 'open' | 'upcoming';

const ROSTER_FILTERS: { value: RosterFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'review', label: 'To review' },
  { value: 'open', label: 'Not finished' },
];

const statusLabel = (status: RosterStatus, awaitingReview: number) =>
  status === 'review'
    ? `${awaitingReview} to review`
    : status === 'done'
      ? 'Reviewed'
      : status === 'upcoming'
        ? 'Not open yet'
        : 'Not finished';

type TaskReviewState = {
  programId: string;
  data: TaskReviewData | null;
  loading: boolean;
  loadFailed: boolean;
  pending: string[];
  saveError: string;
  view: 'month' | 'grid';
  focusMonth: number | null;
  rosterFilter: RosterFilter;
  selectedUserId: string | null;
  planSaving: boolean;
  planError: string;
  uploading: string | null;
  uploadError: string;
};

const initialState: TaskReviewState = {
  programId: '',
  data: null,
  loading: false,
  loadFailed: false,
  pending: [],
  saveError: '',
  view: 'month',
  focusMonth: null,
  rosterFilter: 'all',
  selectedUserId: null,
  planSaving: false,
  planError: '',
  uploading: null,
  uploadError: '',
};

const planErrorMessage = (error: unknown) =>
  error instanceof HttpErrorResponse && error.status === 409
    ? 'Some tasks are still assigned to months you removed. Move them to an earlier month first.'
    : 'We could not save the monthly plan. Please try again.';

export const TaskReviewStore = signalStore(
  withState(initialState),
  withComputed(({ data }, locale = inject(LOCALE_ID)) => {
    const months = computed(() => data()?.months ?? []);
    const currentMonth = computed(() =>
      Math.min(Math.max(monthOfProgram(data()?.startDate ?? null, new Date()), 1), Math.max(months().length, 1)),
    );
    const rows = computed(() => {
      const review = data();
      if (!review) return [];
      const byFirstName = [...review.participants].sort(
        (a, b) =>
          a.firstName.localeCompare(b.firstName, locale, { sensitivity: 'base' }) ||
          a.lastName.localeCompare(b.lastName, locale, { sensitivity: 'base' }),
      );
      return byFirstName.map((participant) => {
        const completions = new Map(
          participant.completions.map((completion) => [completion.requirementId, completion]),
        );
        const cells = new Map<number, ParticipantMonth>(
          months().map(({ name, number }) => {
            const tasks = review.requirements
              .filter((requirement) => requirement.month === number)
              .map((requirement) => {
                const completion = completions.get(requirement.id) ?? null;
                const isLegacy = !completion && participant.requirementStatus.includes(requirement.id);
                return {
                  requirementId: requirement.id,
                  name: requirement.name,
                  completion,
                  isComplete: !!completion || isLegacy,
                  isReviewed: !!completion?.verifiedAt,
                  isLegacy,
                  isStaffCompleted: !!completion?.completedById && completion.completedById !== participant.id,
                };
              });
            const entries = (participant.checkpoints ?? []).filter((checkpoint) => checkpoint.name === name);
            return [
              number,
              {
                month: number,
                tasks,
                completeCount: tasks.filter((task) => task.isComplete).length,
                awaitingReview: tasks.filter((task) => task.completion && !task.isReviewed).length,
                checkpoint: entries[0] ?? null,
                documents: entries.flatMap((entry) => entry.images),
                isUpcoming: number > currentMonth(),
              },
            ];
          }),
        );
        return {
          id: participant.id,
          name: `${participant.firstName} ${participant.lastName}`.trim(),
          initials: `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`.toUpperCase(),
          email: participant.email,
          months: cells,
        };
      });
    });
    return {
      months,
      currentMonth,
      participantRows: rows,
      participantTotals: computed(() => {
        const review = data();
        const requirementIds = new Set((review?.requirements ?? []).map(({ id }) => id));
        return new Map<string, ParticipantTotals>(
          (review?.participants ?? []).map((participant) => {
            const done = new Set([
              ...participant.completions.map(({ requirementId }) => requirementId),
              ...participant.requirementStatus,
            ]);
            return [
              participant.id,
              {
                saved: participant.checkpoints.reduce((sum, checkpoint) => sum + (checkpoint.savedMoney ?? 0), 0),
                tasksDone: [...done].filter((id) => requirementIds.has(id)).length,
                taskTotal: requirementIds.size,
              },
            ];
          }),
        );
      }),
      unscheduledCount: computed(() => (data()?.requirements ?? []).filter((requirement) => !requirement.month).length),
      awaitingReviewTotal: computed(() =>
        rows().reduce(
          (total, row) => total + [...row.months.values()].reduce((sum, cell) => sum + cell.awaitingReview, 0),
          0,
        ),
      ),
      monthSummaries: computed<MonthSummary[]>(() =>
        months().map((month) => {
          const cells = rows().flatMap((row) => row.months.get(month.number) ?? []);
          const taskCount = (data()?.requirements ?? []).filter(
            (requirement) => requirement.month === month.number,
          ).length;
          const possible = taskCount * cells.length;
          return {
            ...month,
            taskCount,
            documentCount: cells.reduce((sum, cell) => sum + cell.documents.length, 0),
            percentComplete: possible
              ? Math.round((cells.reduce((sum, cell) => sum + cell.completeCount, 0) / possible) * 100)
              : 0,
            awaitingReview: cells.reduce((sum, cell) => sum + cell.awaitingReview, 0),
            state: month.number < currentMonth() ? 'done' : month.number === currentMonth() ? 'now' : 'upcoming',
          };
        }),
      ),
    };
  }),
  withComputed(
    ({ months, currentMonth, monthSummaries, participantRows, focusMonth, rosterFilter, selectedUserId }) => {
      const focusedMonth = computed(() => {
        const month = focusMonth();
        return months().some(({ number }) => number === month) && month !== null ? month : currentMonth();
      });
      const roster = computed(() =>
        participantRows().flatMap(({ months: cells, ...participant }) => {
          const cell = cells.get(focusedMonth());
          if (!cell) return [];
          const isFinished = cell.tasks.length > 0 && cell.completeCount === cell.tasks.length;
          const status: RosterStatus = cell.awaitingReview
            ? 'review'
            : isFinished
              ? 'done'
              : cell.isUpcoming
                ? 'upcoming'
                : 'open';
          return [
            {
              ...participant,
              ...cell,
              isFinished,
              status,
              statusLabel: statusLabel(status, cell.awaitingReview),
              reviewedCount: cell.tasks.filter((task) => task.isReviewed).length,
              unreviewedCount: cell.tasks.filter((task) => !task.isReviewed).length,
              percentComplete: cell.tasks.length ? Math.round((cell.completeCount / cell.tasks.length) * 100) : 0,
            },
          ];
        }),
      );
      const matchesFilter = (
        filter: RosterFilter,
        { awaitingReview, isFinished }: { awaitingReview: number; isFinished: boolean },
      ) => filter === 'all' || (filter === 'review' && awaitingReview > 0) || (filter === 'open' && !isFinished);
      const filteredRoster = computed(() => roster().filter((person) => matchesFilter(rosterFilter(), person)));
      const selectedMonth = computed(
        () => roster().find(({ id }) => id === selectedUserId()) ?? filteredRoster().at(0) ?? roster().at(0) ?? null,
      );
      return {
        focusedMonth,
        focusedSummary: computed(() => monthSummaries().find(({ number }) => number === focusedMonth()) ?? null),
        isFirstMonth: computed(() => months().at(0)?.number === focusedMonth()),
        isLastMonth: computed(() => months().at(-1)?.number === focusedMonth()),
        roster,
        filteredRoster,
        finishedCount: computed(() => roster().filter(({ isFinished }) => isFinished).length),
        rosterFilters: computed(() =>
          ROSTER_FILTERS.map((filter) => ({
            ...filter,
            count: roster().filter((person) => matchesFilter(filter.value, person)).length,
          })),
        ),
        selectedMonth,
        nextToReview: computed(
          () => roster().find(({ id, awaitingReview }) => awaitingReview > 0 && id !== selectedMonth()?.id) ?? null,
        ),
        programGrid: computed(() =>
          participantRows().map(({ months: cells, ...participant }) => {
            const opened = [...cells.values()].filter(({ month }) => month <= currentMonth());
            const possible = opened.reduce((sum, cell) => sum + cell.tasks.length, 0);
            return {
              ...participant,
              cells: months().flatMap(({ number }) => cells.get(number) ?? []),
              percentComplete: possible
                ? Math.round((opened.reduce((sum, cell) => sum + cell.completeCount, 0) / possible) * 100)
                : 0,
              openMonths: opened.filter((cell) => cell.completeCount < cell.tasks.length).length,
            };
          }),
        ),
      };
    },
  ),
  withMethods((store, http = inject(HttpClient)) => ({
    setView: (view: 'month' | 'grid') => patchState(store, { view }),
    setRosterFilter: (rosterFilter: RosterFilter) => patchState(store, { rosterFilter }),
    select: (selectedUserId: string) => patchState(store, { selectedUserId }),
    focusOn: (focusMonth: number | null) => patchState(store, { focusMonth }),
    stepMonth: (step: number) => {
      const months = store.months();
      const next = months[months.findIndex(({ number }) => number === store.focusedMonth()) + step];
      if (next) patchState(store, { focusMonth: next.number });
    },
    selectNextToReview: () => {
      const next = store.nextToReview();
      if (!next) return;
      const visible = store.filteredRoster().some(({ id }) => id === next.id);
      patchState(store, { selectedUserId: next.id, rosterFilter: visible ? store.rosterFilter() : 'all' });
    },
    openMonth: (selectedUserId: string, focusMonth: number) =>
      patchState(store, { view: 'month', focusMonth, selectedUserId, rosterFilter: 'all' }),
    clearPlanError: () => patchState(store, { planError: '' }),
    uploadReceipts: rxMethod<{ userId: string; month: number; files: File[] }>(
      pipe(
        filter(() => store.uploading() === null),
        tap(({ userId, month }) => patchState(store, { uploading: `${userId}:${month}`, uploadError: '' })),
        exhaustMap(({ userId, month, files }) => {
          const programId = store.programId();
          const form = new FormData();
          files.forEach((file) => form.append('images', file));
          return http
            .post<TaskReviewCheckpoint>(
              `/api/checkpoints/program/${programId}/user/${userId}/month/${encodeURIComponent(`Month ${month}`)}/receipt-checkpoint`,
              {},
            )
            .pipe(
              switchMap((checkpoint) =>
                http
                  .post<TaskReviewDocument[]>('/api/images', form, {
                    params: { programId, checkpointId: checkpoint.id },
                  })
                  .pipe(map((images) => ({ checkpoint, images }))),
              ),
              tapResponse({
                next: ({ checkpoint, images }) => {
                  const review = store.data();
                  if (!review || store.programId() !== programId) return;
                  const added = images.map(({ id, name, type, imageVerified, createdAt }) => ({
                    id,
                    name,
                    type,
                    imageVerified,
                    createdAt,
                  }));
                  patchState(store, {
                    data: {
                      ...review,
                      participants: review.participants.map((person) => {
                        if (person.id !== userId) return person;
                        const known = person.checkpoints.some(({ id }) => id === checkpoint.id);
                        return {
                          ...person,
                          checkpoints: known
                            ? person.checkpoints.map((entry) =>
                                entry.id === checkpoint.id ? { ...entry, images: [...entry.images, ...added] } : entry,
                              )
                            : [
                                { ...checkpoint, images: [...(checkpoint.images ?? []), ...added] },
                                ...person.checkpoints,
                              ],
                        };
                      }),
                    },
                  });
                },
                error: () => patchState(store, { uploadError: 'We could not upload those files. Please try again.' }),
                finalize: () => patchState(store, { uploading: null }),
              }),
            );
        }),
      ),
    ),
    load: rxMethod<string>(
      pipe(
        switchMap((programId) => {
          patchState(store, {
            programId,
            data: null,
            loading: true,
            loadFailed: false,
            saveError: '',
            focusMonth: null,
            rosterFilter: 'all',
            selectedUserId: null,
          });
          return http.get<TaskReviewData>(`${baseUrl}/${programId}/task-review`).pipe(
            tapResponse({
              next: (data) => patchState(store, { data }),
              error: () => patchState(store, { loadFailed: true }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
    verify: rxMethod<{ userId: string; requirementId: string; completedAt?: string; verified: boolean }>(
      pipe(
        filter(({ userId, requirementId }) => !store.pending().includes(`${userId}:${requirementId}`)),
        filter(({ completedAt, verified }) => !!completedAt || verified),
        tap(({ userId, requirementId }) =>
          patchState(store, { pending: [...store.pending(), `${userId}:${requirementId}`], saveError: '' }),
        ),
        mergeMap(({ userId, requirementId, ...body }) => {
          const programId = store.programId();
          return http
            .patch<TaskReviewCompletion>(
              `${baseUrl}/${programId}/participants/${userId}/requirements/${requirementId}/verification`,
              body,
            )
            .pipe(
              tapResponse({
                next: (updated) => {
                  if (store.programId() !== programId) return;
                  patchState(store, (state) => ({
                    data: state.data
                      ? {
                          ...state.data,
                          participants: state.data.participants.map((person) =>
                            person.id !== userId
                              ? person
                              : {
                                  ...person,
                                  completions: [
                                    ...person.completions.filter(
                                      (completion) => completion.requirementId !== requirementId,
                                    ),
                                    updated,
                                  ],
                                },
                          ),
                        }
                      : null,
                  }));
                },
                error: () =>
                  patchState(store, {
                    saveError:
                      'We could not update verification. The participant may have changed this submission. Refresh the list and try again.',
                  }),
                finalize: () =>
                  patchState(store, { pending: store.pending().filter((id) => id !== `${userId}:${requirementId}`) }),
              }),
            );
        }),
      ),
    ),
    setCompletion: rxMethod<{ userId: string; requirementId: string; complete: boolean }>(
      pipe(
        filter(({ userId, requirementId }) => !store.pending().includes(`${userId}:${requirementId}`)),
        tap(({ userId, requirementId }) =>
          patchState(store, { pending: [...store.pending(), `${userId}:${requirementId}`], saveError: '' }),
        ),
        mergeMap(({ userId, requirementId, complete }) => {
          const programId = store.programId();
          const url = `${baseUrl}/${programId}/participants/${userId}/requirements/${requirementId}/completion`;
          const request: Observable<TaskReviewCompletion | null> = complete
            ? http.post<TaskReviewCompletion>(url, {})
            : http.delete<{ requirementId: string }>(url).pipe(map(() => null));
          return request.pipe(
            tapResponse({
              next: (completion) => {
                if (store.programId() !== programId) return;
                patchState(store, (state) => ({
                  data: state.data
                    ? {
                        ...state.data,
                        participants: state.data.participants.map((person) =>
                          person.id !== userId
                            ? person
                            : {
                                ...person,
                                requirementStatus: completion
                                  ? person.requirementStatus
                                  : person.requirementStatus.filter((id) => id !== requirementId),
                                completions: [
                                  ...person.completions.filter((entry) => entry.requirementId !== requirementId),
                                  ...(completion ? [completion] : []),
                                ],
                              },
                        ),
                      }
                    : null,
                }));
              },
              error: () => patchState(store, { saveError: 'We could not update that task. Please try again.' }),
              finalize: () =>
                patchState(store, { pending: store.pending().filter((id) => id !== `${userId}:${requirementId}`) }),
            }),
          );
        }),
      ),
    ),
    savePlan: rxMethod<MonthlyPlanSubmission>(
      pipe(
        exhaustMap(({ onSaved, ...body }) => {
          const programId = store.programId();
          patchState(store, { planSaving: true, planError: '' });
          return http.put<SavedMonthlyPlan>(`/api/programs/${programId}/monthly-plan`, body).pipe(
            tapResponse({
              next: (saved: SavedMonthlyPlan) => {
                const review = store.data();
                if (review && store.programId() === programId) {
                  const edits = new Map(body.assignments.map((assignment) => [assignment.requirementId, assignment]));
                  const removed = new Set(saved.removedRequirementIds);
                  patchState(store, {
                    data: {
                      ...review,
                      months: Array.from({ length: saved.months }, (_, index) => ({
                        name: `Month ${index + 1}`,
                        number: index + 1,
                      })),
                      requirements: [
                        ...review.requirements
                          .filter(({ id }) => !removed.has(id))
                          .map((requirement) => {
                            const edit = edits.get(requirement.id);
                            return edit
                              ? {
                                  ...requirement,
                                  month: edit.month,
                                  name: edit.name ?? requirement.name,
                                  dueAt:
                                    edit.dueAt === undefined
                                      ? requirement.dueAt
                                      : edit.dueAt
                                        ? new Date(edit.dueAt)
                                        : null,
                                  educationalContentId:
                                    edit.educationalContentId === undefined
                                      ? requirement.educationalContentId
                                      : edit.educationalContentId,
                                }
                              : requirement;
                          }),
                        ...saved.created,
                      ],
                    },
                  });
                }
                onSaved();
              },
              error: (error) => patchState(store, { planError: planErrorMessage(error) }),
              finalize: () => patchState(store, { planSaving: false }),
            }),
          );
        }),
      ),
    ),
  })),
);
