import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TaskReviewStore } from '@mas/frontend-shared-data-access';
import { TaskReviewData } from '@mas/models';
import MonthlyProgressComponent from './monthly-progress.component';

describe('MonthlyProgressComponent', () => {
  const completedAt = '2026-10-16T12:00:00.000Z';
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  const person = (id: string, firstName: string, lastName: string, completed: string[]) => ({
    id,
    firstName,
    lastName,
    email: `${id}@example.com`,
    requirementStatus: [],
    completions: completed.map((requirementId) => ({
      requirementId,
      completedAt: new Date(completedAt),
      verifiedAt: null,
      verifiedBy: null,
    })),
    checkpoints: [],
  });
  const data: TaskReviewData = {
    startDate: start.toISOString(),
    months: Array.from({ length: 6 }, (_, index) => ({ name: `Month ${index + 1}`, number: index + 1 })),
    requirements: [
      { id: 'orientation', name: 'Orientation', dueAt: null, month: 1, educationalContentId: null },
      { id: 'review', name: 'Credit report review', dueAt: null, month: 4, educationalContentId: null },
      { id: 'receipts', name: 'Upload deposit receipts', dueAt: null, month: 4, educationalContentId: null },
    ],
    participants: [
      person('brianna', 'Brianna', 'Lee', ['orientation', 'review']),
      person('carlos', 'Carlos', 'Mendez', ['orientation', 'review', 'receipts']),
      person('dana', 'Dana', 'Whitfield', []),
    ],
  };
  const setup = () => {
    TestBed.configureTestingModule({
      imports: [MonthlyProgressComponent],
      // The program shell provides and loads the shared monthly review data.
      providers: [TaskReviewStore, provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MonthlyProgressComponent);
    fixture.componentRef.setInput('id', 'program-1');
    TestBed.inject(TaskReviewStore).load('program-1');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/users-on-programs/program/program-1/task-review').flush(data);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const button = (name: string) =>
      Array.from(element.querySelectorAll('button')).find(
        (item) =>
          item.getAttribute('aria-label') === name ||
          item.textContent?.trim().startsWith(name) ||
          // Buttons led by an icon read as "icon-name Label".
          item.textContent?.trim().endsWith(name),
      );
    const roster = () =>
      Array.from(element.querySelectorAll('[aria-label="Participants this month"] li button')).map((item) =>
        item.textContent?.replace(/\s+/g, ' ').trim(),
      );
    return { fixture, http, element, button, roster };
  };
  afterEach(() => TestBed.resetTestingModule());

  it('opens on the current month with its roster, totals and the first participant', () => {
    const { element, button, roster } = setup();
    expect(element.querySelector('#focused-month-heading')?.textContent).toContain('Month 4');
    expect(button('Current month')?.disabled).toBe(true);
    // The month bar shows only the month and its navigation.
    expect(element.textContent).not.toContain('Finished everything');
    expect(roster()).toEqual([
      expect.stringContaining('Brianna Lee'),
      expect.stringContaining('Carlos Mendez'),
      expect.stringContaining('Dana Whitfield'),
    ]);
    expect(roster()[0]).toContain('1 to review');
    expect(element.querySelector('aside')?.textContent).toContain('Brianna Lee');
  });

  it('filters the roster and moves between months', () => {
    const { fixture, element, button, roster } = setup();
    button('Not finished')?.click();
    fixture.detectChanges();
    expect(roster()).toEqual([expect.stringContaining('Brianna Lee'), expect.stringContaining('Dana Whitfield')]);

    button('Previous month')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#focused-month-heading')?.textContent).toContain('Month 3');
    expect(button('Current month')?.disabled).toBe(false);
    button('Current month')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#focused-month-heading')?.textContent).toContain('Month 4');
  });

  it('records a staff review and moves to the next participant waiting for review', () => {
    const { fixture, http, element, button } = setup();
    const checkboxes = Array.from(element.querySelectorAll<HTMLInputElement>('aside input[type="checkbox"]'));
    expect(checkboxes.map((item) => item.disabled)).toEqual([false, true]);
    checkboxes[0].click();
    const request = http.expectOne(
      '/api/users-on-programs/program/program-1/participants/brianna/requirements/review/verification',
    );
    expect(request.request.body).toEqual({ verified: true, completedAt });
    request.flush({ requirementId: 'review', completedAt, verifiedAt: completedAt, verifiedBy: null });
    fixture.detectChanges();
    expect(element.querySelector('aside')?.textContent).toContain('Reviewed');

    button('Next participant to review')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#selected-month-heading')?.textContent).toContain('Carlos Mendez');
  });

  it('shows every month in the grid and opens a month from a cell', () => {
    const { fixture, element, button } = setup();
    button('All months grid')?.click();
    fixture.detectChanges();
    const headers = Array.from(element.querySelectorAll('thead abbr')).map((item) => item.textContent?.trim());
    expect(headers).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
    expect(element.querySelector('tbody tr:last-child')?.textContent).toContain('2 months open');

    button('Dana Whitfield, Month 1: 0 of 1 tasks complete, 0 waiting for review. Open this month')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#focused-month-heading')?.textContent).toContain('Month 1');
    expect(element.querySelector('#selected-month-heading')?.textContent).toContain('Dana Whitfield');
  });
});
