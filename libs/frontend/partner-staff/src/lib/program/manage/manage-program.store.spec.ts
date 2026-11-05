import { LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AlliesOnProgramsStore,
  ParticipantTotals,
  ProgramsStore,
  TaskReviewStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';
import { UsersForProgramsStore } from '../users-on-programs/ui/add-users-on-programs/users-for-programs.store';
import { appliedAgo, initialsOf, ManageProgramStore, matchesPerson } from './manage-program.store';
import { fileKind } from './program-documents.store';

const user = (userId: string, firstName: string, lastName: string) => ({
  userId,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}@example.com`,
});

describe('manage program helpers', () => {
  it('matches people by name or email and builds initials', () => {
    expect(matchesPerson(' AVE ', 'Avery Johnson', 'a@example.com')).toBe(true);
    expect(matchesPerson('zz', 'Avery Johnson', 'a@example.com')).toBe(false);
    expect(initialsOf('avery', 'johnson')).toBe('AJ');
  });

  it('labels file types for the library', () => {
    expect(fileKind('application/pdf')).toBe('PDF');
    expect(fileKind('image/png')).toBe('IMG');
    expect(fileKind('text/csv')).toBe('DOC');
  });
});

describe('appliedAgo', () => {
  const now = new Date(2026, 10, 2, 15, 30);
  it.each([
    [new Date(2026, 10, 2, 9), 'Applied today'],
    [new Date(2026, 10, 1, 23), 'Applied yesterday'],
    [new Date(2026, 9, 30, 8), 'Applied 3 days ago'],
    [new Date(2026, 10, 5), 'Applied today'],
  ])('describes %s', (appliedAt, label) => {
    expect(appliedAgo(appliedAt, now, 'en-US')).toBe(label);
  });
});

describe('ManageProgramStore', () => {
  const deleteUser = jest.fn();
  const deleteAlly = jest.fn();
  const enrollParticipant = jest.fn();
  const addAlly = jest.fn();
  let store: InstanceType<typeof ManageProgramStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ManageProgramStore,
        { provide: LOCALE_ID, useValue: 'en-US' },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            users: signal([user('u2', 'Zoe', 'Park'), user('u1', 'Avery', 'Johnson')]),
            usersLoading: signal(false),
            usersLoadFailed: signal(false),
            deleteUser,
            enrollParticipant,
          },
        },
        {
          provide: AlliesOnProgramsStore,
          useValue: {
            allies: signal([user('a1', 'Org', 'Test')]),
            loading: signal(false),
            loadFailed: signal(false),
            deleteAlly,
            addAlly,
          },
        },
        {
          provide: TaskReviewStore,
          useValue: {
            participantTotals: signal(
              new Map<string, ParticipantTotals>([['u1', { saved: 451, tasksDone: 3, taskTotal: 6 }]]),
            ),
            data: signal({ requirements: [{ month: 1 }] }),
            months: signal([1, 2].map((number) => ({ number, name: `Month ${number}` }))),
            currentMonth: signal(1),
          },
        },
        {
          provide: UsersForProgramsStore,
          useValue: {
            users: signal([
              { id: 'u1', firstName: 'Avery', lastName: 'Johnson', email: 'avery@example.com' },
              { id: 'n1', firstName: 'Morgan', lastName: 'Reyes', email: 'morgan@example.com' },
            ]),
            getUsers: jest.fn(),
          },
        },
        {
          provide: ProgramsStore,
          useValue: {
            program: signal({ name: 'Pilot', startDate: null, endDate: null, partner: { name: 'Frontline Housing' } }),
            programName: signal('Pilot'),
            enrollments: signal([]),
          },
        },
      ],
    });
    store = TestBed.inject(ManageProgramStore);
  });
  afterEach(() => TestBed.resetTestingModule());

  it('lists participants by first name and filters them by name or email', () => {
    expect(store.rows().map(({ name, initials }) => [name, initials])).toEqual([
      ['Avery Johnson', 'AJ'],
      ['Zoe Park', 'ZP'],
    ]);
    expect(store.tabs().map(({ count }) => count)).toEqual([2, 1]);
    store.setQuery('zoe');
    expect(store.rows().map(({ name }) => name)).toEqual(['Zoe Park']);
  });

  it('clears the add search when someone starts adding people', () => {
    store.setAddQuery('mor');
    store.startAdding();
    expect(store.addQuery()).toBe('');
    expect(store.addView().heading).toBe('Add a participant');
  });

  it('only offers people who are not in the program yet', () => {
    expect(store.candidates().map(({ name }) => name)).toEqual(['Morgan Reyes']);
    store.setTab('allies');
    store.add('n1');
    expect(addAlly).toHaveBeenCalledWith({ userId: 'n1' });
    expect(store.addView().button).toBe('Add ally');
  });

  it('confirms before removing, with what happens to each role', () => {
    store.askToRemove('u1');
    expect(store.removal()).toEqual(
      expect.objectContaining({
        name: 'Avery Johnson',
        roleLabel: 'Participant in Pilot',
        confirmLabel: 'Remove participant',
      }),
    );
    store.confirmRemove();
    expect(deleteUser).toHaveBeenCalledWith('u1');
    expect(store.removal()).toBeNull();

    store.setTab('allies');
    store.askToRemove('a1');
    expect(store.removal()?.points[0]).toEqual({ text: 'They lose access to Pilot', isKept: false });
    store.cancelRemove();
    expect(deleteAlly).not.toHaveBeenCalled();
  });

  it('shows settings that still need a start date and the plan months', () => {
    expect(store.settingRows().map(({ label, value, needsDate }) => [label, value, needsDate])).toEqual([
      ['Partner', 'Frontline Housing', false],
      ['Start date', 'Not set', true],
      ['End date', 'Not set', false],
      ['Allies', '1 supporting', false],
    ]);
    expect(store.planMonths().map(({ number, hasTasks }) => [number, hasTasks])).toEqual([
      [1, true],
      [2, false],
    ]);
  });
});
