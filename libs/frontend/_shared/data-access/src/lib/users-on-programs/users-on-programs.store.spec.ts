import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersOnProgramsStore } from './users-on-programs.store';

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
  const calculateCreditScoreChange = (checkpoints: { name: string; creditScore: number | null; createdAt: Date }[]) => {
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
    http.expectOne('/api/users-on-programs/user/program/program-1').flush({ checkpoints });
    const change = store.userCreditIncrease();
    http.verify();
    TestBed.resetTestingModule();
    return change;
  };
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
