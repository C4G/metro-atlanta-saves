import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type WhatWeAre } from '@mas/prisma-client/browser';

type WhatWeAreState = {
  whatWeAre: WhatWeAre | null;
};

const initialState: WhatWeAreState = {
  whatWeAre: null,
};

const BASE_URL = '/api/what-we-are';

export const WhatWeAreStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getWhatWeAre: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<WhatWeAre>(BASE_URL).pipe(
            tapResponse({
              next: (whatWeAre) => {
                patchState(store, (state) => ({ ...state, whatWeAre }));
              },
              error: () => {
                snackBar.open('There was an error retrieving the section content', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchWhatWeAre: rxMethod<WhatWeAre>(
      pipe(
        switchMap((whatWeAre) =>
          http.patch<WhatWeAre>(BASE_URL, whatWeAre).pipe(
            tapResponse({
              next: (whatWeAre) => {
                patchState(store, (state) => ({ ...state, whatWeAre }));
                snackBar.open('Section has been updated', undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message?.[0] || 'There was an error updating the section', undefined, {
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
