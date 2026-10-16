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

  it('keeps completed and non-action requirements read only', () => {
    store.complete({ ...task, isCompleted: true });
    store.complete({ ...task, canComplete: false });
    http.expectNone((request) => request.method !== 'GET');
  });

  it('prevents duplicate writes and persists completion after the server succeeds', () => {
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task]);
    store.complete(task);
    store.complete(task);
    expect(store.savingTaskIds()).toEqual(['task-1']);
    const request = http.expectOne('/api/users-on-programs/user/program/program-1/requirements/task-1/completion');
    expect(request.request.method).toBe('POST');
    expect(store.requirements()[0].isCompleted).toBe(false);
    request.flush({});
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
