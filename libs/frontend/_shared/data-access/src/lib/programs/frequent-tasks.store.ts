import { HttpClient } from '@angular/common/http';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { FrequentTask } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { mergeMap, pipe, switchMap, tap } from 'rxjs';

type FrequentTasksState = {
  programId: string;
  tasks: FrequentTask[];
  loading: boolean;
  error: string;
  pending: string[];
};

const initialState: FrequentTasksState = { programId: '', tasks: [], loading: false, error: '', pending: [] };

export const taskKey = (name: string) => name.trim().toLowerCase();

export const FrequentTasksStore = signalStore(
  withState(initialState),
  withComputed(({ tasks }, locale = inject(LOCALE_ID)) => ({
    sortedTasks: computed(() =>
      [...tasks()].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' })),
    ),
    savedNames: computed(() => new Set(tasks().map(({ name }) => taskKey(name)))),
  })),
  withMethods((store, http = inject(HttpClient)) => {
    const url = () => `/api/programs/${store.programId()}/frequent-tasks`;
    return {
      load: rxMethod<string>(
        pipe(
          tap((programId) => patchState(store, { programId, tasks: [], loading: true, error: '' })),
          switchMap((programId) =>
            http.get<FrequentTask[]>(`/api/programs/${programId}/frequent-tasks`).pipe(
              tapResponse({
                next: (tasks) => patchState(store, { tasks }),
                error: () => patchState(store, { error: 'We could not load your frequently used tasks.' }),
                finalize: () => patchState(store, { loading: false }),
              }),
            ),
          ),
        ),
      ),
      save: rxMethod<{ name: string; educationalContentId: string | null }>(
        pipe(
          tap(({ name }) => patchState(store, { pending: [...store.pending(), taskKey(name)], error: '' })),
          mergeMap((task) =>
            http.post<FrequentTask>(url(), task).pipe(
              tapResponse({
                next: (saved) =>
                  patchState(store, {
                    tasks: [...store.tasks().filter(({ id }) => id !== saved.id), saved],
                  }),
                error: () => patchState(store, { error: 'We could not save that task. Please try again.' }),
                finalize: () =>
                  patchState(store, { pending: store.pending().filter((key) => key !== taskKey(task.name)) }),
              }),
            ),
          ),
        ),
      ),
      remove: rxMethod<string>(
        pipe(
          tap((id) => patchState(store, { pending: [...store.pending(), id], error: '' })),
          mergeMap((id) =>
            http.delete(`${url()}/${id}`).pipe(
              tapResponse({
                next: () => patchState(store, { tasks: store.tasks().filter((task) => task.id !== id) }),
                error: () => patchState(store, { error: 'We could not remove that task. Please try again.' }),
                finalize: () => patchState(store, { pending: store.pending().filter((key) => key !== id) }),
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
