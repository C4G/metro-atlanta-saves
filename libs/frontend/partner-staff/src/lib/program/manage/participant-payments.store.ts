import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { ParticipantPayment } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap, tap } from 'rxjs';

export type PaymentForm = {
  userId: string;
  amount: string;
  paidAt: string;
  checkNumber: string;
  paidBy: string;
  note: string;
  proof: File;
  onSaved: (payment: ParticipantPayment) => void;
};

export type PaymentSummary = { total: number; count: number; lastPaidAt: Date | string | null };

type PaymentsState = {
  programId: string;
  payments: ParticipantPayment[];
  saving: boolean;
  error: string;
};

const initialState: PaymentsState = { programId: '', payments: [], saving: false, error: '' };

export const AMOUNT_PATTERN = /^(?!0+(\.0+)?$)\d{1,7}(\.\d{1,2})?$/;

export const normalizeAmount = (value: string) => value.replace(/[$,\s]/g, '');

export const paymentDate = (value: string) => new Date(`${value}T12:00`).toISOString();

export const summarizePayments = (payments: ParticipantPayment[]) =>
  payments.reduce((summary, payment) => {
    const current = summary.get(payment.userId) ?? { total: 0, count: 0, lastPaidAt: null };
    const lastPaidAt =
      !current.lastPaidAt || new Date(payment.paidAt) > new Date(current.lastPaidAt)
        ? payment.paidAt
        : current.lastPaidAt;
    summary.set(payment.userId, { total: current.total + payment.amount, count: current.count + 1, lastPaidAt });
    return summary;
  }, new Map<string, PaymentSummary>());

const errorMessage = (error: unknown) =>
  error instanceof HttpErrorResponse && Array.isArray(error.error?.message) && error.error.message[0]
    ? String(error.error.message[0])
    : 'We could not record this payment. Please try again.';

export const ParticipantPaymentsStore = signalStore(
  withState(initialState),
  withComputed(({ payments }) => ({
    byParticipant: computed(() => summarizePayments(payments())),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    clearError: () => patchState(store, { error: '' }),
    load: rxMethod<string>(
      pipe(
        tap((programId) => patchState(store, { programId, payments: [] })),
        switchMap((programId) =>
          http.get<ParticipantPayment[]>(`/api/users-on-programs/program/${programId}/payments`).pipe(
            tapResponse({
              next: (payments) => patchState(store, { payments }),
              error: () => patchState(store, { payments: [] }),
            }),
          ),
        ),
      ),
    ),
    record: rxMethod<PaymentForm>(
      pipe(
        tap(() => patchState(store, { saving: true, error: '' })),
        exhaustMap(({ userId, amount, paidAt, checkNumber, paidBy, note, proof, onSaved }) => {
          const programId = store.programId();
          const form = new FormData();
          form.append('amount', normalizeAmount(amount));
          form.append('paidAt', paymentDate(paidAt));
          if (checkNumber.trim()) form.append('checkNumber', checkNumber.trim());
          if (paidBy.trim()) form.append('paidBy', paidBy.trim());
          if (note.trim()) form.append('note', note.trim());
          form.append('proof', proof);
          return http
            .post<ParticipantPayment>(
              `/api/users-on-programs/program/${programId}/participants/${userId}/payments`,
              form,
            )
            .pipe(
              tapResponse({
                next: (payment) => {
                  patchState(store, { payments: [payment, ...store.payments()] });
                  onSaved(payment);
                },
                error: (error) => patchState(store, { error: errorMessage(error) }),
                finalize: () => patchState(store, { saving: false }),
              }),
            );
        }),
      ),
    ),
  })),
);
