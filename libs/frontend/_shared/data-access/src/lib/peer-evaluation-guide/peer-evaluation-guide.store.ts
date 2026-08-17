import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type PeerEvaluationGuide } from '@mas/prisma-client/browser';

type PeerEvaluationGuideState = {
  peerEvaluationGuide: PeerEvaluationGuide | null;
};

const initialState: PeerEvaluationGuideState = {
  peerEvaluationGuide: null,
};

const BASE_URL = '/api/peer-evaluation-guide';

export const PeerEvaluationGuideStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    getPeerEvaluationGuide: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<PeerEvaluationGuide>(BASE_URL).pipe(
            tapResponse({
              next: (peerEvaluationGuide) => {
                patchState(store, (state) => ({ ...state, peerEvaluationGuide }));
              },
              error: () => {
                snackBar.open('There was an error retrieving the peer evaluation guide', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchPeerEvaluationGuide: rxMethod<PeerEvaluationGuide>(
      pipe(
        switchMap((peerEvaluationGuide) =>
          http.patch<PeerEvaluationGuide>(BASE_URL, peerEvaluationGuide).pipe(
            tapResponse({
              next: (peerEvaluationGuide) => {
                patchState(store, (state) => ({ ...state, peerEvaluationGuide }));
                snackBar.open('Peer evaluation guide has been updated', undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(
                  resp.error.message?.[0] || 'There was an error updating the peer evaluation guide',
                  undefined,
                  { panelClass: 'error', duration: 5000 },
                );
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
