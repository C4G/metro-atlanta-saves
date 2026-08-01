import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ExtendedImage } from '@mas/models';

type ImagesState = {
  blob: Blob | null;
  type: string | null;
  images: ExtendedImage[];
};

const initialState: ImagesState = {
  blob: null,
  type: null,
  images: [],
};

const BASE_URL = '/api/images';

export const ImagesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getAllImages: rxMethod<{
      programId: string;
      userFilter?: string | null;
      checkpointFilter?: string | null;
    }>(
      pipe(
        switchMap(({ programId, userFilter, checkpointFilter }) => {
          let params = new HttpParams().set('programId', programId);

          // Handle user filter
          if (userFilter === 'unassigned') {
            params = params.set('unassignedUser', 'true');
          } else if (userFilter) {
            params = params.set('userId', userFilter);
          }

          // Handle checkpoint filter
          if (checkpointFilter === 'unassigned') {
            params = params.set('unassignedCheckpoint', 'true');
          } else if (checkpointFilter) {
            params = params.set('checkpointId', checkpointFilter);
          }

          return http.get<ExtendedImage[]>(BASE_URL, { params }).pipe(
            tapResponse({
              next: (images) => {
                patchState(store, { images });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error loading images`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          );
        }),
      ),
    ),
    getAllImagesForUser: rxMethod<{ programId: string; userId: string }>(
      pipe(
        switchMap(({ programId, userId }) =>
          http.get<ExtendedImage[]>(`${BASE_URL}?programId=${programId}&userId=${userId}`).pipe(
            tapResponse({
              next: (images) => {
                patchState(store, { images });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error loading images for the user`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    getImage: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.get(`${BASE_URL}/${id}`, { observe: 'response', responseType: 'blob' }).pipe(
            tapResponse({
              next: (resp) => {
                patchState(store, {
                  blob: resp.body,
                  type: resp.headers.get('Content-Type'),
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error loading the image`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addImages: rxMethod<{ form: FormData; programId: string; checkpointId?: string; cb?: () => void }>(
      pipe(
        switchMap(({ form, programId, checkpointId, cb }) => {
          let params = new HttpParams({
            fromObject: {
              programId,
            },
          });
          if (checkpointId) {
            params = params.append('checkpointId', checkpointId);
          }
          return http
            .post(BASE_URL, form, {
              params,
            })
            .pipe(
              tapResponse({
                next: () => {
                  dialogRef.closeAll();
                  snackBar.open(`Image(s) created successfully!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                  cb?.();
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error adding the image`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            );
        }),
      ),
    ),
    updateImageUserId: rxMethod<{ id: string; userId: string }>(
      pipe(
        switchMap(({ id, userId }) =>
          http.patch(`${BASE_URL}/${id}`, { userId }).pipe(
            tapResponse({
              next: () => {
                // Update the images array in the store with proper typing
                patchState(store, {
                  images: store.images().map((image) => {
                    if (image.id === id) {
                      const userInfo = store.images().find((img) => img.userId === userId)?.user || null;

                      return {
                        ...image,
                        userId,
                        user: userInfo,
                      };
                    }
                    return image;
                  }),
                });

                dialogRef.closeAll();
                snackBar.open(`Image has been updated!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the image`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),

    updateImageCheckpointId: rxMethod<{ id: string; checkpointId: string }>(
      pipe(
        switchMap(({ id, checkpointId }) =>
          http.patch(`${BASE_URL}/${id}`, { checkpointId }).pipe(
            tapResponse({
              next: () => {
                // Update the images array in the store
                patchState(store, {
                  images: store.images().map((image) => {
                    if (image.id === id) {
                      const checkpointInfo =
                        store.images().find((img) => img.checkpoint?.id === checkpointId)?.checkpoint || null;

                      return {
                        ...image,
                        checkpointId,
                        checkpoint: checkpointInfo,
                      };
                    }
                    return image;
                  }),
                });

                dialogRef.closeAll();
                snackBar.open(`Image checkpoint has been updated!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the image checkpoint`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),

    deleteImage: rxMethod<{ id: string; cb?: () => void }>(
      pipe(
        switchMap(({ id, cb }) =>
          http.delete(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: () => {
                patchState(store, { blob: null });
                dialogRef.closeAll();
                snackBar.open(`Image has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
                cb?.();
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the image`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    reset: () => patchState(store, { blob: null, type: null }),
  })),
);
