import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaskReviewStore } from './task-review.store';

describe('TaskReviewStore', () => {
  let store: InstanceType<typeof TaskReviewStore>;
  let http: HttpTestingController;
  const completedAt = new Date('2026-10-16T12:00:00Z');
  const completion = { requirementId: 'task-1', completedAt, verifiedAt: null, verifiedBy: null };
  const data = {
    requirements: [
      { id: 'task-1', name: 'Budget', dueAt: null },
      { id: 'task-2', name: 'Check-in', dueAt: null },
    ],
    participants: [
      {
        id: 'person-1',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'j@example.com',
        requirementStatus: [],
        completions: [completion],
      },
    ],
  };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TaskReviewStore, provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(TaskReviewStore);
    http = TestBed.inject(HttpTestingController);
    store.load('program-1');
    http.expectOne('/api/users-on-programs/program/program-1/task-review').flush(data);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });
  const url = '/api/users-on-programs/program/program-1/participants/person-1/requirements/task-1/verification';
  const submission = {
    userId: 'person-1',
    requirementId: 'task-1',
    completedAt: completedAt.toISOString(),
    verified: true,
  };
  it('saves verification separately from the participant report and prevents duplicate writes', () => {
    store.verify(submission);
    store.verify(submission);
    expect(store.pending()).toEqual(['person-1:task-1']);
    const request = http.expectOne(url);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ verified: true, completedAt: completedAt.toISOString() });
    expect(store.data()?.participants[0].completions[0].verifiedAt).toBeNull();
    const verifiedAt = new Date();
    request.flush({ ...completion, verifiedAt, verifiedBy: { id: 'staff-1', firstName: 'Sam', lastName: 'Lee' } });
    expect(store.data()?.participants[0].completions[0].verifiedAt).toEqual(verifiedAt);
    expect(store.pending()).toEqual([]);
    store.verify({ ...submission, verified: false });
    http.expectOne(url).flush(completion);
    expect(store.data()?.participants[0].completions[0]).toEqual(completion);
  });
  it('keeps the previous status after a stale submission fails, then reloads current data', () => {
    store.verify(submission);
    http.expectOne(url).flush({}, { status: 409, statusText: 'Conflict' });
    expect(store.saveError()).toContain('participant may have changed');
    expect(store.pending()).toEqual([]);
    expect(store.data()?.participants[0].completions[0].verifiedAt).toBeNull();
    store.load('program-1');
    http
      .expectOne('/api/users-on-programs/program/program-1/task-review')
      .flush({ ...data, participants: [{ ...data.participants[0], completions: [] }] });
    expect(store.data()?.participants[0].completions).toEqual([]);
    expect(store.saveError()).toBe('');
  });
  it('reviews a task the participant has not reported by sending no submission time', () => {
    store.verify({ userId: 'person-1', requirementId: 'task-2', verified: true });
    const request = http.expectOne(
      '/api/users-on-programs/program/program-1/participants/person-1/requirements/task-2/verification',
    );
    expect(request.request.body).toEqual({ verified: true });
    const reviewed = {
      requirementId: 'task-2',
      completedAt,
      completedById: 'staff-1',
      verifiedAt: completedAt,
      verifiedBy: null,
    };
    request.flush(reviewed);
    expect(store.data()?.participants[0].completions).toEqual([completion, reviewed]);
  });
  it('never unreviews a task that has no submission', () => {
    store.verify({ userId: 'person-1', requirementId: 'task-2', verified: false });
    http.expectNone((request) => request.method === 'PATCH');
  });
  it('lets staff mark a task done and undo it', () => {
    const completionUrl =
      '/api/users-on-programs/program/program-1/participants/person-1/requirements/task-2/completion';
    store.setCompletion({ userId: 'person-1', requirementId: 'task-2', complete: true });
    const created = {
      requirementId: 'task-2',
      completedAt,
      completedById: 'staff-1',
      verifiedAt: null,
      verifiedBy: null,
    };
    const post = http.expectOne(completionUrl);
    expect(post.request.method).toBe('POST');
    post.flush(created);
    expect(store.data()?.participants[0].completions).toEqual([completion, created]);

    store.setCompletion({ userId: 'person-1', requirementId: 'task-2', complete: false });
    const remove = http.expectOne(completionUrl);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ requirementId: 'task-2' });
    expect(store.data()?.participants[0].completions).toEqual([completion]);
  });
  it('exposes loading errors instead of presenting an empty task list', () => {
    store.load('program-1');
    expect(store.loading()).toBe(true);
    expect(store.data()).toBeNull();
    http
      .expectOne('/api/users-on-programs/program/program-1/task-review')
      .flush({}, { status: 500, statusText: 'Error' });
    expect(store.loadFailed()).toBe(true);
    expect(store.loading()).toBe(false);
    expect(store.data()).toBeNull();
  });
});
