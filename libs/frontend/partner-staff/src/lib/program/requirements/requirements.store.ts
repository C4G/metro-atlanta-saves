import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Requirement } from '@mas/prisma-client/browser';
import { MatDialog } from '@angular/material/dialog';

export type AddRequirement = Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'programId'>;

type RequirementsState = {
  programId: string | null;
  requirements: Requirement[];
};

const initialState: RequirementsState = {
  programId: null,
  requirements: [],
};

const BASE_URL = '/api/requirements';

export const RequirementsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    programRequirement: computed(() => {
      if (!store.programId()) {
        return [];
      }
      return store.requirements().reduce<Requirement[]>((prev, curr) => {
        if (curr.programId === store.programId()) {
          return [...prev, curr];
        }
        return prev;
      }, []);
    }),
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    setProgramId: (programId: string) => {
      patchState(store, (state) => ({ ...state, programId }));
    },
    getRequirements: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Requirement[]>(`${BASE_URL}${'/program/' + store.programId()}`).pipe(
            tapResponse({
              next: (requirements) => {
                patchState(store, (state) => ({ ...state, requirements }));
              },
              error: () => {
                snackBar.open('There was an error retreiving requirements', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchRequirement: rxMethod<Partial<Requirement>>(
      pipe(
        switchMap((requirement) =>
          http.patch<Requirement>(`${BASE_URL}/${requirement.id}`, requirement).pipe(
            tapResponse({
              next: (requirement) => {
                patchState(store, (state) => ({
                  ...state,
                  requirements: state.requirements.map((a) => (a.id === requirement.id ? requirement : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${requirement.name} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the requirement`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addRequirement: rxMethod<AddRequirement>(
      pipe(
        switchMap((requirement) =>
          http.post<Requirement>(`${BASE_URL}/program/${store.programId()}`, requirement).pipe(
            tapResponse({
              next: (requirement) => {
                patchState(store, (state) => ({
                  ...state,
                  requirements: [...state.requirements, requirement],
                }));
                dialogRef.closeAll();
                snackBar.open(`${requirement.name} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the requirement`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteRequirement: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Requirement>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (requirement) => {
                patchState(store, (state) => ({
                  ...state,
                  requirements: state.requirements.filter((p) => p.id !== requirement.id),
                }));
                snackBar.open(`${requirement.name} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the requirement`, undefined, {
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
