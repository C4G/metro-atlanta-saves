import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Cohort } from '@prisma/client';
import { MatDialog } from '@angular/material/dialog';

type CohortsState = {
  cohorts: Cohort[];
  editCohortId: string;
};

const initialState: CohortsState = {
  cohorts: [],
  editCohortId: '',
};

const BASE_URL = '/api/cohorts';

export const CohortsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setEditCohortId: (editCohortId: string) => {
      patchState(store, (state) => ({ ...state, editCohortId }));
    },
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getCohorts: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Cohort[]>(BASE_URL).pipe(
            tapResponse({
              next: (cohorts) => {
                patchState(store, (state) => ({ ...state, cohorts }));
              },
              error: () => {
                snackBar.open('There was an error retreiving cohorts', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchCohort: rxMethod<Partial<Cohort> | FormData>(
      pipe(
        switchMap((cohort) =>
          http.patch<Cohort>(`${BASE_URL}/${store.editCohortId()}`, cohort).pipe(
            tapResponse({
              next: (cohort) => {
                patchState(store, (state) => ({
                  ...state,
                  cohorts: state.cohorts.map((a) => (a.id === cohort.id ? cohort : a)),
                }));
                store.setEditCohortId('');
                dialogRef.closeAll();
                snackBar.open(`${cohort.name} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the cohort`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addCohort: rxMethod<FormData>(
      pipe(
        switchMap((cohort) =>
          http.post<Cohort>(BASE_URL, cohort).pipe(
            tapResponse({
              next: (cohort) => {
                patchState(store, (state) => ({
                  ...state,
                  cohorts: [...state.cohorts, cohort],
                }));
                dialogRef.closeAll();
                snackBar.open(`${cohort.name} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the cohort`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteCohort: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Cohort>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (cohort) => {
                patchState(store, (state) => ({
                  ...state,
                  cohorts: state.cohorts.filter((p) => p.id !== cohort.id),
                }));
                snackBar.open(`${cohort.name} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the cohort`, undefined, {
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
