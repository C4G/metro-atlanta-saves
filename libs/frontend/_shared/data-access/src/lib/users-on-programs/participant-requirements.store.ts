import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParticipantRequirement } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, finalize, mergeMap, pipe, switchMap, tap } from 'rxjs';

export const ParticipantRequirementsStore = signalStore(
  withState({
    requirements: [] as ParticipantRequirement[],
    savingTaskIds: [] as string[],
    loading: false,
    loadFailed: false,
  }),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, loadFailed: false })),
        switchMap(() =>
          http.get<ParticipantRequirement[]>('/api/users-on-programs/user/requirements').pipe(
            tapResponse({
              next: (requirements) => patchState(store, { requirements }),
              error: () => patchState(store, { loadFailed: true }),
              finalize: () => patchState(store, { loading: false }),
            }),
          ),
        ),
      ),
    ),
    complete: rxMethod<ParticipantRequirement>(
      pipe(
        filter((task) => task.canComplete && !task.isCompleted && !store.savingTaskIds().includes(task.id)),
        tap((task) => patchState(store, { savingTaskIds: [...store.savingTaskIds(), task.id] })),
        mergeMap((task) =>
          http
            .post(`/api/users-on-programs/user/program/${task.programId}/requirements/${task.id}/completion`, {})
            .pipe(
              tapResponse({
                next: () =>
                  patchState(store, {
                    requirements: store
                      .requirements()
                      .map((requirement) =>
                        requirement.id === task.id ? { ...requirement, isCompleted: true } : requirement,
                      ),
                  }),
                error: () =>
                  snackBar.open('We could not update this task. Please try again.', undefined, { duration: 5000 }),
              }),
              finalize(() =>
                patchState(store, { savingTaskIds: store.savingTaskIds().filter((id) => id !== task.id) }),
              ),
            ),
        ),
      ),
    ),
  })),
);
