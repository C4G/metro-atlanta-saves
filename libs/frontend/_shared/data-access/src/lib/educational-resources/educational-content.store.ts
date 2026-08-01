import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EducationalContentWithCategories, NotificationConfig } from '@mas/models';
import { MatDialog } from '@angular/material/dialog';

type ContentState = {
  contentList: EducationalContentWithCategories[];
  notificationConfig: NotificationConfig | null;
};

const initialState: ContentState = {
  contentList: [],
  notificationConfig: null,
};

const BASE_URL = '/api/educational-content';

export const EducationalContentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getContentList: rxMethod<string[]>(
      pipe(
        switchMap((selectedCategories) =>
          http
            .get<EducationalContentWithCategories[]>(`${BASE_URL}`, {
              params: selectedCategories.length
                ? new HttpParams({
                    fromObject: {
                      categoryIds: selectedCategories.join(','),
                    },
                  })
                : undefined,
            })
            .pipe(
              tapResponse({
                next: (data) => {
                  patchState(store, (state) => ({ ...state, contentList: data }));
                },
                error: () => {
                  snackBar.open('There was an error while fetching the data...', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
        ),
      ),
    ),
    addContent: rxMethod<Partial<FormData>>(
      pipe(
        switchMap((content) =>
          http.post<EducationalContentWithCategories>(`${BASE_URL}`, content).pipe(
            tapResponse({
              next: (content) => {
                patchState(store, (state) => ({
                  ...state,
                  contentList: [...state.contentList, content],
                }));
                dialogRef.closeAll();
                snackBar.open(`${content.title} has been added`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the content`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchContent: rxMethod<[string, FormData]>(
      pipe(
        switchMap(([id, content]) =>
          http.patch<EducationalContentWithCategories>(`${BASE_URL}/${id}`, content).pipe(
            tapResponse({
              next: (content) => {
                patchState(store, (state) => ({
                  ...state,
                  contentList: state.contentList.map((a) => (a.id === content.id ? content : a)),
                }));
                dialogRef.closeAll();
                snackBar.open(`${content.title} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the content`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteContent: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<void>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: () => {
                patchState(store, (state) => ({
                  ...state,
                  contentList: state.contentList.filter((a) => a.id !== id),
                }));
                snackBar.open(`Content has been deleted`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the content`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    getNotificationConfig: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<NotificationConfig | null>(`${BASE_URL}/notification-config`).pipe(
            tapResponse({
              next: (notificationConfig) => {
                patchState(store, (state) => ({ ...state, notificationConfig }));
              },
              error: () => {
                snackBar.open('There was an error loading the notification configuration', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    saveNotificationConfig: rxMethod<{ heading: string; body: string; programId?: string; userId?: string }>(
      pipe(
        switchMap((payload) =>
          http.put<NotificationConfig>(`${BASE_URL}/notification-config`, payload).pipe(
            tapResponse({
              next: (notificationConfig) => {
                patchState(store, (state) => ({ ...state, notificationConfig }));
                snackBar.open('Notification configuration saved', undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(
                  resp.error.message[0] || `There was an error saving the notification configuration`,
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
  })),
);
