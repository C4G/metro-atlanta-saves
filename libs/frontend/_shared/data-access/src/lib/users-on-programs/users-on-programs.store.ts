import { formatCurrency } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, DOCUMENT, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserOnProgramAgg, UsersOnProgramsWithName } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Checkpoint, type UsersOnPrograms } from '@mas/prisma-client/browser';
import { filter, finalize, map, mergeMap, pipe, switchMap, tap } from 'rxjs';

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

type CreditCheckpoint = Pick<Checkpoint, 'createdAt' | 'creditScore' | 'name'>;

export function calculateCreditScoreChange(checkpoints: CreditCheckpoint[]): number {
  const withCreditScore = checkpoints.filter(
    (checkpoint): checkpoint is CreditCheckpoint & { creditScore: number } => checkpoint.creditScore !== null,
  );
  const monthlyCheckpoints = withCreditScore.filter((checkpoint) => /^month\s+\d+$/i.test(checkpoint.name.trim()));
  const checkpointsToCompare = monthlyCheckpoints.length >= 2 ? monthlyCheckpoints : withCreditScore;
  const orderedCheckpoints = [...checkpointsToCompare].sort((first, second) => {
    const firstMonth = Number(first.name.match(/^month\s+(\d+)$/i)?.[1]);
    const secondMonth = Number(second.name.match(/^month\s+(\d+)$/i)?.[1]);

    if (Number.isFinite(firstMonth) && Number.isFinite(secondMonth)) {
      return firstMonth - secondMonth;
    }

    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });

  const firstCheckpoint = orderedCheckpoints[0];
  const lastCheckpoint = orderedCheckpoints.at(-1);
  if (!firstCheckpoint || !lastCheckpoint) {
    return 0;
  }

  return lastCheckpoint.creditScore - firstCheckpoint.creditScore;
}

export const UsersOnProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withState({ savingRequirementIds: [] as string[] }),
  withComputed(({ userOnProgram }) => ({
    userProgramProgress: computed(() => {
      if (!userOnProgram()) {
        return [];
      }

      const userData = userOnProgram();
      const requirement = userData?.program.Requirement;
      const requirementStatus = userData?.requirementStatus;
      const requirementCompletions = userData?.requirementCompletions ?? [];

      return (
        requirement?.map(({ id, name, actionInstructions, dueAt, EducationalContent }) => {
          const completion = requirementCompletions.find((item) => item.requirementId === id);
          const isCompleted = requirementStatus?.includes(id) || !!completion;

          return {
            requirementId: id,
            requirementName: name,
            actionInstructions,
            dueAt,
            isActionRequirement: !!actionInstructions?.trim(),
            canComplete: true,
            status: isCompleted ? 'COMPLETED' : 'TODO',
            isCompleted,
            completedAt: completion?.completedAt ?? null,
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
        (total, checkpoint) => total + (checkpoint.savedMoney ?? 0),
        0,
      );

      return formatCurrency(savedAmount, 'en-us', '$', '1.2');
    }),
    userCreditIncrease: computed<number>(() => {
      const programUser = userOnProgram();
      if (!programUser) {
        return 0;
      }

      return calculateCreditScoreChange(programUser.checkpoints);
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
      setRequirementCompletion: rxMethod<{ requirementId: string; isCompleted: boolean }>(
        pipe(
          filter(
            ({ requirementId }) =>
              !!store.userProgramProgress().find((task) => task.requirementId === requirementId)?.canComplete &&
              !store.savingRequirementIds().includes(requirementId),
          ),
          map((change) => ({ ...change, programId: store.programId() })),
          tap(({ requirementId }) =>
            patchState(store, { savingRequirementIds: [...store.savingRequirementIds(), requirementId] }),
          ),
          mergeMap(({ requirementId, isCompleted, programId }) => {
            const url = `${BASE_URL}/user/program/${programId}/requirements/${requirementId}/completion`;
            const request = isCompleted
              ? http.post<{ requirementId: string; completedAt: Date }>(url, {})
              : http.delete<{ requirementId: string; completedAt?: Date }>(url);
            return request.pipe(
              tapResponse({
                next: (result) =>
                  patchState(store, (state) => {
                    if (!state.userOnProgram || state.programId !== programId) return state;
                    const completions = state.userOnProgram.requirementCompletions.filter(
                      (item) => item.requirementId !== requirementId,
                    );
                    return {
                      userOnProgram: {
                        ...state.userOnProgram,
                        requirementStatus: isCompleted
                          ? state.userOnProgram.requirementStatus
                          : state.userOnProgram.requirementStatus.filter((id) => id !== requirementId),
                        requirementCompletions:
                          isCompleted && result.completedAt
                            ? [...completions, { requirementId, completedAt: result.completedAt }]
                            : completions,
                      },
                    };
                  }),
                error: () =>
                  snackBar.open('We could not update this task. Please try again.', undefined, { duration: 5000 }),
              }),
              finalize(() =>
                patchState(store, {
                  savingRequirementIds: store.savingRequirementIds().filter((id) => id !== requirementId),
                }),
              ),
            );
          }),
        ),
      ),
      completeRequirement: rxMethod<string>(
        pipe(
          switchMap((requirementId) =>
            http
              .post<{
                requirementId: string;
                completedAt: Date;
              }>(`${BASE_URL}/user/program/${store.programId()}/requirements/${requirementId}/completion`, {})
              .pipe(
                tapResponse({
                  next: (completion) => {
                    patchState(store, (state) => {
                      const userOnProgram = state.userOnProgram;
                      if (!userOnProgram) {
                        return state;
                      }

                      const requirementCompletions = userOnProgram.requirementCompletions ?? [];
                      const existingCompletion = requirementCompletions.find(
                        (item) => item.requirementId === completion.requirementId,
                      );

                      return {
                        ...state,
                        userOnProgram: {
                          ...userOnProgram,
                          requirementCompletions: existingCompletion
                            ? requirementCompletions.map((item) =>
                                item.requirementId === completion.requirementId ? completion : item,
                              )
                            : [...requirementCompletions, completion],
                        },
                      };
                    });
                    snackBar.open('Requirement marked complete', undefined, {
                      panelClass: 'success',
                      duration: 5000,
                    });
                  },
                  error: (resp: HttpErrorResponse) => {
                    snackBar.open(
                      resp.error.message?.[0] || 'There was an error completing this requirement',
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
