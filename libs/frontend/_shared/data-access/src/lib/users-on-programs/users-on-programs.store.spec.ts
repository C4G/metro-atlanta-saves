import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  calculateCreditScoreChange,
  matchesParticipantQuery,
  participantInitials,
  UsersOnProgramsStore,
} from './users-on-programs.store';

describe('UsersOnProgramsStore task completion', () => {
  it.each(['Attend a meetup.', null])(
    'persists check and undo for instructions %s, updates progress, and blocks duplicate requests',
    (actionInstructions) => {
      TestBed.configureTestingModule({
        providers: [
          UsersOnProgramsStore,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialog, useValue: {} },
          { provide: MatSnackBar, useValue: { open: jest.fn() } },
        ],
      });
      const store = TestBed.inject(UsersOnProgramsStore);
      const http = TestBed.inject(HttpTestingController);
      store.setProgramId('program-1');
      store.getUserOnProgram();
      http.expectOne('/api/users-on-programs/user/program/program-1').flush({
        requirementStatus: ['action-1'],
        requirementCompletions: [],
        checkpoints: [],
        program: {
          Requirement: [
            {
              id: 'action-1',
              name: 'Attend',
              actionInstructions,
              dueAt: null,
              EducationalContent: null,
            },
          ],
        },
      });
      const url = '/api/users-on-programs/user/program/program-1/requirements/action-1/completion';
      store.setRequirementCompletion({ requirementId: 'action-1', isCompleted: true });
      store.setRequirementCompletion({ requirementId: 'action-1', isCompleted: true });
      expect(store.savingRequirementIds()).toEqual(['action-1']);
      const complete = http.expectOne(url);
      expect(complete.request.method).toBe('POST');
      complete.flush({ requirementId: 'action-1', completedAt: '2026-10-15T12:00:00Z' });
      expect(store.percentageCompleted()).toBe(100);
      store.setRequirementCompletion({ requirementId: 'action-1', isCompleted: false });
      const undo = http.expectOne(url);
      expect(undo.request.method).toBe('DELETE');
      undo.flush({ requirementId: 'action-1' });
      expect(store.percentageCompleted()).toBe(0);
      expect(store.savingRequirementIds()).toEqual([]);
      http.verify();
      TestBed.resetTestingModule();
    },
  );
});

describe('calculateCreditScoreChange', () => {
  it('compares the first and last numbered months even when their creation timestamps match', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    expect(
      calculateCreditScoreChange([
        { name: 'Month 2', creditScore: 650, createdAt },
        { name: 'Month 1', creditScore: 620, createdAt },
        { name: 'Month 3', creditScore: 675, createdAt },
      ]),
    ).toBe(55);
  });

  it('returns a negative change when the latest month has a lower score', () => {
    expect(
      calculateCreditScoreChange([
        { name: 'Month 1', creditScore: 700, createdAt: new Date('2026-01-01') },
        { name: 'Month 2', creditScore: 680, createdAt: new Date('2026-02-01') },
      ]),
    ).toBe(-20);
  });

  it('ignores checkpoints without a credit score', () => {
    expect(
      calculateCreditScoreChange([
        { name: 'Month 1', creditScore: 610, createdAt: new Date('2026-01-01') },
        { name: 'Month 2', creditScore: null, createdAt: new Date('2026-02-01') },
        { name: 'Month 3', creditScore: 640, createdAt: new Date('2026-03-01') },
      ]),
    ).toBe(30);
  });
});

describe('participant search', () => {
  const jordan = { firstName: 'Jordan', lastName: 'Okafor', bio: 'Saving for a first car' };

  it('builds initials from the first and last name', () => {
    expect(participantInitials({ firstName: ' jordan', lastName: 'okafor' })).toBe('JO');
  });

  it.each([
    ['', true],
    ['  okaf ', true],
    ['FIRST CAR', true],
    ['homebuyer', false],
  ])('matches %p against the name and bio: %p', (query, expected) => {
    expect(matchesParticipantQuery(jordan, query)).toBe(expected);
  });

  it('treats a missing bio as empty', () => {
    expect(matchesParticipantQuery({ ...jordan, bio: null }, 'car')).toBe(false);
  });

  it('filters the roster and adds initials as the query changes', () => {
    TestBed.configureTestingModule({
      providers: [
        UsersOnProgramsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    const store = TestBed.inject(UsersOnProgramsStore);
    const http = TestBed.inject(HttpTestingController);
    store.setProgramId('program-1');
    store.getUsers();
    http
      .expectOne((request) => request.url.includes('/api/users-on-programs'))
      .flush([
        { userId: 'u1', firstName: 'Jordan', lastName: 'Okafor', bio: 'Saving for a first car' },
        { userId: 'u2', firstName: 'Rosa', lastName: 'Patel', bio: null },
      ]);

    expect(store.visibleParticipants().map(({ initials }) => initials)).toEqual(['JO', 'RP']);

    store.setParticipantQuery('rosa');

    expect(store.visibleParticipants().map(({ userId }) => userId)).toEqual(['u2']);
    TestBed.resetTestingModule();
  });
});
