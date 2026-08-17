import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Checkpoint } from '@mas/prisma-client/browser';
import { MatDialog } from '@angular/material/dialog';
import { formatDate } from '@angular/common';

type AddCheckpoint = Omit<Checkpoint, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'programId'>;

type CheckpointState = {
  programId: string | null;
  userId: string | null;
  checkpoints: Checkpoint[];
};

const initialState: CheckpointState = {
  programId: null,
  userId: null,
  checkpoints: [],
};

const BASE_URL = '/api/checkpoints';

export const CheckpointsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    creditScoreChange: computed(() => {
      const checkpoints = store.checkpoints();
      if (!checkpoints.length || checkpoints.length === 1) {
        return 0;
      }
      return (checkpoints.at(-1)?.creditScore ?? 0) - (checkpoints.at(0)?.creditScore ?? 0);
    }),
  })),
  withMethods((store) => ({
    getBaseUrl: () => `${BASE_URL}/program/${store.programId()}/user/${store.userId()}`,
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      snackBar = inject(MatSnackBar),
      dialogRef = inject(MatDialog),
      locale = inject(LOCALE_ID),
    ) => ({
      setProgramId: (programId: string) => {
        patchState(store, (state) => ({ ...state, programId }));
      },
      setUserId: (userId: string) => {
        patchState(store, (state) => ({ ...state, userId }));
      },
      getCheckpoints: rxMethod<void>(
        pipe(
          switchMap(() =>
            http.get<Checkpoint[]>(store.getBaseUrl()).pipe(
              tapResponse({
                next: (checkpoints) => {
                  patchState(store, (state) => ({ ...state, checkpoints }));
                },
                error: () => {
                  snackBar.open('There was an error retreiving checkpoints', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      patchCheckpoint: rxMethod<Partial<Checkpoint>>(
        pipe(
          switchMap((checkpoint) =>
            http
              .patch<Checkpoint>(`${BASE_URL}/${checkpoint.id}`, {
                ...checkpoint,
                programId: store.programId(),
                userId: store.userId(),
              })
              .pipe(
                tapResponse({
                  next: (checkpoint) => {
                    patchState(store, (state) => ({
                      ...state,
                      checkpoints: state.checkpoints.map((a) => (a.id === checkpoint.id ? checkpoint : a)),
                    }));
                    dialogRef.closeAll();
                    snackBar.open(
                      `${formatDate(checkpoint.createdAt, 'MM-dd-yyyy', locale)} has been updated`,
                      undefined,
                      {
                        panelClass: 'success',
                        duration: 5000,
                      },
                    );
                  },
                  error: (resp: HttpErrorResponse) => {
                    snackBar.open(resp.error.message[0] || `There was an error updating the checkpoint`, undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      ),
      addCheckpoint: rxMethod<AddCheckpoint>(
        pipe(
          switchMap((checkpoint) =>
            http
              .post<Checkpoint>(`${BASE_URL}`, { ...checkpoint, programId: store.programId(), userId: store.userId() })
              .pipe(
                tapResponse({
                  next: (checkpoint) => {
                    patchState(store, (state) => ({
                      ...state,
                      checkpoints: [...state.checkpoints, checkpoint],
                    }));
                    dialogRef.closeAll();
                    snackBar.open(
                      `${formatDate(
                        checkpoint.createdAt,
                        'MM-dd-yyyy',
                        locale,
                      )} has been added to the checkpoints checkpoints!`,
                      undefined,
                      {
                        panelClass: 'success',
                        duration: 5000,
                      },
                    );
                  },
                  error: (resp: HttpErrorResponse) => {
                    snackBar.open(resp.error.message[0] || `There was an error creating the checkpoint`, undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      ),
      deleteCheckpoint: rxMethod<string>(
        pipe(
          switchMap((id) =>
            http.delete<Checkpoint>(`${BASE_URL}/${id}`).pipe(
              tapResponse({
                next: (checkpoint) => {
                  patchState(store, (state) => ({
                    ...state,
                    checkpoints: state.checkpoints.filter((p) => p.id !== checkpoint.id),
                  }));
                  snackBar.open(
                    `${formatDate(
                      checkpoint.createdAt,
                      'MM-dd-yyyy',
                      locale,
                    )} has been removed from the users checkpoints!`,
                    undefined,
                    {
                      panelClass: 'success',
                      duration: 5000,
                    },
                  );
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error deleting the checkpoint`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
