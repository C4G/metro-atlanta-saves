import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '@mas/frontend-shared-auth';
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
    isEnrolled: true,
    isCompleted: false,
  };
  const user = signal<{ id: string } | null>({ id: 'user-1' });
  const isStaff = signal(false);
  let store: InstanceType<typeof ParticipantRequirementsStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ParticipantRequirementsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: AuthStore, useValue: { user, isStaff } },
      ],
    });
    store = TestBed.inject(ParticipantRequirementsStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
    user.set({ id: 'user-1' });
    isStaff.set(false);
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

  it('filters requirements and lists programs with task counts', () => {
    const otherTask: ParticipantRequirement = { ...task, id: 'task-2', programId: 'program-2', programName: 'Alpha' };
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task, otherTask, { ...task, id: 'task-3' }]);

    expect(store.programs()).toEqual([
      { id: 'program-2', name: 'Alpha', taskCount: 1, isVisible: true },
      { id: 'program-1', name: 'Pilot', taskCount: 2, isVisible: true },
    ]);
    expect(store.allProgramsVisible()).toBe(true);

    store.toggleProgram('program-1');
    expect(store.allProgramsVisible()).toBe(false);
    expect(store.visiblePrograms().map(({ id }) => id)).toEqual(['program-2']);
    expect(store.visibleRequirements().map(({ id }) => id)).toEqual(['task-2']);
    expect(
      Object.values(store.tasksByDate())
        .flat()
        .map(({ id }) => id),
    ).toEqual(['task-2']);

    store.hideAllPrograms();
    expect(store.visibleRequirements()).toEqual([]);
    store.showAllPrograms();
    expect(store.visibleRequirements()).toHaveLength(3);

    store.setProgramQuery('alp');
    expect(store.matchingPrograms().map(({ name }) => name)).toEqual(['Alpha']);
  });

  it('builds calendar links for enrolled and staff-only requirements', () => {
    store.load();
    http
      .expectOne('/api/users-on-programs/user/requirements')
      .flush([task, { ...task, id: 'task-2', programId: 'program-2', isEnrolled: false, canComplete: false }]);

    const links = Object.values(store.tasksByDate())
      .flat()
      .map(({ link }) => link);
    expect(links).toEqual([
      ['/program-profiles', 'program-1', 'progress'],
      ['/partner-staff/programs', 'program-2', 'progress'],
    ]);
  });

  it('never offers admins or partner staff a check-off, even in programs they joined', () => {
    isStaff.set(true);
    store.load();
    http.expectOne('/api/users-on-programs/user/requirements').flush([task]);

    const [staffTask] = Object.values(store.tasksByDate()).flat();
    expect(staffTask).toEqual(
      expect.objectContaining({ canComplete: false, link: ['/partner-staff/programs', 'program-1', 'progress'] }),
    );
  });

  it('saves the program selection for the signed-in user and restores it on the next visit', () => {
    localStorage.setItem('mas-calendar-hidden-programs:user-2', JSON.stringify(['program-9']));
    TestBed.tick();

    store.toggleProgram('program-1');
    TestBed.tick();
    expect(localStorage.getItem('mas-calendar-hidden-programs:user-1')).toBe('["program-1"]');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ParticipantRequirementsStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: AuthStore, useValue: { user, isStaff } },
      ],
    });
    store = TestBed.inject(ParticipantRequirementsStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    expect(store.hiddenProgramIds()).toEqual(['program-1']);

    user.set({ id: 'user-2' });
    TestBed.tick();
    expect(store.hiddenProgramIds()).toEqual(['program-9']);

    store.showAllPrograms();
    TestBed.tick();
    expect(localStorage.getItem('mas-calendar-hidden-programs:user-2')).toBeNull();
    expect(localStorage.getItem('mas-calendar-hidden-programs:user-1')).toBe('["program-1"]');
  });

  it('ignores unreadable saved selections', () => {
    localStorage.setItem('mas-calendar-hidden-programs:user-2', '{not json');
    user.set({ id: 'user-2' });
    TestBed.tick();
    expect(store.hiddenProgramIds()).toEqual([]);
  });

  it('does not restore or save a selection before anyone is signed in', () => {
    user.set(null);
    TestBed.tick();
    store.toggleProgram('program-1');
    TestBed.tick();
    expect(localStorage.length).toBe(0);
  });
});
