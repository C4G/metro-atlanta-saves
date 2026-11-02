import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MainNavStore, ProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import ProgramProfileComponent from './program-profile.component';
import { programProfilesRoutes } from '../program-profiles.routes';

@Component({ selector: 'mas-test-program-page', template: '' })
class Page {}

describe('Program pages shell', () => {
  afterEach(() => TestBed.resetTestingModule());
  const setup = async (isStaff: boolean, url = '/program-profiles/program-1/progress') => {
    TestBed.configureTestingModule({
      imports: [ProgramProfileComponent],
      providers: [
        provideRouter([{ path: 'program-profiles/:id/:page', component: Page }]),
        {
          provide: AuthStore,
          useValue: { user: signal({ id: 'user-1' }), isStaff: signal(isStaff), isAdmin: signal(false) },
        },
        {
          provide: ProgramsStore,
          useValue: { program: signal({ id: 'program-1', name: 'Pilot' }), getProgram: jest.fn() },
        },
        {
          provide: UsersOnProgramsStore,
          useValue: { setProgramId: jest.fn(), getUsers: jest.fn(), getUserOnProgram: jest.fn() },
        },
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(ProgramProfileComponent);
    fixture.componentRef.setInput('id', 'program-1');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const tabs = () =>
      Array.from(element.querySelectorAll('nav[aria-label="Program pages"] a')).map((link) =>
        link.textContent?.replace(/\s+/g, ' ').trim(),
      );
    const toggle = (): HTMLButtonElement | null => element.querySelector('nav[aria-label="Program pages"] button');
    return { fixture, element, tabs, toggle, nav: TestBed.inject(MainNavStore) };
  };

  it('titles the page with the program and tells the navbar which program is open', async () => {
    const { element, nav } = await setup(false);

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Pilot');
    expect(nav.program()).toEqual({ id: 'program-1', name: 'Pilot' });
  });

  it('shows only the open page until the arrow slides out the other two', async () => {
    const { fixture, tabs, toggle } = await setup(false, '/program-profiles/program-1/insights');
    expect(tabs()).toEqual(['insights My insights']);
    expect(toggle()?.getAttribute('aria-expanded')).toBe('false');

    toggle()?.click();
    fixture.detectChanges();

    expect(tabs()).toEqual(['trending_up My progress', 'groups Participants', 'insights My insights']);
    expect(toggle()?.getAttribute('aria-label')).toBe('Hide other program pages');
  });

  it('gives staff the roster tab without an arrow', async () => {
    const { tabs, toggle } = await setup(true, '/program-profiles/program-1/particpants');

    expect(tabs()).toEqual(['groups Participants']);
    expect(toggle()).toBeNull();
  });

  it('clears the program from the navbar when leaving', async () => {
    const { fixture, nav } = await setup(false);

    fixture.destroy();

    expect(nav.program()).toBeNull();
  });

  it.each(['receipts', 'savings', 'course-progress'])('redirects the old %s URL to the monthly tracker', (path) => {
    const loadChildren = programProfilesRoutes[0].loadChildren;
    const children = loadChildren ? loadChildren() : [];
    expect(Array.isArray(children) && children.find((route) => route.path === path)?.redirectTo).toBe('progress');
  });
});
