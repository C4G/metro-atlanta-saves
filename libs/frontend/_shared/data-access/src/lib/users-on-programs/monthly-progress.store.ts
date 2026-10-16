import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExtendedCheckpoint } from '@mas/models';
import { CheckpointName } from '@mas/prisma-client/browser';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap } from 'rxjs';

type ProgressResponse = { checkpointNames: CheckpointName[]; checkpoints: ExtendedCheckpoint[] };
type ProgressSubmission = {
  name: string;
  savedMoney: number;
  creditScore: number | null;
  application: string;
  onSaved: () => void;
};

export const MonthlyProgressStore = signalStore(
  withState({
    programId: null as string | null,
    checkpointNames: [] as CheckpointName[],
    checkpoints: [] as ExtendedCheckpoint[],
    loading: false,
    loadFailed: false,
    saving: false,
    saveError: '',
  }),
  withComputed((store) => ({
    months: computed(() =>
      store
        .checkpointNames()
        .filter((item) => item.type === 'Savings' || /^month\s+\d+$/i.test(item.name.trim()))
        .sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map((item) => {
          const entries = store.checkpoints().filter((checkpoint) => checkpoint.name === item.name);
          const checkpoint = entries[0] ?? null;
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
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
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
