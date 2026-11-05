import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TaskReviewStore } from '@mas/frontend-shared-data-access';
import { TaskReviewData } from '@mas/models';
import TaskReviewComponent from './task-review.component';

describe('TaskReviewComponent', () => {
  const completedAt = new Date('2026-10-16T12:00:00Z');
  const load = jest.fn();
  const verify = jest.fn();
  const initialData: TaskReviewData = {
    startDate: null,
    months: [],
    requirements: [
      { id: 'task-1', name: 'Budget', dueAt: null, month: null },
      { id: 'task-2', name: 'Check-in', dueAt: null, month: null },
    ],
    participants: [
      {
        id: 'person-1',
        firstName: 'Jordan',
        lastName: 'Lee',
        email: 'j@example.com',
        requirementStatus: ['task-2'],
        completions: [{ requirementId: 'task-1', completedAt, verifiedAt: null, verifiedBy: null }],
        checkpoints: [],
      },
    ],
  };
  const data = signal<TaskReviewData>(initialData);
  const failed = signal(false);
  const saveError = signal('');
  let fixture: ComponentFixture<TaskReviewComponent>;
  beforeEach(() => {
    jest.clearAllMocks();
    data.set(initialData);
    failed.set(false);
    saveError.set('');
    TestBed.configureTestingModule({
      imports: [TaskReviewComponent],
      providers: [provideRouter([])],
    }).overrideComponent(TaskReviewComponent, {
      set: {
        providers: [
          {
            provide: TaskReviewStore,
            useValue: {
              data,
              load,
              verify,
              loading: signal(false),
              loadFailed: failed,
              pending: signal([]),
              saveError,
            },
          },
        ],
      },
    });
    fixture = TestBed.createComponent(TaskReviewComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
  });
  afterEach(() => TestBed.resetTestingModule());
  it('shows independent participant and staff fields, with legacy records clearly distinguished', () => {
    expect(load).toHaveBeenCalledWith('program-1');
    expect(fixture.componentInstance.rows()).toHaveLength(2);
    const checkboxes = fixture.nativeElement.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].disabled).toBe(false);
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Reported done');
    expect(fixture.nativeElement.textContent).toContain('Reported by Jordan Lee');
    expect(fixture.nativeElement.querySelector('time').textContent).toContain('Oct 16, 2026');
    expect(fixture.nativeElement.textContent).toContain('Legacy program record');
    checkboxes[1].click();
    expect(verify).not.toHaveBeenCalled();
    checkboxes[0].click();
    expect(verify).toHaveBeenCalledWith({
      userId: 'person-1',
      requirementId: 'task-1',
      completedAt: completedAt.toISOString(),
      verified: true,
    });
    expect(checkboxes[0].checked).toBe(false);
  });
  it('matches the reported-done check and allows staff to undo verification', () => {
    data.set({
      ...initialData,
      participants: initialData.participants.map((participant) => ({
        ...participant,
        completions: participant.completions.map((completion) => ({
          ...completion,
          verifiedAt: completedAt,
          verifiedBy: { id: 'staff-1', firstName: 'Sam', lastName: 'Rivera' },
        })),
      })),
    });
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
    expect(checkbox.nextElementSibling?.textContent?.trim()).toBe('task_alt');
    expect(fixture.nativeElement.textContent).toContain('Verified by Sam Rivera');
    expect(fixture.nativeElement.textContent).not.toContain('Uncheck to undo verification');
    expect(fixture.nativeElement.querySelector('time').textContent).toContain('Oct 16, 2026');
    checkbox.click();
    expect(verify).toHaveBeenCalledWith({
      userId: 'person-1',
      requirementId: 'task-1',
      completedAt: completedAt.toISOString(),
      verified: false,
    });
  });
  it('filters by task, participant text, and review status', () => {
    fixture.componentInstance.status.set('pending');
    expect(fixture.componentInstance.filteredRows()).toHaveLength(1);
    fixture.componentInstance.taskId.set('task-2');
    expect(fixture.componentInstance.filteredRows()).toHaveLength(0);
    fixture.componentInstance.status.set('all');
    fixture.componentInstance.query.set('jordan');
    expect(fixture.componentInstance.filteredRows()).toHaveLength(1);
    fixture.componentInstance.query.set('someone else');
    expect(fixture.componentInstance.filteredRows()).toHaveLength(0);
  });
  it('does not show fake empty results when loading fails', () => {
    failed.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="checkbox"]')).toBeNull();
  });
});
