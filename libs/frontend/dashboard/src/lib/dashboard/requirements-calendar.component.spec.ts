import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';

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
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
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
      },
    ]);
    fixture.detectChanges();

    const cardLink = fixture.nativeElement.querySelector('article a');
    expect(cardLink.getAttribute('href')).toBe('/program-profiles/program-1/course-progress#requirement-1');
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
});
