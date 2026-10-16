import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParticipantRequirement } from '@mas/models';
import { ParticipantRequirementsStore } from './participant-requirements.store';

describe('ParticipantRequirementsStore', () => {
  const task: ParticipantRequirement = {
    id: 'task-1',
    name: 'Attend a meetup',
    programId: 'program-1',
    programName: 'Pilot',
    dueAt: '2026-10-20T12:00:00Z',
    canComplete: true,
    isCompleted: false,
  };
  let store: InstanceType<typeof ParticipantRequirementsStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ParticipantRequirementsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(ParticipantRequirementsStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('allows checking a program requirement with no action instructions', () => {
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task]);
    store.toggle(task);
    const request = http.expectOne('/api/users-on-programs/user/program/program-1/requirements/task-1/completion');
    expect(request.request.method).toBe('POST');
    request.flush({});
    expect(store.requirements()[0].isCompleted).toBe(true);
  });

  it('prevents duplicate writes and persists completion after the server succeeds', () => {
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task]);
    store.toggle(task);
    store.toggle(task);
    expect(store.savingTaskIds()).toEqual(['task-1']);
    const request = http.expectOne('/api/users-on-programs/user/program/program-1/requirements/task-1/completion');
    expect(request.request.method).toBe('POST');
    expect(store.requirements()[0].isCompleted).toBe(false);
    request.flush({});
    expect(store.requirements()[0].isCompleted).toBe(true);
    expect(store.savingTaskIds()).toEqual([]);
  });

  it('undoes a completed action after the server confirms deletion', () => {
    const completed = { ...task, isCompleted: true };
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([completed]);
    store.toggle(completed);
    const request = http.expectOne('/api/users-on-programs/user/program/program-1/requirements/task-1/completion');
    expect(request.request.method).toBe('DELETE');
    expect(store.requirements()[0].isCompleted).toBe(true);
    request.flush({ requirementId: task.id });
    expect(store.requirements()[0].isCompleted).toBe(false);
    expect(store.savingTaskIds()).toEqual([]);
  });

  it('preserves completion and clears pending state when undo fails', () => {
    const completed = { ...task, isCompleted: true };
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([completed]);
    store.toggle(completed);
    http
      .expectOne('/api/users-on-programs/user/program/program-1/requirements/task-1/completion')
      .flush({}, { status: 500, statusText: 'Failed' });
    expect(store.requirements()[0].isCompleted).toBe(true);
    expect(store.savingTaskIds()).toEqual([]);
  });

  it('exposes loading failures and allows retry without showing an empty calendar as success', () => {
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush({}, { status: 500, statusText: 'Failed' });
    expect(store.loadFailed()).toBe(true);
    expect(store.loading()).toBe(false);
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task]);
    expect(store.loadFailed()).toBe(false);
    expect(store.requirements()).toEqual([task]);
  });
});
