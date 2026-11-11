import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import ProgramProfileComponent from './program-profile.component';
import { programProfilesRoutes } from '../program-profiles.routes';

@Component({ selector: 'mas-test-program-page', template: '' })
class Page {}

describe('Participant program navigation', () => {
  afterEach(() => TestBed.resetTestingModule());
  const setup = (isStaff: boolean) => {
    TestBed.configureTestingModule({
      imports: [ProgramProfileComponent],
      providers: [
        // Created outside an outlet, the header's relative links resolve from the root.
        provideRouter([{ path: ':section', component: Page }]),
        { provide: AuthStore, useValue: { isStaff: () => isStaff } },
        {
          provide: ProgramsStore,
          useValue: {
            program: signal({ name: 'Pilot', description: '<p>This is the pilot program.</p>' }),
            getProgram: jest.fn(),
          },
        },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            percentageCompleted: () => 0,
            userProgramSavings: () => '$0',
            userCreditIncrease: () => 25,
            setProgramId: jest.fn(),
            getUsers: jest.fn(),
            getUserOnProgram: jest.fn(),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProgramProfileComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    return { fixture, element };
  };
  const headerLinks = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('header nav a')).map((link) => link.textContent?.replace(/\s+/g, ' ').trim());

  it('lists my progress and my insights above the roster, with no summary card or back link', () => {
    const { element } = setup(false);
    expect(element.querySelector('header')?.textContent).toContain('This is the pilot program.');
    expect(headerLinks(element)).toEqual(['monitoring My Progress', 'insights My Insights', 'groups Participants']);
    expect(element.querySelector('[aria-label="Program summary"]')).toBeNull();
    expect(element.querySelector('nav[aria-label="Program sections"]')).toBeNull();
    expect(element.textContent).not.toContain('Back to dashboard');
  });

  it('marks the open page in the header', async () => {
    const { fixture, element } = setup(false);
    await TestBed.inject(Router).navigateByUrl('/insights');
    fixture.detectChanges();
    const current = element.querySelector('header nav a[aria-current="page"]');
    expect(current?.textContent).toContain('My Insights');
  });

  it('only offers the roster to staff', () => {
    const { element } = setup(true);
    expect(headerLinks(element)).toEqual(['groups Participants']);
  });

  it.each(['receipts', 'savings', 'course-progress'])('redirects the old %s URL to the monthly tracker', (path) => {
    const loadChildren = programProfilesRoutes[0].loadChildren;
    const children = loadChildren ? loadChildren() : [];
    expect(Array.isArray(children) && children.find((route) => route.path === path)?.redirectTo).toBe('progress');
  });
});
