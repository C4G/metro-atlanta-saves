import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import type { User } from '@mas/prisma-client/browser';

type AlliesState = {
  programId: string | null;
  allies: Array<{
    userId: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    lastLogin: string | null;
    bio: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
};

const initialState: AlliesState = {
  programId: null,
  allies: [],
};

export const AlliesOnProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ allies }) => ({
    alliesCount: computed<number>(() => allies()?.length ?? 0),
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    setProgramId: (programId: string) => {
      patchState(store, (state) => ({ ...state, programId }));
    },
    getAllies: rxMethod<void>(
      pipe(
        switchMap(() =>
          http
            .get<
              (User & { createdAt?: string | null; updatedAt?: string | null })[]
            >(`/api/allies-on-programs/program/${store.programId()}`)
            .pipe(
              tapResponse({
                next: (allies) => {
                  const mapped = allies.map((a) => ({
                    userId: a.id,
                    id: a.id,
                    email: a.email,
                    firstName: a.firstName,
                    lastName: a.lastName,
                    lastLogin: a.lastLogin ? new Date(a.lastLogin).toISOString() : null,
                    bio: a.bio,
                    createdAt: a.createdAt ? new Date(a.createdAt as unknown as string).toISOString() : null,
                    updatedAt: a.updatedAt ? new Date(a.updatedAt as unknown as string).toISOString() : null,
                  }));
                  patchState(store, (state) => ({ ...state, allies: mapped }));
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error?.message?.[0] || 'There was an error retrieving allies', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
        ),
      ),
    ),
    addAlly: rxMethod<{ userId: string }>(
      pipe(
        switchMap((payload) =>
          http.post<User>(`/api/allies-on-programs`, { ...payload, programId: store.programId() }).pipe(
            tapResponse({
              next: (user) => {
                const mapped = {
                  userId: user.id,
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
                  bio: user.bio,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                patchState(store, (state) => ({ ...state, allies: [...state.allies, mapped] }));
                dialogRef.closeAll();
                snackBar.open(`${mapped.firstName} ${mapped.lastName} added as an ally`, undefined, {
                  panelClass: 'success',
                  duration: 4000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error?.message?.[0] || 'There was an error adding the ally', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteAlly: rxMethod<string>(
      pipe(
        switchMap((userId) =>
          http.delete<User>(`/api/allies-on-programs/user/${userId}/program/${store.programId()}`).pipe(
            tapResponse({
              next: (user) => {
                patchState(store, (state) => ({ ...state, allies: state.allies.filter((a) => a.userId !== user.id) }));
                snackBar.open(`${user.firstName} ${user.lastName} removed as an ally`, undefined, {
                  panelClass: 'success',
                  duration: 4000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error?.message?.[0] || 'There was an error deleting the ally', undefined, {
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
