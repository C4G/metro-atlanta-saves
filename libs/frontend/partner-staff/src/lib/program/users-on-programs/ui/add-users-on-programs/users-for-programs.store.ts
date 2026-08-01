import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SearchableType } from '@mas/frontend-shared-components';
import { UsersNamesOnly } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';

type UsersForProgramsState = {
  users: UsersNamesOnly[];
};

const initialState: UsersForProgramsState = {
  users: [],
};

const BASE_URL = '/api/users';

export const UsersForProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ users }) => ({
    usersAsLabelValues: computed<SearchableType[]>(() =>
      users().map((user) => ({ label: `${user.firstName} ${user.lastName} (${user.email})`, value: user.id })),
    ),
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getUsers: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<UsersNamesOnly[]>(`${BASE_URL}/names`).pipe(
            tapResponse({
              next: (users) => {
                patchState(store, (state) => ({ ...state, users }));
              },
              error: () => {
                snackBar.open('There was an error retreiving users', undefined, {
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
