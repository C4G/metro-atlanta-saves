import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { CheckpointName, Prisma } from '@prisma/client';
import { pipe, switchMap } from 'rxjs';

type ProgramWithCheckpointNames = Prisma.ProgramGetPayload<{
  include: {
    checkpointNames: true;
  };
}>;

type CheckpointNamesState = {
  checkpointNames: CheckpointName[];
};

const initialState: CheckpointNamesState = {
  checkpointNames: [],
};

const BASE_URL = '/api/checkpoint-names';

export const CheckpointNamesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getCheckpointNames: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<CheckpointName[]>(BASE_URL).pipe(
            tapResponse({
              next: (checkpointNames) => {
                patchState(store, (state) => ({ ...state, checkpointNames }));
              },
              error: () => {
                snackBar.open('There was an error retrieving checkpoint names', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    getCheckpointNamesForProgram: rxMethod<string>(
      pipe(
        switchMap((programId) =>
          http.get<ProgramWithCheckpointNames>(`${BASE_URL}/${programId}`).pipe(
            tapResponse({
              next: ({ checkpointNames }) => {
                patchState(store, (state) => ({ ...state, checkpointNames }));
              },
              error: () => {
                snackBar.open('There was an error retrieving checkpoint names', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addName: rxMethod<CheckpointName>(
      pipe(
        switchMap((body) =>
          http.post<CheckpointName>(BASE_URL, body).pipe(
            tapResponse({
              next: (checkpointName) => {
                dialogRef.closeAll();
                snackBar.open(`Checkpoint Name has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
                patchState(store, (state) => ({ checkpointNames: [...state.checkpointNames, checkpointName] }));
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error adding the checkpoint name`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchName: rxMethod<{ oldName: string; checkpointName: CheckpointName }>(
      pipe(
        switchMap(({ oldName, checkpointName }) =>
          http.patch<CheckpointName>(`${BASE_URL}/${oldName}`, checkpointName).pipe(
            tapResponse({
              next: (checkpointName) => {
                dialogRef.closeAll();
                snackBar.open(`Checkpoint Name has been updated!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
                patchState(store, (state) => ({
                  checkpointNames: state.checkpointNames.map((n) => (n.name === oldName ? checkpointName : n)),
                }));
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error adding the checkpoint name`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteName: rxMethod<string>(
      pipe(
        switchMap((name) =>
          http.delete(`${BASE_URL}/${name}`).pipe(
            tapResponse({
              next: () => {
                patchState(store, { checkpointNames: store.checkpointNames().filter((n) => n.name !== name) });
                dialogRef.closeAll();
                snackBar.open(`${name} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting ${name}`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
