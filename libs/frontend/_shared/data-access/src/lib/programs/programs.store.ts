import { formatDate } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, LOCALE_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import type { CheckpointName, Enrollment, Program } from '@mas/prisma-client/browser';
import { debounceTime, distinctUntilChanged, exhaustMap, pipe, switchMap } from 'rxjs';

type AddProgram = Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;

export type ProgramCardStatus = 'active' | 'archived' | 'open' | 'closed';

export type ProgramCard = {
  program: Program;
  status: ProgramCardStatus;
  label: string;
  isInactive: boolean;
  meta: string;
};

export const PROGRAM_STATUS_LABELS: Record<ProgramCardStatus, string> = {
  active: 'Active',
  archived: 'Archived',
  open: 'Open',
  closed: 'Closed',
};

export const joinedProgramStatus = (program: Pick<Program, 'endDate'>, now: Date): ProgramCardStatus =>
  program.endDate && new Date(program.endDate) < now ? 'archived' : 'active';

export const upcomingProgramStatus = (program: Pick<Program, 'startDate'>, now: Date): ProgramCardStatus =>
  program.startDate && new Date(program.startDate) <= now ? 'closed' : 'open';

export type DirectorySection = 'active' | 'upcoming' | 'inactive' | 'template';

export type DirectoryCard = {
  program: Program;
  label: string;
  meta: string;
  isInactive: boolean;
  isTemplate: boolean;
};

export type DirectoryGroup = {
  key: DirectorySection;
  title: string;
  emptyText: string;
  query: string;
  total: number;
  cards: DirectoryCard[];
};

export const DIRECTORY_SECTIONS: { key: DirectorySection; title: string; label: string; emptyText: string }[] = [
  { key: 'active', title: 'Active programs', label: 'Active', emptyText: 'No active programs right now.' },
  { key: 'upcoming', title: 'Upcoming programs', label: 'Upcoming', emptyText: 'No upcoming programs.' },
  { key: 'inactive', title: 'Inactive programs', label: 'Archived', emptyText: 'No inactive programs.' },
  { key: 'template', title: 'Templates', label: 'Template', emptyText: 'No templates yet.' },
];

export const directorySectionFor = (
  program: Pick<Program, 'isTemplate' | 'startDate' | 'endDate'>,
  now: Date,
): DirectorySection => {
  if (program.isTemplate) return 'template';
  if (program.endDate && new Date(program.endDate) < now) return 'inactive';
  if (program.startDate && new Date(program.startDate) > now) return 'upcoming';
  return 'active';
};

export const directoryMeta = (
  program: Pick<Program, 'startDate' | 'endDate'>,
  section: DirectorySection,
  locale: string,
): string => {
  const date = (value: Date | string) => formatDate(value, 'MMM d, y', locale);
  if (section === 'template') return 'Dates are set when cloned';
  if (section === 'inactive' && program.endDate) return `Ended ${date(program.endDate)}`;
  if (program.startDate && program.endDate) return `${date(program.startDate)} – ${date(program.endDate)}`;
  if (program.startDate) return `${section === 'active' ? 'Started' : 'Starts'} ${date(program.startDate)}`;
  return 'Dates to be set';
};

export const matchesDirectoryQuery = (program: Pick<Program, 'name' | 'description'>, query: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const text = `${program.name} ${(program.description ?? '').replace(/<[^>]*>/g, ' ')}`.toLowerCase();
  return text.includes(needle);
};

export type UserAndEnrollment = Enrollment & { firstName: string; lastName: string };

type ProgramsState = {
  enrollments: UserAndEnrollment[];
  enrollmentsLoading: boolean;
  enrollmentsLoadFailed: boolean;
  programs: Program[];
  program: (Program & { checkpointNames?: { name: string }[]; partner?: { name: string } }) | null;
  programSaving: boolean;
  upcomingPrograms: Program[];
  usersPrograms: (Program & { isTemplate?: boolean })[];
  checkpointNames: CheckpointName[];
  directoryQueries: Record<DirectorySection, string>;
};

type SubmitEnroll = Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt'>;

type ProgramSearch = {
  partnerId?: string;
  search: string;
};

const initialState: ProgramsState = {
  enrollments: [],
  enrollmentsLoading: false,
  enrollmentsLoadFailed: false,
  programs: [],
  program: null,
  programSaving: false,
  upcomingPrograms: [],
  usersPrograms: [],
  checkpointNames: [],
  directoryQueries: { active: '', upcoming: '', inactive: '', template: '' },
};

const BASE_URL = '/api/programs';

export const ProgramsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({ program, programs, usersPrograms, upcomingPrograms, directoryQueries }, locale = inject(LOCALE_ID)) => ({
      directoryGroups: computed<DirectoryGroup[]>(() => {
        const now = new Date();
        const queries = directoryQueries();
        const sorted = [...programs()].sort(
          (a, b) => new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime(),
        );
        return DIRECTORY_SECTIONS.map(({ key, title, label, emptyText }) => {
          const inSection = sorted.filter((entry) => directorySectionFor(entry, now) === key);
          const ordered = key === 'inactive' ? [...inSection].reverse() : inSection;
          return {
            key,
            title,
            emptyText,
            query: queries[key],
            total: inSection.length,
            cards: ordered
              .filter((entry) => matchesDirectoryQuery(entry, queries[key]))
              .map((entry) => ({
                program: entry,
                label,
                meta: directoryMeta(entry, key, locale),
                isInactive: key === 'inactive',
                isTemplate: key === 'template',
              })),
          };
        });
      }),
      myProgramCards: computed<ProgramCard[]>(() => {
        const now = new Date();
        return usersPrograms()
          .map((joined): ProgramCard => {
            const status = joinedProgramStatus(joined, now);
            return {
              program: joined,
              status,
              label: PROGRAM_STATUS_LABELS[status],
              isInactive: status === 'archived',
              meta:
                status === 'archived' && joined.endDate ? `Ended ${formatDate(joined.endDate, 'MMM d', locale)}` : '',
            };
          })
          .sort((a, b) => Number(a.isInactive) - Number(b.isInactive));
      }),
      explorePrograms: computed<ProgramCard[]>(() => {
        const now = new Date();
        const joinedIds = new Set(usersPrograms().map((joined) => joined.id));
        return upcomingPrograms()
          .filter((upcoming) => !joinedIds.has(upcoming.id))
          .map((upcoming): ProgramCard => {
            const status = upcomingProgramStatus(upcoming, now);
            const start = upcoming.startDate ? formatDate(upcoming.startDate, 'MMM d', locale) : '';
            return {
              program: upcoming,
              status,
              label: PROGRAM_STATUS_LABELS[status],
              isInactive: status === 'closed',
              meta: start ? `${status === 'open' ? 'Starts' : 'Enrollment closed · Started'} ${start}` : '',
            };
          })
          .sort((a, b) => Number(a.isInactive) - Number(b.isInactive));
      }),
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
    }),
  ),
  withMethods(
    (
      store,
      http = inject(HttpClient),
      snackBar = inject(MatSnackBar),
      dialogRef = inject(MatDialog),
      router = inject(Router),
    ) => ({
      setDirectoryQuery: (section: DirectorySection, query: string) => {
        patchState(store, (state) => ({ directoryQueries: { ...state.directoryQueries, [section]: query } }));
      },
      clearDirectoryQueries: () => {
        patchState(store, { directoryQueries: initialState.directoryQueries });
      },
      clearUserPrograms: () => {
        patchState(store, (state) => ({ ...state, usersPrograms: [] }));
      },
      convertToUser: rxMethod<{ programId: string; enrollmentId: string; onApproved?: () => void }>(
        pipe(
          switchMap(({ programId, enrollmentId, onApproved }) =>
            http.post<UserAndEnrollment>(`${BASE_URL}/${programId}/enrollment/${enrollmentId}`, {}).pipe(
              tapResponse({
                next: ({ firstName, lastName, id }) => {
                  patchState(store, (state) => ({
                    enrollments: state.enrollments.filter((e) => e.id !== id),
                  }));
                  onApproved?.();
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
          switchMap((programId) => {
            patchState(store, { enrollments: [], enrollmentsLoading: true, enrollmentsLoadFailed: false });
            return http.get<UserAndEnrollment[]>(`${BASE_URL}/${programId}/enrollments`).pipe(
              tapResponse({
                next: (enrollments) => {
                  patchState(store, { enrollments });
                },
                error: () => {
                  patchState(store, { enrollmentsLoadFailed: true });
                  snackBar.open('There was an error retreiving enrollments', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
                finalize: () => patchState(store, { enrollmentsLoading: false }),
              }),
            );
          }),
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
      searchPrograms: rxMethod<ProgramSearch>(
        pipe(
          debounceTime(300),
          distinctUntilChanged(
            (previous, current) => previous.partnerId === current.partnerId && previous.search === current.search,
          ),
          switchMap(({ partnerId, search }) =>
            http
              .get<Program[]>(`${BASE_URL}${partnerId ? '/partner/' + partnerId : ''}`, {
                params: search.trim() ? { search: search.trim() } : {},
              })
              .pipe(
                tapResponse({
                  next: (programs) => patchState(store, { programs }),
                  error: () => {
                    snackBar.open('There was an error retrieving programs', undefined, {
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
      patchProgram: rxMethod<Partial<Program> & { keepOpen?: boolean; onSaved?: () => void }>(
        pipe(
          exhaustMap(({ keepOpen, onSaved, ...program }) => {
            patchState(store, { programSaving: true });
            return http.patch<Program>(`${BASE_URL}/${program.id}`, program).pipe(
              tapResponse({
                next: (program) => {
                  patchState(store, (state) => ({
                    programs: state.programs.map((a) => (a.id === program.id ? program : a)),
                    program: state.program?.id === program.id ? program : state.program,
                  }));
                  if (!keepOpen) dialogRef.closeAll();
                  onSaved?.();
                  snackBar.open(`${program.name} has been updated`, undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: (resp: HttpErrorResponse) => {
                  snackBar.open(resp.error?.message?.[0] || `There was an error updating the program`, undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
                finalize: () => patchState(store, { programSaving: false }),
              }),
            );
          }),
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
