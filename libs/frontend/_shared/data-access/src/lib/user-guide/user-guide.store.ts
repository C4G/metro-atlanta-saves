import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type UserGuide } from '@prisma/client';

type UserGuideState = {
  userGuide: UserGuide | null;
};

const initialState: UserGuideState = {
  userGuide: null,
};

const BASE_URL = '/api/user-guide';

export const UserGuideStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getUserGuide: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<UserGuide>(BASE_URL).pipe(
            tapResponse({
              next: (userGuide) => {
                patchState(store, (state) => ({ ...state, userGuide }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the userGuide', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchUserGuide: rxMethod<UserGuide>(
      pipe(
        switchMap((userGuide) =>
          http.patch<UserGuide>(`${BASE_URL}`, userGuide).pipe(
            tapResponse({
              next: (userGuide) => {
                patchState(store, (state) => ({
                  ...state,
                  userGuide,
                }));
                snackBar.open(`user guide has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the user guide`, undefined, {
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
