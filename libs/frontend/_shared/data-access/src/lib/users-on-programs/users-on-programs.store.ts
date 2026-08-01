import { formatCurrency } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DOCUMENT, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserOnProgramAgg, UsersOnProgramsWithName } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Checkpoint, type UsersOnPrograms } from '@prisma/client';
import { pipe, switchMap } from 'rxjs';

type AddUsersOnPrograms = Omit<UsersOnPrograms, 'createdAt' | 'updatedAt' | 'programId'>;

type UsersOnProgramsState = {
  programId: string | null;
  users: UsersOnProgramsWithName[];
  userOnProgram: UserOnProgramAgg | null;
};

const initialState: UsersOnProgramsState = {
  programId: null,
  users: [],
  userOnProgram: null,
};

const BASE_URL = '/api/users-on-programs';

export const UsersOnProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ userOnProgram }) => ({
    userProgramProgress: computed(() => {
      if (!userOnProgram()) {
        return [];
      }

      const userData = userOnProgram();
      const requirement = userData?.program.Requirement;
      const requirementStatus = userData?.requirementStatus;

      return (
        requirement?.map(({ id, name, EducationalContent }) => {
          const isCompleted = requirementStatus?.includes(id);

          return {
            requirementName: name,
            status: isCompleted ? 'COMPLETED' : 'TODO',
            isCompleted,
            completionLink: EducationalContent?.link ?? null,
          };
        }) ?? []
      );
    }),
    userProgramSavings: computed<string>(() => {
      const programUser = userOnProgram();
      if (!programUser) {
        return '0';
      }

      const savedAmount = programUser.checkpoints.reduce(
        (acc, curr) => acc + (curr.checkpointName.type === 'Savings' ? (curr.savedMoney ?? 0) : 0),
        0,
      );

      return formatCurrency(savedAmount, 'en-us', '$', '1.2');
    }),
    userCreditIncrease: computed<number>(() => {
      const programUser = userOnProgram();
      if (!programUser) {
        return 0;
      }
      const creditChanges = programUser.checkpoints
        .filter((c) => c.checkpointName.type === 'Credit_Score')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return creditChanges.length > 1
        ? (creditChanges.at(-1)?.creditScore ?? 0) - (creditChanges.at(0)?.creditScore ?? 0)
        : 0;
    }),
    userProgramSavingsHistory: computed<Checkpoint[]>(() => {
      if (!userOnProgram()) {
        return [];
      }

      return userOnProgram()?.checkpoints || [];
    }),
  })),
  withComputed(({ userProgramProgress }) => ({
    percentageCompleted: computed(() => {
      const total = userProgramProgress().length;
      const completed = userProgramProgress().filter((p) => p.isCompleted).length;

      return total <= 0 ? 0 : Math.round((completed / total) * 100);
    }),
  })),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      snackBar = inject(MatSnackBar),
      dialogRef = inject(MatDialog),
      document = inject(DOCUMENT),
    ) => ({
      setProgramId: (programId: string) => {
        patchState(store, (state) => ({ ...state, programId }));
      },
      getUserOnProgram: rxMethod<void>(
        pipe(
          switchMap(() =>
            http.get<UserOnProgramAgg>(`${BASE_URL}/user/program/${store.programId()}`).pipe(
              tapResponse({
                next: (userOnProgram) => {
                  patchState(store, (state) => ({ ...state, userOnProgram }));
                },
                error: () => {
                  snackBar.open('There was an error retreiving user on program data', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      getUsers: rxMethod<void>(
        pipe(
          switchMap(() =>
            http.get<UsersOnProgramsWithName[]>(`${BASE_URL}${'/program/' + store.programId()}`).pipe(
              tapResponse({
                next: (users) => {
                  patchState(store, (state) => ({ ...state, users }));
                },
                error: () => {
                  snackBar.open('There was an error retreiving users', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      patchUser: rxMethod<Partial<UsersOnPrograms>>(
        pipe(
          switchMap((usersOnPrograms) =>
            http.patch<UsersOnProgramsWithName>(`${BASE_URL}`, usersOnPrograms).pipe(
              tapResponse({
                next: (usersOnPrograms) => {
                  patchState(store, (state) => ({
                    ...state,
                    users: state.users.map((a) => (a.userId === usersOnPrograms.userId ? usersOnPrograms : a)),
                  }));
                  dialogRef.closeAll();
                  snackBar.open(
                    `${usersOnPrograms.firstName} ${usersOnPrograms.lastName} has been updated`,
                    undefined,
                    {
                      panelClass: 'success',
                      duration: 5000,
                    },
                  );
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error updating the user`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      addUser: rxMethod<AddUsersOnPrograms>(
        pipe(
          switchMap((usersOnPrograms) =>
            http
              .post<UsersOnProgramsWithName>(`${BASE_URL}`, { ...usersOnPrograms, programId: store.programId() })
              .pipe(
                tapResponse({
                  next: (usersOnPrograms) => {
                    patchState(store, (state) => ({
                      ...state,
                      users: [...state.users, usersOnPrograms],
                    }));
                    dialogRef.closeAll();
                    snackBar.open(
                      `${usersOnPrograms.firstName} ${usersOnPrograms.lastName} has been added to the program!`,
                      undefined,
                      {
                        panelClass: 'success',
                        duration: 5000,
                      },
                    );
                  },
                  error: (resp: HttpErrorResponse) => {
                    snackBar.open(resp.error.message[0] || `There was an error creating the user`, undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      ),
      deleteUser: rxMethod<string>(
        pipe(
          switchMap((id) =>
            http.delete<UsersOnProgramsWithName>(`${BASE_URL}/user/${id}/program/${store.programId()}`).pipe(
              tapResponse({
                next: (usersOnPrograms) => {
                  patchState(store, (state) => ({
                    ...state,
                    users: state.users.filter((p) => p.userId !== usersOnPrograms.userId),
                  }));
                  snackBar.open(
                    `${usersOnPrograms.firstName} ${usersOnPrograms.lastName} has been removed from the program!`,
                    undefined,
                    {
                      panelClass: 'success',
                      duration: 5000,
                    },
                  );
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error.message[0] || `There was an error deleting the usersOnPrograms`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      ),
      downloadExcel: rxMethod<void>(
        pipe(
          switchMap(() =>
            http
              .get(`${BASE_URL}/excel-sheet/${store.programId()}`, {
                observe: 'response',
                responseType: 'arraybuffer',
              })
              .pipe(
                tapResponse({
                  next: (response) => {
                    if (response.body && document.defaultView) {
                      const blob = new Blob([response.body], {
                        type:
                          response.headers.get('content-type') ??
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      });
                      const link = document.createElement('a');
                      link.href = document.defaultView.URL.createObjectURL(blob);
                      link.download = `program-${store.programId()}-users.xlsx`;
                      link.click();
                    } else {
                      snackBar.open('There was an error downloading the excel sheet', undefined, {
                        panelClass: 'error',
                        duration: 5000,
                      });
                    }
                  },
                  error: (resp: HttpErrorResponse) => {
                    snackBar.open(
                      resp.error.message[0] || 'There was an error downloading the excel sheet',
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
    }),
  ),
);
