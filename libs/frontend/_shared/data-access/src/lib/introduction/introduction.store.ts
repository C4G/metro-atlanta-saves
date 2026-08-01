import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Introduction } from '@prisma/client';

type IntroductionState = {
  introduction: Introduction;
};

const initialState: IntroductionState = {
  introduction: {
    id: '-1',
    title: 'BUILDING RESILIENT PROFESSIONALS',
    imageUrl: '/assets/background/atlanta-cohort.webp',
    imageText: 'Atlanta Cohort Graduates',
    hidden: false,
    imageHidden: false,
  },
};

const BASE_URL = '/api/introduction';

export const IntroductionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getIntroduction: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Introduction>(BASE_URL).pipe(
            tapResponse({
              next: (introduction) => {
                patchState(store, (state) => ({ ...state, introduction }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the introduction', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchIntroduction: rxMethod<FormData | Introduction>(
      pipe(
        switchMap((introduction) =>
          http.patch<Introduction>(`${BASE_URL}`, introduction).pipe(
            tapResponse({
              next: (introduction) => {
                patchState(store, (state) => ({
                  ...state,
                  introduction,
                }));
                snackBar.open(`introduction has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the introduction`, undefined, {
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
