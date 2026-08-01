import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserFull } from '@mas/models';
import { MatDialog } from '@angular/material/dialog';

type UsersState = {
  user: UserFull | null;
  users: UserFull[];
};

type AddUser = Pick<UserFull, 'firstName' | 'lastName' | 'email'>;

const initialState: UsersState = {
  user: null,
  users: [],
};

const BASE_URL = '/api/users';

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    addUser: rxMethod<AddUser>(
      pipe(
        switchMap((user) =>
          http.post<UserFull>(`${BASE_URL}`, user).pipe(
            tapResponse({
              next: (user) => {
                patchState(store, (state) => ({
                  ...state,
                  users: [...state.users, user],
                }));
                dialogRef.closeAll();
                snackBar.open(`${user.firstName} ${user.lastName} has been added`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp) => {
                const serverMsg =
                  (resp as unknown as { error?: { message?: unknown } })?.error?.message ??
                  (resp as unknown as { error?: unknown })?.error ??
                  undefined;
                snackBar.open(
                  Array.isArray(serverMsg) ? serverMsg[0] : (serverMsg ?? 'There was an error adding the user'),
                  undefined,
                  {
                    panelClass: 'error',
                    duration: 5000,
                  },
                );
              },
            }),
          ),
        ),
      ),
    ),
    getUsers: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<UserFull[]>(BASE_URL).pipe(
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
    getUser: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.get<UserFull>(`${BASE_URL}/names/${id}`).pipe(
            tapResponse({
              next: (user) => {
                patchState(store, (state) => ({ ...state, user }));
              },
              error: () => {
                snackBar.open('There was an error retreiving the user', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchUser: rxMethod<Partial<UserFull>>(
      pipe(
        switchMap((user) =>
          http.patch<UserFull>(`${BASE_URL}/${user.id}`, user).pipe(
            tapResponse({
              next: (user) => {
                patchState(store, (state) => ({
                  ...state,
                  users: state.users.map((a) => (a.id === user.id ? user : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${user.firstName} ${user.lastName} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: () => {
                snackBar.open(`There was an error updating the user`, undefined, {
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
