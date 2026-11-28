import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

type EmailBlastState = {
  sending: boolean;
};

const initialState: EmailBlastState = {
  sending: false,
};

export type EmailCampaignAudience =
  | { type: 'users'; userIds: string[] }
  | { type: 'board'; boardId: string }
  | { type: 'program'; programId: string };

type SendEmailPayload = { subject: string; body: string; audience: EmailCampaignAudience };

export const EmailBlastStore = signalStore(
  withState(initialState),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    sendEmail: rxMethod<SendEmailPayload & { onSuccess: () => void }>(
      pipe(
        switchMap(({ onSuccess, ...payload }) => {
          patchState(store, { sending: true });
          return http.post('/api/users/send-email', payload).pipe(
            tapResponse({
              next: () => {
                patchState(store, { sending: false });
                snackBar.open('Campaign email sent successfully', undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
                onSuccess();
              },
              error: () => {
                patchState(store, { sending: false });
                snackBar.open('There was an error sending the email', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          );
        }),
      ),
    ),
  })),
);
