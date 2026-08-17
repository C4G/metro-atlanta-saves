import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Partner } from '@mas/prisma-client/browser';
import { MatDialog } from '@angular/material/dialog';

type AddPartner = Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>;

type PartnersState = {
  partners: Partner[];
};

const initialState: PartnersState = {
  partners: [],
};

const BASE_URL = '/api/partners';

export const PartnersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getPartners: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Partner[]>(BASE_URL).pipe(
            tapResponse({
              next: (partners) => {
                patchState(store, (state) => ({ ...state, partners }));
              },
              error: () => {
                snackBar.open('There was an error retreiving partners', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchPartner: rxMethod<Partial<Partner>>(
      pipe(
        switchMap((partner) =>
          http.patch<Partner>(`${BASE_URL}/${partner.id}`, partner).pipe(
            tapResponse({
              next: (partner) => {
                patchState(store, (state) => ({
                  ...state,
                  partners: state.partners.map((a) => (a.id === partner.id ? partner : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${partner.name} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the partner`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addPartner: rxMethod<AddPartner>(
      pipe(
        switchMap((partner) =>
          http.post<Partner>(`${BASE_URL}`, partner).pipe(
            tapResponse({
              next: (partner) => {
                patchState(store, (state) => ({
                  ...state,
                  partners: [...state.partners, partner],
                }));
                dialogRef.closeAll();
                snackBar.open(`${partner.name} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the partner`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deletePartner: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Partner>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (partner) => {
                patchState(store, (state) => ({
                  ...state,
                  partners: state.partners.filter((p) => p.id !== partner.id),
                }));
                snackBar.open(`${partner.name} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the partner`, undefined, {
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
