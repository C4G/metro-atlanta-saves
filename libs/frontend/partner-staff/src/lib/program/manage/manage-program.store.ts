import { formatDate } from '@angular/common';
import { computed, inject, LOCALE_ID } from '@angular/core';
import {
  AlliesOnProgramsStore,
  ProgramsStore,
  TaskReviewStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { UsersForProgramsStore } from '../users-on-programs/ui/add-users-on-programs/users-for-programs.store';

export type PeopleTab = 'participants' | 'allies';

type ManageProgramState = {
  tab: PeopleTab;
  query: string;
  addQuery: string;
  removing: { userId: string; tab: PeopleTab } | null;
};

const initialState: ManageProgramState = {
  tab: 'participants',
  query: '',
  addQuery: '',
  removing: null,
};

const MAX_CANDIDATES = 6;
const DAY = 86_400_000;

export const initialsOf = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export const matchesPerson = (query: string, ...fields: string[]) =>
  !query.trim() || fields.join(' ').toLowerCase().includes(query.trim().toLowerCase());

export const appliedAgo = (appliedAt: Date | string, now: Date, locale: string) => {
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(new Date(appliedAt))) / DAY);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-Math.max(days, 0), 'day');
  return `Applied ${relative}`;
};

export const ManageProgramStore = signalStore(
  withState(initialState),
  withComputed(
    (
      { tab, query, addQuery, removing },
      participants = inject(UsersOnProgramsStore),
      allies = inject(AlliesOnProgramsStore),
      review = inject(TaskReviewStore),
      directory = inject(UsersForProgramsStore),
      programs = inject(ProgramsStore),
      locale = inject(LOCALE_ID),
    ) => {
      const day = (value: Date | string | null | undefined) => (value ? formatDate(value, 'MMM d, y', locale) : '');
      const byFirstName = <T extends { firstName: string }>(people: T[]) =>
        [...people].sort((a, b) => a.firstName.localeCompare(b.firstName, locale, { sensitivity: 'base' }));
      const participantPeople = computed(() =>
        byFirstName(participants.users()).map((user) => ({
          userId: user.userId,
          name: `${user.firstName} ${user.lastName}`.trim(),
          initials: initialsOf(user.firstName, user.lastName),
          email: user.email,
          isParticipant: true,
          record: user,
        })),
      );
      const allyPeople = computed(() =>
        byFirstName(allies.allies()).map((ally) => ({
          userId: ally.userId,
          name: `${ally.firstName} ${ally.lastName}`.trim(),
          initials: initialsOf(ally.firstName, ally.lastName),
          email: ally.email,
          isParticipant: false,
          record: null,
        })),
      );
      const people = computed(() => (tab() === 'participants' ? participantPeople() : allyPeople()));
      return {
        tabs: computed<{ value: PeopleTab; label: string; count: number }[]>(() => [
          { value: 'participants', label: 'Participants', count: participantPeople().length },
          { value: 'allies', label: 'Allies', count: allyPeople().length },
        ]),
        isLoadingPeople: computed(() => (tab() === 'participants' ? participants.usersLoading() : allies.loading())),
        peopleLoadFailed: computed(() =>
          tab() === 'participants' ? participants.usersLoadFailed() : allies.loadFailed(),
        ),
        rows: computed(() => people().filter((person) => matchesPerson(query(), person.name, person.email))),
        addView: computed(() => {
          const name = programs.programName();
          return tab() === 'allies'
            ? {
                button: 'Add ally',
                heading: 'Add an ally',
                hint: `Allies support participants in ${name} and have no tasks of their own.`,
              }
            : {
                button: 'Add participant',
                heading: 'Add a participant',
                hint: `They see every month’s tasks in ${name} as soon as you add them.`,
              };
        }),
        candidates: computed(() => {
          const inProgram = new Set([...participantPeople(), ...allyPeople()].map(({ userId }) => userId));
          return directory
            .users()
            .filter(
              (user) =>
                !inProgram.has(user.id) && matchesPerson(addQuery(), `${user.firstName} ${user.lastName}`, user.email),
            )
            .slice(0, MAX_CANDIDATES)
            .map((user) => ({
              id: user.id,
              name: `${user.firstName} ${user.lastName}`.trim(),
              initials: initialsOf(user.firstName, user.lastName),
              email: user.email,
            }));
        }),
        removal: computed(() => {
          const target = removing();
          if (!target) return null;
          const person = (target.tab === 'participants' ? participantPeople() : allyPeople()).find(
            ({ userId }) => userId === target.userId,
          );
          if (!person) return null;
          const programName = programs.programName();
          return {
            ...person,
            roleLabel: `${person.isParticipant ? 'Participant' : 'Ally'} in ${programName}`,
            confirmLabel: person.isParticipant ? 'Remove participant' : 'Remove ally',
            points: person.isParticipant
              ? [
                  { text: 'Tasks, savings and receipts stay on record', isKept: true },
                  { text: 'You can add them back anytime', isKept: true },
                ]
              : [
                  { text: `They lose access to ${programName}`, isKept: false },
                  { text: 'Participants they support aren’t affected', isKept: true },
                ],
          };
        }),
        settingRows: computed(() => {
          const program = programs.program();
          return [
            { label: 'Partner', value: program?.partner?.name ?? '—', isMissing: false, needsDate: false },
            {
              label: 'Start date',
              value: day(program?.startDate) || 'Not set',
              isMissing: !program?.startDate,
              needsDate: !program?.startDate,
            },
            {
              label: 'End date',
              value: day(program?.endDate) || 'Not set',
              isMissing: !program?.endDate,
              needsDate: false,
            },
            {
              label: 'Allies',
              value: allyPeople().length ? `${allyPeople().length} supporting` : 'None yet',
              isMissing: !allyPeople().length,
              needsDate: false,
            },
          ];
        }),
        planMonths: computed(() => {
          const scheduled = new Set((review.data()?.requirements ?? []).map(({ month }) => month));
          return review.months().map(({ number, name }) => ({
            number,
            name,
            hasTasks: scheduled.has(number),
            isCurrent: number === review.currentMonth(),
          }));
        }),
        requests: computed(() =>
          programs.enrollments().map((enrollment) => ({
            id: enrollment.id,
            name: `${enrollment.firstName} ${enrollment.lastName}`.trim(),
            initials: initialsOf(enrollment.firstName, enrollment.lastName),
            email: enrollment.email ?? '',
            appliedOn: day(enrollment.createdAt),
            appliedLabel: appliedAgo(enrollment.createdAt, new Date(), locale),
          })),
        ),
      };
    },
  ),
  withMethods(
    (
      store,
      participants = inject(UsersOnProgramsStore),
      allies = inject(AlliesOnProgramsStore),
      directory = inject(UsersForProgramsStore),
    ) => ({
      setTab: (tab: PeopleTab) => patchState(store, { tab, addQuery: '' }),
      setQuery: (query: string) => patchState(store, { query }),
      startAdding: () => {
        if (!directory.users().length) directory.getUsers();
        patchState(store, { addQuery: '' });
      },
      setAddQuery: (addQuery: string) => patchState(store, { addQuery }),
      add: (userId: string) => {
        if (store.tab() === 'participants') participants.enrollParticipant(userId);
        else allies.addAlly({ userId });
      },
      askToRemove: (userId: string) => patchState(store, { removing: { userId, tab: store.tab() } }),
      cancelRemove: () => patchState(store, { removing: null }),
      confirmRemove: () => {
        const target = store.removing();
        if (!target) return;
        if (target.tab === 'participants') participants.deleteUser(target.userId);
        else allies.deleteAlly(target.userId);
        patchState(store, { removing: null });
      },
    }),
  ),
);
