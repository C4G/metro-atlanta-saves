import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import { RequirementsCalendarComponent } from './requirements-calendar.component';

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

    const cardLink = fixture.nativeElement.querySelector('article a');
    expect(cardLink.getAttribute('href')).toBe('/program-profiles/program-1/progress#requirement-1');
    expect(fixture.nativeElement.textContent).toContain('Due today');
    expect(fixture.nativeElement.textContent).toContain('End of day');

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
