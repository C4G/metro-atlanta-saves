import { HttpClient } from '@angular/common/http';
import { formatDate, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, LOCALE_ID, PLATFORM_ID, untracked } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ParticipantRequirement } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, finalize, mergeMap, pipe, switchMap, tap } from 'rxjs';
import { ProgramsStore } from '../programs/programs.store';

export type CalendarTask = {
  requirement: ParticipantRequirement;
  id: string;
  title: string;
  program: string;
  programId: string;
  dueAt: string;
  dueLabel: string;
  isCompleted: boolean;
  canComplete: boolean;
  isEnrolled: boolean;
  link: string[];
};

export type RequirementProgramOption = {
  id: string;
  name: string;
  taskCount: number;
  isVisible: boolean;
};

type ParticipantRequirementsState = {
  requirements: ParticipantRequirement[];
  savingTaskIds: string[];
  loading: boolean;
  loadFailed: boolean;
  hiddenProgramIds: string[];
  filterStorageKey: string | null;
  programQuery: string;
};

const initialState: ParticipantRequirementsState = {
  requirements: [],
  savingTaskIds: [],
  loading: false,
  loadFailed: false,
  hiddenProgramIds: [],
  filterStorageKey: null,
  programQuery: '',
};

const FILTER_STORAGE_PREFIX = 'mas-calendar-hidden-programs';

const readHiddenProgramIds = (key: string): string[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const writeHiddenProgramIds = (key: string, hiddenProgramIds: string[]) => {
  try {
    if (hiddenProgramIds.length) {
      localStorage.setItem(key, JSON.stringify(hiddenProgramIds));
    } else {
      localStorage.removeItem(key);
    }
    return true;
  } catch {
    return false;
  }
};

const toIsoDate = (date: Date) => formatDate(date, 'yyyy-MM-dd', 'en-US');

const formatDueLabel = (value: string, locale: string) => {
  const dueAt = new Date(value);
  const date = formatDate(dueAt, 'MMM d', locale);
  const isToday = toIsoDate(dueAt) === toIsoDate(new Date());
  const isEndOfDay =
    (dueAt.getHours() === 0 && dueAt.getMinutes() === 0) || (dueAt.getHours() === 23 && dueAt.getMinutes() === 59);
  const time = isEndOfDay ? 'End of day' : formatDate(dueAt, 'h:mm a', locale);
  return `Due ${isToday ? `today, ${date}` : date} · ${time}`;
};

export const ParticipantRequirementsStore = signalStore(
  withState(initialState),
  withComputed(
    (
      { requirements, hiddenProgramIds, programQuery },
      programsStore = inject(ProgramsStore),
      locale = inject(LOCALE_ID),
      authStore = inject(AuthStore),
    ) => {
      const programs = computed<RequirementProgramOption[]>(() => {
        const hidden = new Set(hiddenProgramIds());
        const names = new Map(
          programsStore
            .usersPrograms()
            .filter((program) => !program.isTemplate)
            .map((program) => [program.id, program.name]),
        );
        const taskCounts = new Map<string, number>();
        for (const requirement of requirements()) {
          names.set(requirement.programId, requirement.programName);
          taskCounts.set(requirement.programId, (taskCounts.get(requirement.programId) ?? 0) + 1);
        }
        return [...names]
          .map(([id, name]) => ({ id, name, taskCount: taskCounts.get(id) ?? 0, isVisible: !hidden.has(id) }))
          .sort((a, b) => a.name.localeCompare(b.name, locale));
      });
      const visiblePrograms = computed(() => programs().filter((program) => program.isVisible));
      const visibleRequirements = computed(() => {
        const hidden = new Set(hiddenProgramIds());
        return requirements().filter((requirement) => !hidden.has(requirement.programId));
      });
      return {
        programs,
        visiblePrograms,
        allProgramsVisible: computed(() => visiblePrograms().length === programs().length),
        matchingPrograms: computed(() => {
          const query = programQuery().trim().toLocaleLowerCase(locale);
          return programs().filter((program) => program.name.toLocaleLowerCase(locale).includes(query));
        }),
        visibleRequirements,
        tasksByDate: computed(() => {
          const grouped: Record<string, CalendarTask[]> = {};
          for (const requirement of visibleRequirements()) {
            (grouped[toIsoDate(new Date(requirement.dueAt))] ??= []).push({
              requirement,
              id: requirement.id,
              title: requirement.name,
              program: requirement.programName,
              programId: requirement.programId,
              dueAt: requirement.dueAt,
              dueLabel: formatDueLabel(requirement.dueAt, locale),
              isCompleted: requirement.isCompleted,
              canComplete: requirement.canComplete && !authStore.isStaff(),
              isEnrolled: requirement.isEnrolled && !authStore.isStaff(),
              link:
                requirement.isEnrolled && !authStore.isStaff()
                  ? ['/program-profiles', requirement.programId, 'progress']
                  : // Staff review the task in the month it belongs to.
                    ['/partner-staff/programs', requirement.programId, 'progress'],
            });
          }
          return grouped;
        }),
      };
    },
  ),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, loadFailed: false })),
        switchMap(() =>
          http.get<ParticipantRequirement[]>('/api/users-on-programs/user/requirements').pipe(
            tapResponse({
              next: (requirements) => patchState(store, { requirements }),
              error: () => patchState(store, { loadFailed: true }),
              finalize: () => patchState(store, { loading: false }),
            }),
          ),
        ),
      ),
    ),
    toggle: rxMethod<ParticipantRequirement>(
      pipe(
        filter((task) => task.canComplete && !store.savingTaskIds().includes(task.id)),
        tap((task) => patchState(store, { savingTaskIds: [...store.savingTaskIds(), task.id] })),
        mergeMap((task) => {
          const url = `/api/users-on-programs/user/program/${task.programId}/requirements/${task.id}/completion`;
          return (task.isCompleted ? http.delete(url) : http.post(url, {})).pipe(
            tapResponse({
              next: () =>
                patchState(store, {
                  requirements: store
                    .requirements()
                    .map((requirement) =>
                      requirement.id === task.id ? { ...requirement, isCompleted: !task.isCompleted } : requirement,
                    ),
                }),
              error: () => snackBar.open('We could not update this task. Please try again.'),
            }),
            finalize(() => patchState(store, { savingTaskIds: store.savingTaskIds().filter((id) => id !== task.id) })),
          );
        }),
      ),
    ),
    toggleProgram: (programId: string) =>
      patchState(store, {
        hiddenProgramIds: store.hiddenProgramIds().includes(programId)
          ? store.hiddenProgramIds().filter((id) => id !== programId)
          : [...store.hiddenProgramIds(), programId],
      }),
    showAllPrograms: () => patchState(store, { hiddenProgramIds: [] }),
    hideAllPrograms: () => patchState(store, { hiddenProgramIds: store.programs().map((program) => program.id) }),
    setProgramQuery: (programQuery: string) => patchState(store, { programQuery }),
  })),
  withHooks({
    onInit(store, authStore = inject(AuthStore), platformId = inject(PLATFORM_ID)) {
      if (!isPlatformBrowser(platformId)) {
        return;
      }
      effect(() => {
        const userId = authStore.user()?.id;
        untracked(() => {
          const filterStorageKey = userId ? `${FILTER_STORAGE_PREFIX}:${userId}` : null;
          patchState(store, {
            filterStorageKey,
            hiddenProgramIds: filterStorageKey ? readHiddenProgramIds(filterStorageKey) : [],
          });
        });
      });
      effect(() => {
        const filterStorageKey = store.filterStorageKey();
        const hiddenProgramIds = store.hiddenProgramIds();
        if (filterStorageKey) {
          writeHiddenProgramIds(filterStorageKey, hiddenProgramIds);
        }
      });
    },
  }),
);
