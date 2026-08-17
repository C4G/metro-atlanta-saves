import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Description } from '@mas/prisma-client/browser';

type DescriptionState = {
  description: Description | null;
};

const initialState: DescriptionState = {
  description: null,
};

const BASE_URL = '/api/description';

export const DescriptionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getDescription: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Description>(BASE_URL).pipe(
            tapResponse({
              next: (description) => {
                patchState(store, (state) => ({ ...state, description }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the description', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchDescription: rxMethod<FormData | Description>(
      pipe(
        switchMap((description) =>
          http.patch<Description>(`${BASE_URL}`, description).pipe(
            tapResponse({
              next: (description) => {
                patchState(store, (state) => ({
                  ...state,
                  description,
                }));
                snackBar.open(`description has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the description`, undefined, {
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
