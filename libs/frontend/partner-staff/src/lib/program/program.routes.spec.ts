import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { programRoutes } from './program.routes';

@Component({ selector: 'mas-test-program-shell', imports: [RouterOutlet], template: '<router-outlet />' })
class Shell {}
@Component({ selector: 'mas-test-program-page', template: 'Program content' })
class Page {}

describe('Program workspace routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'partner-staff/programs/:id',
            children: programRoutes.map((route) => ({
              ...route,
              loadComponent: undefined,
              resolve: undefined,
              component: route.children ? Shell : Page,
              children: route.children?.map((child) => ({
                ...child,
                loadComponent: undefined,
                resolve: undefined,
                component: child.redirectTo ? undefined : Page,
              })),
            })),
          },
        ]),
      ],
    }),
  );
  afterEach(() => TestBed.resetTestingModule());
  it.each([
    ['', '/manage'],
    ['/edit', '/manage'],
    ['/users', '/manage'],
    ['/allies', '/manage'],
    ['/enrollments', '/manage'],
    ['/documents', '/manage'],
    ['/document-management', '/manage'],
    ['/cohort-percentage-completion', '/insights'],
    ['/task-review', '/progress'],
    ['/requirements', '/tasks'],
    ['/insights', '/insights'],
    ['/users/person-1', '/users/person-1'],
  ])('preserves entry point %s', async (from, to) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/partner-staff/programs/program-1${from}`);
    expect(TestBed.inject(Router).url).toBe(`/partner-staff/programs/program-1${to}`);
  });
});
