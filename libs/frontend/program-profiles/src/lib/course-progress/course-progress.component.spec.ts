import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import CourseProgressComponent from './course-progress.component';

describe('CourseProgressComponent action requirements', () => {
  const completeRequirement = jest.fn();
  const userProgramProgress = signal([
    {
      requirementId: 'meetup-requirement',
      requirementName: 'Attend a meetup',
      actionInstructions: 'Join the in-person meetup and check in with the coordinator.',
      dueAt: '2026-11-15T23:59:00.000Z',
      isActionRequirement: true,
      isCompleted: false,
      status: 'TODO',
      completionLink: 'https://example.com/meetup-details',
    },
  ]);

  let fixture: ComponentFixture<CourseProgressComponent>;

  beforeEach(() => {
    completeRequirement.mockReset();
    TestBed.configureTestingModule({
      imports: [CourseProgressComponent],
      providers: [
        { provide: ThemeService, useValue: {} },
        { provide: UsersOnProgramsStore, useValue: { userProgramProgress, completeRequirement } },
      ],
    });
    fixture = TestBed.createComponent(CourseProgressComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows the action instructions, shared due timestamp, and manual completion control', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Join the in-person meetup and check in with the coordinator.');
    expect(text).toContain('Due:');
    expect(text).toContain('2026');
    expect(text).toContain('Mark Complete');
    expect(text).toContain('Open Content');

    const card = fixture.nativeElement.querySelector('.card') as HTMLElement;
    const content = card.querySelector('.card-content');
    const actions = card.querySelector('.card-actions');
    expect(card.classList.contains('flex-col')).toBe(true);
    expect(actions?.previousElementSibling).toBe(content);
    expect(actions?.classList.contains('justify-end')).toBe(true);
    expect((card.querySelector('button') as HTMLButtonElement).classList.contains('whitespace-nowrap')).toBe(true);
  });

  it('marks the selected action requirement complete when the learner clicks the control', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();

    expect(completeRequirement).toHaveBeenCalledWith('meetup-requirement');
  });
});
