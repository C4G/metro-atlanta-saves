import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import CourseProgressComponent from './course-progress.component';

describe('CourseProgressComponent action requirements', () => {
  const completeRequirement = jest.fn();
  const userProgramProgress = signal([
    {
      requirementId: 'meetup-requirement',
      requirementName: 'Attend a meetup',
      actionInstructions: 'Join the in-person meetup and check in with the coordinator.',
      dueAt: '2026-11-15T23:59:00.000Z',
      dueLabel: 'Nov 15, 2026',
      isActionRequirement: true,
      canComplete: true,
      isCompleted: false,
      status: 'TODO',
      completionLink: 'https://example.com/meetup-details',
    },
  ]);

  let fixture: ComponentFixture<CourseProgressComponent>;

  beforeEach(() => {
    completeRequirement.mockReset();
    userProgramProgress.update((tasks) => tasks.map((task) => ({ ...task, isCompleted: false, canComplete: true })));
    TestBed.configureTestingModule({
      imports: [CourseProgressComponent],
      providers: [
        {
          provide: UsersOnProgramsStore,
          useValue: {
            userProgramProgress,
            setRequirementCompletion: completeRequirement,
            savingRequirementIds: signal([]),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CourseProgressComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows the task type, due date, and completion control without action instructions', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).not.toContain('Join the in-person meetup and check in with the coordinator.');
    expect(text).toContain('Action Task');
    expect(text).toContain('Due date');
    expect(text).toContain('Nov');
    expect(text).toContain('2026');
    expect(text).toContain('Open content');

    const card = fixture.nativeElement.querySelector('#meetup-requirement') as HTMLElement;
    const link = card.querySelector('a') as HTMLAnchorElement;
    expect(card.tagName).toBe('ARTICLE');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect((card.querySelector('button') as HTMLButtonElement).ariaLabel).toBe('Mark Attend a meetup complete');
  });

  it('marks the selected action requirement complete when the learner clicks the control', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(completeRequirement).toHaveBeenCalledWith({ requirementId: 'meetup-requirement', isCompleted: true });
  });

  it('allows undoing a completed action task', () => {
    userProgramProgress.update((tasks) => tasks.map((task) => ({ ...task, isCompleted: true })));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(false);
    expect(completeRequirement).toHaveBeenCalledWith({ requirementId: 'meetup-requirement', isCompleted: false });
  });

  it('allows unchecking completed program requirements without a read-only badge', () => {
    userProgramProgress.update((tasks) =>
      tasks.map((task) => ({ ...task, isActionRequirement: false, canComplete: true, isCompleted: true })),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Program Requirement');
    expect(fixture.nativeElement.querySelector('article').textContent).not.toContain('Read only');
    expect(fixture.nativeElement.querySelector('article').textContent).toContain('Completed');
    const button = fixture.nativeElement.querySelector('article button') as HTMLButtonElement;
    button.click();
    expect(completeRequirement).toHaveBeenCalledWith({ requirementId: 'meetup-requirement', isCompleted: false });
  });
});
