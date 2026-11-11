import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { TaskReviewStore } from '@mas/frontend-shared-data-access';
import { ExtendedImage } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, mergeMap, pipe, switchMap, tap } from 'rxjs';

type ProgramDocumentsState = {
  programId: string;
  images: ExtendedImage[];
  loading: boolean;
  loadFailed: boolean;
  assigning: string[];
  uploading: boolean;
  error: string;
};

const initialState: ProgramDocumentsState = {
  programId: '',
  images: [],
  loading: false,
  loadFailed: false,
  assigning: [],
  uploading: false,
  error: '',
};

const BASE_URL = '/api/images';

export const fileKind = (type: string) => (type.includes('pdf') ? 'PDF' : type.startsWith('image/') ? 'IMG' : 'DOC');

export const ProgramDocumentsStore = signalStore(
  withState(initialState),
  withComputed(({ images, assigning }, review = inject(TaskReviewStore)) => {
    const newestFirst = computed(() =>
      [...images()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    );
    return {
      unsorted: computed(() =>
        newestFirst()
          .filter((image) => image.userId && !image.checkpointId)
          .map((image) => ({
            id: image.id,
            name: image.name,
            who: image.user ? `${image.user.firstName} ${image.user.lastName}`.trim() : 'Participant',
            isAssigning: assigning().includes(image.id),
          })),
      ),
      library: computed(() =>
        newestFirst()
          .filter((image) => !image.userId)
          .map((image) => ({ id: image.id, name: image.name, kind: fileKind(image.type) })),
      ),
      monthOptions: computed(() => review.months().map(({ number, name }) => ({ number, name }))),
    };
  }),
  withMethods((store, http = inject(HttpClient)) => {
    const fetchAll = (programId: string) =>
      http.get<ExtendedImage[]>(BASE_URL, { params: new HttpParams().set('programId', programId) }).pipe(
        tapResponse({
          next: (images) => patchState(store, { images }),
          error: () => patchState(store, { loadFailed: true }),
          finalize: () => patchState(store, { loading: false }),
        }),
      );
    return {
      load: rxMethod<string>(
        pipe(
          tap((programId) => patchState(store, { programId, images: [], loading: true, loadFailed: false, error: '' })),
          switchMap(fetchAll),
        ),
      ),
      assign: rxMethod<{ imageId: string; month: number }>(
        pipe(
          tap(({ imageId }) => patchState(store, { assigning: [...store.assigning(), imageId], error: '' })),
          mergeMap(({ imageId, month }) =>
            http.patch<ExtendedImage>(`${BASE_URL}/${imageId}/month`, { month }).pipe(
              tapResponse({
                next: (updated) =>
                  patchState(store, {
                    images: store
                      .images()
                      .map((image) =>
                        image.id === imageId ? { ...image, checkpointId: updated.checkpointId } : image,
                      ),
                  }),
                error: () => patchState(store, { error: 'We could not file that receipt. Please try again.' }),
                finalize: () => patchState(store, { assigning: store.assigning().filter((id) => id !== imageId) }),
              }),
            ),
          ),
        ),
      ),
      upload: rxMethod<File[]>(
        pipe(
          tap(() => patchState(store, { uploading: true, error: '' })),
          exhaustMap((files) => {
            const form = new FormData();
            files.forEach((file) => form.append('images', file));
            const programId = store.programId();
            return http.post(BASE_URL, form, { params: new HttpParams().set('programId', programId) }).pipe(
              switchMap(() => fetchAll(programId)),
              tapResponse({
                next: () => undefined,
                error: () => patchState(store, { error: 'We could not upload those files. Please try again.' }),
                finalize: () => patchState(store, { uploading: false }),
              }),
            );
          }),
        ),
      ),
      download: rxMethod<{ id: string; onReady: (blob: Blob) => void }>(
        pipe(
          mergeMap(({ id, onReady }) =>
            http.get(`${BASE_URL}/${id}`, { responseType: 'blob' }).pipe(
              tapResponse({
                next: onReady,
                error: () => patchState(store, { error: 'We could not download that file. Please try again.' }),
              }),
            ),
          ),
        ),
      ),
    };
  }),
);
