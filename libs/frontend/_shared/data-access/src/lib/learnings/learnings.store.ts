import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Learning } from '@mas/prisma-client/browser';
import { MatDialog } from '@angular/material/dialog';

type AddLearning = Omit<Learning, 'id' | 'createdAt' | 'updatedAt' | 'hidden'>;

type LearningsState = {
  learnings: Learning[];
  sectionHiddenOverride: boolean;
};

const initialState: LearningsState = {
  learnings: [],
  sectionHiddenOverride: false,
};

const BASE_URL = '/api/learnings';

export const LearningsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    sectionHidden: computed(() => store.sectionHiddenOverride() || store.learnings().length === 0),
  })),
  withMethods((store) => ({
    setSectionHidden: (hidden: boolean) => {
      patchState(store, { sectionHiddenOverride: hidden });
    },
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getLearnings: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Learning[]>(BASE_URL).pipe(
            tapResponse({
              next: (learnings) => {
                patchState(store, (state) => ({ ...state, learnings }));
              },
              error: () => {
                snackBar.open('There was an error retreiving learnings', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    getLearning: rxMethod<string>(
      pipe(
        switchMap((slug: string) =>
          http.get<Learning>(`${BASE_URL}/slug/${slug}`).pipe(
            tapResponse({
              next: (learning) => {
                patchState(store, (state) => ({ ...state, learning }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the learning', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchLearning: rxMethod<Partial<Learning>>(
      pipe(
        switchMap((learning) =>
          http.patch<Learning>(`${BASE_URL}/${learning.id}`, learning).pipe(
            tapResponse({
              next: (learning) => {
                patchState(store, (state) => ({
                  ...state,
                  learnings: state.learnings.map((a) => (a.id === learning.id ? learning : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${learning.title} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the learning`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addLearning: rxMethod<AddLearning>(
      pipe(
        switchMap((learning) =>
          http.post<Learning>(BASE_URL, learning).pipe(
            tapResponse({
              next: (learning) => {
                patchState(store, (state) => ({
                  ...state,
                  learnings: [...state.learnings, learning],
                }));
                dialogRef.closeAll();
                snackBar.open(`${learning.title} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the learning`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteLearning: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Learning>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (learning) => {
                patchState(store, (state) => ({
                  ...state,
                  learnings: state.learnings.filter((p) => p.id !== learning.id),
                }));
                snackBar.open(`${learning.title} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the learning`, undefined, {
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
