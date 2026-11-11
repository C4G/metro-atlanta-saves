import { formatCurrency, formatDate } from '@angular/common';
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
  adding: boolean;
  addQuery: string;
  // The person waiting for the staff member to confirm their removal.
  removing: { userId: string; tab: PeopleTab } | null;
  editingSettings: boolean;
};

const initialState: ManageProgramState = {
  tab: 'participants',
  query: '',
  adding: false,
  addQuery: '',
  removing: null,
  editingSettings: false,
};

const MAX_CANDIDATES = 6;

export const initialsOf = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

// Matches people by any part of their name or email, ignoring case.
export const matchesPerson = (query: string, ...fields: string[]) =>
  !query.trim() || fields.join(' ').toLowerCase().includes(query.trim().toLowerCase());

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
      const participantPeople = computed(() =>
        [...participants.users()]
          .sort((a, b) => a.firstName.localeCompare(b.firstName, locale, { sensitivity: 'base' }))
          .map((user) => {
            const totals = review.participantTotals().get(user.userId);
            const done = totals?.tasksDone ?? 0;
            // Someone added since the review data loaded has every task still ahead of them.
            const total = totals?.taskTotal ?? review.data()?.requirements.length ?? 0;
            return {
              userId: user.userId,
              name: `${user.firstName} ${user.lastName}`.trim(),
              initials: initialsOf(user.firstName, user.lastName),
              email: user.email,
              savedLabel: formatCurrency(totals?.saved ?? 0, locale, '$', 'USD', '1.2-2'),
              tasksLabel: `${done}/${total}`,
              tasksPercent: total ? Math.round((done / total) * 100) : 0,
              isParticipant: true,
              record: user,
            };
          }),
      );
      const allyPeople = computed(() =>
        [...allies.allies()]
          .sort((a, b) => a.firstName.localeCompare(b.firstName, locale, { sensitivity: 'base' }))
          .map((ally) => ({
            userId: ally.userId,
            name: `${ally.firstName} ${ally.lastName}`.trim(),
            initials: initialsOf(ally.firstName, ally.lastName),
            email: ally.email,
            savedLabel: '—',
            tasksLabel: 'Ally',
            tasksPercent: 0,
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
          const name = programs.program()?.name ?? 'this program';
          return tab() === 'allies'
            ? {
                button: 'Add ally',
                heading: `Add an ally to ${name}`,
                hint: 'Allies support participants and can see the program, but have no tasks of their own.',
              }
            : {
                button: 'Add participant',
                heading: `Add a participant to ${name}`,
                hint: 'They’ll see every month’s tasks as soon as you add them.',
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
          const programName = programs.program()?.name ?? 'this program';
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
            appliedLabel: `Applied ${day(enrollment.createdAt)}`,
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
      toggleAdding: () => {
        const adding = !store.adding();
        if (adding && !directory.users().length) directory.getUsers();
        patchState(store, { adding, addQuery: '' });
      },
      closeAdding: () => patchState(store, { adding: false, addQuery: '' }),
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
      setEditingSettings: (editingSettings: boolean) => patchState(store, { editingSettings }),
    }),
  ),
);
