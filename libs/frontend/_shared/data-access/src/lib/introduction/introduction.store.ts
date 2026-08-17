import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Introduction } from '@mas/prisma-client/browser';

export type IntroductionConfig = Introduction & {
  titleEnding: string;
};

type IntroductionState = {
  introduction: IntroductionConfig;
};

const initialState: IntroductionState = {
  introduction: {
    id: '-1',
    title: 'Financial wellbeing programs for Atlanta communities',
    titleEnding: 'Financial Wellbeing Alliance',
    imageUrl: '/assets/background/atlanta-cohort.webp',
    imageText: 'Financial Wellbeing Alliance participants pose together in front of graduation decorations',
    hidden: false,
    imageHidden: false,
  },
};

const BASE_URL = '/api/introduction';

export const IntroductionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setIntroduction: (introduction: IntroductionConfig) => patchState(store, { introduction }),
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getIntroduction: rxMethod<void>(
      pipe(
        filter(() => store.introduction().id === '-1'),
        switchMap(() =>
          http.get<IntroductionConfig>(BASE_URL).pipe(
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
    patchIntroduction: rxMethod<FormData | IntroductionConfig>(
      pipe(
        switchMap((introduction) =>
          http.patch<IntroductionConfig>(`${BASE_URL}`, introduction).pipe(
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
