import { formatDate } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { CheckpointName, Enrollment, Program } from '@mas/prisma-client/browser';
import { pipe, switchMap } from 'rxjs';

type AddProgram = Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;

export type UserAndEnrollment = Enrollment & { firstName: string; lastName: string };

type ProgramsState = {
  enrollments: UserAndEnrollment[];
  programs: Program[];
  program: Program | null;
  upcomingPrograms: Program[];
  usersPrograms: (Program & { isTemplate?: boolean })[];
  checkpointNames: CheckpointName[];
};

type SubmitEnroll = Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>;

const initialState: ProgramsState = {
  enrollments: [],
  programs: [],
  program: null,
  upcomingPrograms: [],
  usersPrograms: [],
  checkpointNames: [],
};

const BASE_URL = '/api/programs';

export const ProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ program }) => ({
    computedProgramCreatedAt: computed<string>(() => {
      return new Date(program()?.createdAt || '').toLocaleString();
    }),
    computedProgramDates: computed<string>(() => {
      const start = program()?.startDate;
      const end = program()?.endDate;
      return start && end
        ? `${formatDate(start, 'M/dd/yyyy', 'en-US')} to ${formatDate(end, 'M/dd/yyyy', 'en-US')}`
        : '';
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      snackBar = inject(MatSnackBar),
      dialogRef = inject(MatDialog),
      router = inject(Router),
    ) => ({
      clearUserPrograms: () => {
        patchState(store, (state) => ({ ...state, usersPrograms: [] }));
      },
      convertToUser: rxMethod<{ programId: string; enrollmentId: string }>(
        pipe(
          switchMap(({ programId, enrollmentId }) =>
            http.post<UserAndEnrollment>(`${BASE_URL}/${programId}/enrollment/${enrollmentId}`, {}).pipe(
              tapResponse({
                next: ({ firstName, lastName, id }) => {
                  patchState(store, (state) => ({
                    enrollments: state.enrollments.filter((e) => e.id !== id),
                  }));
                  snackBar.open(`${firstName} ${lastName} has been approved and added to the program!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(
                    resp.error.message[0] || `There was an error enrolling the user into the program`,
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
      enroll: rxMethod<SubmitEnroll>(
        pipe(
          switchMap((enrollment) =>
            http.post<Enrollment>(`${BASE_URL}/enroll`, enrollment).pipe(
              tapResponse({
                next: () => {
                  router.navigate(['/dashboard']);
                  snackBar.open(
                    `Your application has been submitted! You will be notified once you have been accepted into the program.`,
                    undefined,
                    {
                      panelClass: 'success',
                      duration: 5000,
                    },
                  );
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error enrolling in the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getEnrollments: rxMethod<string>(
        pipe(
          switchMap((programId) =>
            http.get<UserAndEnrollment[]>(`${BASE_URL}/${programId}/enrollments`).pipe(
              tapResponse({
                next: (enrollments) => {
                  patchState(store, { enrollments });
                },
                error: () => {
                  snackBar.open('There was an error retreiving enrollments', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getPrograms: rxMethod<string | undefined>(
        pipe(
          switchMap((partnerId?: string) =>
            http.get<Program[]>(`${BASE_URL}${partnerId ? '/partner/' + partnerId : ''}`).pipe(
              tapResponse({
                next: (programs) => {
                  patchState(store, (state) => ({ ...state, programs }));
                },
                error: () => {
                  snackBar.open('There was an error retreiving programs', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getProgramsForUser: rxMethod<void>(
        pipe(
          switchMap(() =>
            http.get<Program[]>(`${BASE_URL}${'/user/programs'}`, {}).pipe(
              tapResponse({
                next: (usersPrograms) => {
                  patchState(store, (state) => ({ ...state, usersPrograms }));
                },
                error: () => {
                  snackBar.open('There was an error retreiving programs for the user', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getProgram: rxMethod<string>(
        pipe(
          switchMap((programId: string) =>
            http.get<Program>(`${BASE_URL}/${programId}`).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, { program });
                },
                error: () => {
                  snackBar.open('There was an error retreiving program data', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getUpcoming: rxMethod<string | void>(
        pipe(
          switchMap((id) =>
            http.get<Program[]>(`${BASE_URL}/upcoming${id ? '/' + id : ''}`).pipe(
              tapResponse({
                next: (upcomingPrograms) => {
                  patchState(store, { upcomingPrograms });
                },
                error: () => {
                  snackBar.open('There was an error retreiving upcoming program data', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      patchProgram: rxMethod<Partial<Program>>(
        pipe(
          switchMap((program) =>
            http.patch<Program>(`${BASE_URL}/${program.id}`, program).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, (state) => ({
                    programs: state.programs.map((a) => (a.id === program.id ? program : a)),
                  }));
                  dialogRef.closeAll();
                  snackBar.open(`${program.name} has been updated`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error updating the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      addProgram: rxMethod<AddProgram>(
        pipe(
          switchMap((program) =>
            http.post<Program>(`${BASE_URL}/partner/${program.partnerId}`, program).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, (state) => ({
                    programs: [...state.programs, program],
                  }));
                  dialogRef.closeAll();
                  snackBar.open(`${program.name} has been created!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error creating the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      deleteEnrollment: rxMethod<{ programId: string; enrollmentId: string }>(
        pipe(
          switchMap(({ programId, enrollmentId }) =>
            http.delete<UserAndEnrollment>(`${BASE_URL}/${programId}/enrollment/${enrollmentId}`).pipe(
              tapResponse({
                next: (enrollment) => {
                  patchState(store, (state) => ({
                    ...state,
                    enrollments: state.enrollments.filter((e) => e.id !== enrollment.id),
                  }));
                  snackBar.open(`${enrollment.firstName} ${enrollment.lastName} has been deleted!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error deleting the enrollment`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      deleteProgram: rxMethod<string>(
        pipe(
          switchMap((id) =>
            http.delete<Program>(`${BASE_URL}/${id}`).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, (state) => ({
                    ...state,
                    programs: state.programs.filter((p) => p.id !== program.id),
                  }));
                  snackBar.open(`${program.name} has been deleted!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error deleting the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      cloneProgram: rxMethod<[string, string]>(
        pipe(
          switchMap(([programId, programName]) =>
            http.post<Program>(`${BASE_URL}/clone/${programId}`, { name: programName }).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, (state) => ({
                    ...state,
                    programs: [...state.programs, program],
                  }));
                  dialogRef.closeAll();
                  snackBar.open(`${program.name} has been cloned!`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error cloning the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
