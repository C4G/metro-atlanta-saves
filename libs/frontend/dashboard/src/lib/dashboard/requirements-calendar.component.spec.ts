import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import { RequirementsCalendarComponent } from './requirements-calendar.component';

const viewButton = (element: HTMLElement, label: string) =>
  Array.from(element.querySelectorAll<HTMLButtonElement>('[aria-label="Calendar view"] button')).find((button) =>
    button.textContent?.includes(label),
  ) as HTMLButtonElement;

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
};

describe('RequirementsCalendarComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RequirementsCalendarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: AuthStore, useValue: { user: signal({ id: 'user-1' }), isStaff: signal(false) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('links the full task card to its requirement and persists completion from the card control', () => {
    const fixture = TestBed.createComponent(RequirementsCalendarComponent);
    const dueAt = new Date();
    dueAt.setHours(23, 59, 0, 0);

    http.expectOne('/api/users-on-programs/user/requirements').flush([
      {
        id: 'requirement-1',
        name: 'Create a savings plan',
        programId: 'program-1',
        programName: 'Pilot',
        dueAt: dueAt.toISOString(),
        isCompleted: false,
        canComplete: true,
        isEnrolled: true,
      },
    ]);
    fixture.detectChanges();
    viewButton(fixture.nativeElement, 'Month').click();
    fixture.detectChanges();

    const cardLink = fixture.nativeElement.querySelector('a[aria-label="Open Create a savings plan in Pilot"]');
    expect(cardLink.getAttribute('href')).toBe('/program-profiles/program-1/progress#requirement-1');
    expect(fixture.nativeElement.textContent).toContain('Pilot · End of day');
    expect(fixture.nativeElement.textContent).toContain('1 left');

    const completionButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Mark Create a savings plan complete"]',
    );
    completionButton.click();
    fixture.detectChanges();

    expect(completionButton.querySelector('.animate-spin')).not.toBeNull();
    http
      .expectOne('/api/users-on-programs/user/program/program-1/requirements/requirement-1/completion')
      .flush({ requirementId: 'requirement-1', completedAt: new Date().toISOString() });
    fixture.detectChanges();

    const completedButton = fixture.nativeElement.querySelector(
      'button[aria-label="Mark Create a savings plan incomplete"]',
    );
    expect(completedButton.querySelector('svg')).not.toBeNull();
    expect(completedButton.disabled).toBe(false);
    completedButton.click();
    const undo = http.expectOne('/api/users-on-programs/user/program/program-1/requirements/requirement-1/completion');
    expect(undo.request.method).toBe('DELETE');
    undo.flush({ requirementId: 'requirement-1' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Mark Create a savings plan complete"]'),
    ).not.toBeNull();
  });

  it('opens on Due soon with overdue tasks first, the next task up and later tasks in the side panel', () => {
    const fixture = TestBed.createComponent(RequirementsCalendarComponent);
    const base = { programId: 'program-1', programName: 'Pilot', canComplete: true, isEnrolled: true };

    http.expectOne('/api/users-on-programs/user/requirements').flush([
      { ...base, id: 'late', name: 'Upload receipts', dueAt: daysFromNow(-2), isCompleted: false },
      { ...base, id: 'late-done', name: 'Old finished task', dueAt: daysFromNow(-3), isCompleted: true },
      { ...base, id: 'soon', name: 'Record savings', dueAt: daysFromNow(2), isCompleted: false },
      { ...base, id: 'later', name: 'Submit plan', dueAt: daysFromNow(10), isCompleted: false },
      { ...base, id: 'far', name: 'Far away task', dueAt: daysFromNow(35), isCompleted: false },
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const timelineTitles = () =>
      Array.from(element.querySelectorAll('ol article h4')).map((title) => title.textContent?.trim());
    const nextUp = () => element.querySelector('aside[aria-label="Next up"]')?.textContent ?? '';

    expect(viewButton(element, 'Due soon').getAttribute('aria-pressed')).toBe('true');
    expect(viewButton(element, 'Due soon').textContent).toContain('2');
    expect(timelineTitles()).toEqual(['Upload receipts', 'Record savings', 'Submit plan']);
    expect(element.textContent).toContain('Overdue');
    expect(element.textContent).toContain('In 2 days');
    expect(element.textContent).toContain('Later');
    expect(element.textContent).not.toContain('Old finished task');
    expect(element.textContent).not.toContain('Far away task');
    expect(element.querySelector('#due-task-late')?.textContent).toContain('Next up');
    expect(nextUp()).toContain('Upload receipts');

    element.querySelector<HTMLButtonElement>('button[aria-label="Show Submit plan in the timeline"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#due-task-later')?.classList).toContain('ring-2');

    element
      .querySelector<HTMLButtonElement>('#due-task-late button[aria-label="Mark Upload receipts complete"]')
      ?.click();
    http
      .expectOne('/api/users-on-programs/user/program/program-1/requirements/late/completion')
      .flush({ requirementId: 'late', completedAt: new Date().toISOString() });
    fixture.detectChanges();

    expect(timelineTitles()).toEqual(['Record savings', 'Submit plan']);
    expect(nextUp()).toContain('Record savings');
    expect(element.querySelector('#due-task-soon')?.textContent).toContain('Next up');

    const nav = (label: string) =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('[aria-label="Calendar navigation"] button')).find(
        (button) => button.getAttribute('aria-label') === label || button.textContent?.trim() === label,
      ) as HTMLButtonElement;
    nav('Next week').click();
    fixture.detectChanges();
    expect(timelineTitles()).toEqual(['Submit plan', 'Far away task']);
    expect(element.querySelector('ol')?.textContent).toContain(' – ');
    expect(viewButton(element, 'Due soon').textContent).toContain('1');

    nav('Today').click();
    fixture.detectChanges();
    expect(timelineTitles()).toEqual(['Record savings', 'Submit plan']);

    viewButton(element, 'Month').click();
    fixture.detectChanges();
    expect(nav('Next month')).toBeTruthy();
    expect(element.textContent).toContain('Selected day');
  });

  it('points to the Month view when nothing is due soon', () => {
    const fixture = TestBed.createComponent(RequirementsCalendarComponent);
    http.expectOne('/api/users-on-programs/user/requirements').flush([
      {
        id: 'far',
        name: 'Far away task',
        programId: 'program-1',
        programName: 'Pilot',
        dueAt: daysFromNow(45),
        isCompleted: false,
        canComplete: true,
        isEnrolled: true,
      },
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Nothing due in the next 30 days');
    Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Open the month'))
      ?.click();
    fixture.detectChanges();
    expect(viewButton(element, 'Month').getAttribute('aria-pressed')).toBe('true');
  });

  it('filters calendar tasks from the programs dropdown', () => {
    const fixture = TestBed.createComponent(RequirementsCalendarComponent);
    const dueAt = new Date();
    dueAt.setHours(23, 59, 0, 0);
    const requirement = { dueAt: dueAt.toISOString(), isCompleted: false, canComplete: true, isEnrolled: true };

    http.expectOne('/api/users-on-programs/user/requirements').flush([
      {
        ...requirement,
        id: 'requirement-1',
        name: 'Create a savings plan',
        programId: 'program-1',
        programName: 'Pilot',
      },
      { ...requirement, id: 'requirement-2', name: 'Attend a workshop', programId: 'program-2', programName: 'Spring' },
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const trigger = element.querySelector<HTMLButtonElement>('button[aria-controls="calendar-program-filter"]');
    const panel = () => document.querySelector<HTMLElement>('#calendar-program-filter');
    const checkbox = (name: string) =>
      Array.from(panel()?.querySelectorAll('label') ?? [])
        .find((label) => label.textContent?.includes(name))
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const panelButton = (text: string) =>
      Array.from(panel()?.querySelectorAll('button') ?? []).find((button) => button.textContent?.trim() === text);

    expect(trigger?.textContent).toContain('All programs');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('article')).toHaveLength(2);

    trigger?.click();
    fixture.detectChanges();
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(checkbox('Pilot')?.checked).toBe(true);

    checkbox('Spring')?.click();
    fixture.detectChanges();
    expect(trigger?.textContent?.replace(/\s+/g, ' ').trim()).toContain('Programs 1');
    expect(trigger?.getAttribute('aria-label')).toBe('Filter calendar by program, 1 of 2 selected');
    expect(element.textContent).toContain('Create a savings plan');
    expect(element.textContent).not.toContain('Attend a workshop');

    panelButton('Clear')?.click();
    fixture.detectChanges();
    expect(trigger?.textContent?.replace(/\s+/g, ' ').trim()).toContain('Programs 0');
    expect(element.querySelectorAll('article')).toHaveLength(0);
    expect(element.textContent).toContain('No programs selected');

    panelButton('Select all')?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('article')).toHaveLength(2);
    expect(trigger?.textContent).toContain('All programs');

    panelButton('Done')?.click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('links staff tasks to the month in Tasks Review with a read-only icon', () => {
    const fixture = TestBed.createComponent(RequirementsCalendarComponent);
    const dueAt = new Date();
    dueAt.setHours(23, 59, 0, 0);

    http.expectOne('/api/users-on-programs/user/requirements').flush([
      {
        id: 'requirement-1',
        name: 'Pull a credit report',
        programId: 'program-2',
        programName: 'Credit builders',
        dueAt: dueAt.toISOString(),
        isCompleted: false,
        canComplete: false,
        isEnrolled: false,
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('article a').getAttribute('href')).toBe(
      '/partner-staff/programs/program-2/progress#requirement-1',
    );
    expect(fixture.nativeElement.querySelector('article [aria-pressed]')).toBeNull();
    expect(fixture.nativeElement.querySelector('article [title="Read-only requirement"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label^="Mark"]')).toBeNull();
  });

  it('restores the saved program selection after a reload', () => {
    const dueAt = new Date();
    dueAt.setHours(23, 59, 0, 0);
    const requirements = ['program-1', 'program-2'].map((programId) => ({
      id: `requirement-${programId}`,
      name: `Task for ${programId}`,
      programId,
      programName: programId === 'program-1' ? 'Pilot' : 'Spring',
      dueAt: dueAt.toISOString(),
      isCompleted: false,
      canComplete: true,
      isEnrolled: true,
    }));
    const render = () => {
      const fixture = TestBed.createComponent(RequirementsCalendarComponent);
      fixture.detectChanges();
      http.expectOne('/api/users-on-programs/user/requirements').flush(requirements);
      fixture.detectChanges();
      return fixture;
    };

    const first = render();
    first.nativeElement.querySelector('button[aria-controls="calendar-program-filter"]').click();
    first.detectChanges();
    Array.from(document.querySelectorAll('#calendar-program-filter label'))
      .find((label) => label.textContent?.includes('Spring'))
      ?.querySelector<HTMLInputElement>('input[type="checkbox"]')
      ?.click();
    first.detectChanges();
    first.destroy();

    const reloaded = render();
    const element: HTMLElement = reloaded.nativeElement;
    expect(element.querySelector('button[aria-controls="calendar-program-filter"]')?.getAttribute('aria-label')).toBe(
      'Filter calendar by program, 1 of 2 selected',
    );
    expect(element.textContent).toContain('Task for program-1');
    expect(element.textContent).not.toContain('Task for program-2');
  });
});
