import { signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../data-access/auth.store';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { partnerStaffGuard } from './partner-staff.guard';

describe('managed-session route guards', () => {
  const user = signal<any>({ id: 'user-1', role: 'Administrator' });
  const authRefreshed = signal(true);
  const router = { createUrlTree: jest.fn((commands: string[]) => commands.join('/')) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthStore,
          useValue: {
            user,
            authRefreshed,
            isAdmin: () => user()?.role === 'Administrator',
            isStaff: () => ['Administrator', 'Partner_Staff'].includes(user()?.role),
          },
        },
        { provide: Router, useValue: router },
      ],
    });
    authRefreshed.set(true);
    user.set({ id: 'user-1', role: 'Administrator' });
    router.createUrlTree.mockClear();
  });

  it('uses the server-loaded role for admin and staff access', () => {
    expect(TestBed.runInInjectionContext(() => authGuard())).toBe(true);
    expect(TestBed.runInInjectionContext(() => adminGuard())).toBe(true);
    expect(TestBed.runInInjectionContext(() => partnerStaffGuard())).toBe(true);

    user.set({ id: 'user-1', role: 'Partner_Staff' });
    expect(TestBed.runInInjectionContext(() => adminGuard())).toBe('/dashboard');
    expect(TestBed.runInInjectionContext(() => partnerStaffGuard())).toBe(true);
  });

  it('waits for the managed session refresh before deciding access', fakeAsync(() => {
    authRefreshed.set(false);
    const result = TestBed.runInInjectionContext(() => authGuard());
    let decision: unknown;

    (result as any).subscribe((value: unknown) => (decision = value));
    tick();
    expect(decision).toBeUndefined();

    authRefreshed.set(true);
    user.set(null);
    tick();
    expect(decision).toBe('/login');
  }));
});
