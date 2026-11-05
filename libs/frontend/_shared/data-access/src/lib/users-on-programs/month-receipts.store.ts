import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { ExtendedImage } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, of, pipe, switchMap, tap } from 'rxjs';

type ReceiptContext = { programId: string; checkpointId: string; userId: string };

type MonthReceiptsState = {
  receipts: ExtendedImage[];
  loading: boolean;
  uploading: boolean;
  loadFailed: boolean;
  error: string;
  notice: string;
  receiptCheckpointId: string;
  deletingId: string;
};

const initialState: MonthReceiptsState = {
  receipts: [],
  loading: false,
  uploading: false,
  loadFailed: false,
  error: '',
  notice: '',
  receiptCheckpointId: '',
  deletingId: '',
};

export const MonthReceiptsStore = signalStore(
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    reset: () =>
      patchState(store, {
        receipts: [],
        loadFailed: false,
        error: '',
        notice: '',
        receiptCheckpointId: '',
        deletingId: '',
      }),
    load: rxMethod<ReceiptContext>(
      pipe(
        switchMap((context) => {
          patchState(store, { receipts: [], loading: true, loadFailed: false });
          const { checkpointId, ...owner } = context;
          const params = new HttpParams({ fromObject: owner }).set(
            checkpointId ? 'checkpointId' : 'unassignedCheckpoint',
            checkpointId || 'true',
          );
          return http.get<ExtendedImage[]>('/api/images', { params }).pipe(
            tapResponse({
              next: (receipts) => patchState(store, { receipts }),
              error: () => patchState(store, { loadFailed: true }),
              finalize: () => patchState(store, { loading: false }),
            }),
          );
        }),
      ),
    ),
    upload: rxMethod<ReceiptContext & { files: File[]; monthName?: string }>(
      pipe(
        exhaustMap(({ files, userId, monthName, ...context }) => {
          void userId;
          const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
          if (!files.length) return [];
          if (files.some((file) => !allowed.includes(file.type) || file.size > 5_242_880)) {
            patchState(store, { error: 'Choose JPG, PNG, WebP, or PDF files, each no larger than 5 MB.', notice: '' });
            return [];
          }
          const form = new FormData();
          for (const file of files) form.append('files', file);
          patchState(store, { uploading: true, error: '', notice: '' });
          const checkpointId = context.checkpointId || store.receiptCheckpointId();
          const checkpoint = checkpointId
            ? of({ id: checkpointId })
            : http.post<{ id: string }>(
                `/api/checkpoints/my/program/${context.programId}/month/${encodeURIComponent(monthName || '')}/receipt-checkpoint`,
                {},
              );
          return checkpoint.pipe(
            tap(({ id }) => patchState(store, { receiptCheckpointId: id })),
            switchMap(({ id }) =>
              http.post<ExtendedImage[]>('/api/images', form, {
                params: new HttpParams({ fromObject: { programId: context.programId, checkpointId: id } }),
              }),
            ),
            tapResponse({
              next: (receipts) => patchState(store, { receipts: [...store.receipts(), ...receipts], notice: '' }),
              error: () =>
                patchState(store, {
                  error: 'We could not upload your receipts. Please choose the files again to retry.',
                }),
              finalize: () => patchState(store, { uploading: false }),
            }),
          );
        }),
      ),
    ),
    remove: rxMethod<string>(
      pipe(
        exhaustMap((id) => {
          patchState(store, { deletingId: id, error: '', notice: '' });
          return http.delete(`/api/images/${id}`).pipe(
            tapResponse({
              next: () =>
                patchState(store, {
                  receipts: store.receipts().filter((receipt) => receipt.id !== id),
                  notice: '',
                }),
              error: () =>
                patchState(store, {
                  error:
                    'We could not delete this receipt. It may have been verified. Please try again or contact your program team.',
                }),
              finalize: () => patchState(store, { deletingId: '' }),
            }),
          );
        }),
      ),
    ),
    download: rxMethod<{ id: string; onDownloaded: (blob: Blob) => void }>(
      pipe(
        exhaustMap(({ id, onDownloaded }) =>
          http.get(`/api/images/${id}`, { responseType: 'blob' }).pipe(
            tapResponse({
              next: onDownloaded,
              error: () => patchState(store, { error: 'We could not download this receipt. Please try again.' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
