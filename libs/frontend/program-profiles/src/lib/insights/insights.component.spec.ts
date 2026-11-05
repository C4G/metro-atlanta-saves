import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import InsightsComponent from './insights.component';

describe('InsightsComponent', () => {
  const setup = (checkpoints: unknown[]) => {
    TestBed.configureTestingModule({
      imports: [InsightsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: ProgramsStore, useValue: { program: signal({ startDate: null }) } },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            userProgramProgress: signal([
              { requirementId: 'a', requirementName: 'Orientation', month: 1, isCompleted: true, dueAt: null },
              {
                requirementId: 'b',
                requirementName: 'Budgeting',
                month: 1,
                isCompleted: false,
                dueAt: '2030-01-05T12:00:00Z',
              },
            ]),
            percentageCompleted: signal(50),
            userProgramSavings: signal('$100.00'),
            userCreditIncrease: signal(0),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(InsightsComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/checkpoints/my/program/program-1')
      .flush({
        checkpointNames: [1, 2].map((number) => ({ name: `Month ${number}`, type: 'Savings', sequence: number })),
        checkpoints,
      });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, element };
  };
  afterEach(() => TestBed.resetTestingModule());

  it('shows the overall progress cards, the savings chart and the months, without coming up', () => {
    const { element } = setup([
      {
        id: 'entry-1',
        name: 'Month 1',
        savedMoney: 100,
        creditScore: 640,
        application: null,
        updatedAt: '2026-10-11T12:00:00Z',
        images: [{ id: 'img-1', imageVerified: false }],
      },
    ]);
    const text = element.textContent?.replace(/\s+/g, ' ') ?? '';
    const headings = Array.from(element.querySelectorAll('h2')).map((heading) => heading.textContent?.trim());
    expect(headings).toEqual(['Overall progress', 'Savings by month', 'Credit score', 'Months completed']);
    expect(element.querySelector('[aria-label="50 percent of tasks done"]')).not.toBeNull();
    expect(text).not.toContain('1 of 2 tasks');
    expect(text).toContain('+$100.00 in Month 1');
    expect(text).toContain('Across 1 month');
    expect(text).not.toContain('Budgeting');
    expect(text).not.toContain('Coming up');
    expect(text).not.toContain('Month 1: $100.00');
    expect(element.querySelector('[aria-label="Month 2: no savings recorded"]')?.hasAttribute('disabled')).toBe(true);
    const chart = element.querySelector('[aria-labelledby="savings-chart-heading"]')?.textContent?.replace(/\s+/g, ' ');
    expect(chart).toMatch(/Total saved: ?\$100\.00/);
  });

  it('explains empty charts before any monthly update', () => {
    const { element } = setup([]);
    expect(element.textContent).toContain('Add your credit score in a monthly update to see it here.');
    expect(element.textContent).toContain('Add your first monthly update to start the count.');
  });
});
