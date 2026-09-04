import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthStore, clearLegacyAuthCookies } from './auth.store';

describe('AuthStore managed sessions', () => {
  const user = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    role: null,
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
        { provide: MatDialog, useValue: { closeAll: jest.fn() } },
        {
          provide: Router,
          useValue: { url: '/dashboard', navigate: jest.fn(), navigateByUrl: jest.fn().mockResolvedValue(true) },
        },
      ],
    });
  });

  it('loads the current user from the server on initialization', () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    const session = http.expectOne('/api/auth/get-session');

    expect(session.request.withCredentials).toBe(true);
    session.flush({ session: { id: 'session-1' }, user: { id: user.id } });
    const req = http.expectOne('/api/users/me');
    expect(req.request.withCredentials).toBe(true);
    req.flush(user);

    expect(store.user()).toEqual(user);
    expect(store.authRefreshed()).toBe(true);
  });

  it('signs in through Better Auth and refreshes the server-owned profile', () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);

    store.login({ email: user.email, password: 'Password123!' });
    const signIn = http.expectOne('/api/auth/sign-in/email');
    expect(signIn.request.withCredentials).toBe(true);
    signIn.flush({ token: null, user: { id: user.id } });
    http.expectOne('/api/users/me').flush(user);

    expect(store.user()).toEqual(user);
  });

  it('signs out the managed session and clears local auth state', async () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush({ session: { id: 'session-1' }, user: { id: user.id } });
    http.expectOne('/api/users/me').flush(user);

    const logout = store.logout();
    const signOut = http.expectOne('/api/auth/sign-out');
    expect(signOut.request.withCredentials).toBe(true);
    signOut.flush({});
    await logout;

    expect(store.user()).toBeNull();
    expect(store.realUser()).toBeNull();
  });

  it('starts impersonation with a target ID and retains the originating profile locally', () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush({ session: { id: 'session-1' }, user: { id: user.id } });
    http.expectOne('/api/users/me').flush(user);

    const target = { ...user, id: 'target-1', firstName: 'Target' };
    store.mimicUser('target-1');

    const start = http.expectOne('/api/auth/scoped-impersonate');
    expect(start.request.withCredentials).toBe(true);
    expect(start.request.body).toEqual({ userId: 'target-1', returnPath: '/dashboard' });
    start.flush({});
    http.expectOne('/api/users/me').flush(target);

    expect(store.user()).toEqual(target);
    expect(store.realUser()).toEqual(user);
  });

  it('returns from impersonation through the server and clears the originating profile', async () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush({ session: { id: 'session-1' }, user: { id: user.id } });
    http.expectOne('/api/users/me').flush({ ...user, id: 'target-1', firstName: 'Target' });
    store.update({ user: { ...user, id: 'target-1', firstName: 'Target' }, realUser: user });

    const stop = store.stopMimickingUser();
    const stopRequest = http.expectOne('/api/auth/scoped-stop-impersonating');
    expect(stopRequest.request.withCredentials).toBe(true);
    stopRequest.flush({});
    http.expectOne('/api/users/me').flush(user);
    await stop;

    expect(store.user()).toEqual(user);
    expect(store.realUser()).toBeNull();
  });

  it('expires only the legacy auth cookies during cutover', () => {
    const writes: string[] = [];
    const document = {
      set cookie(value: string) {
        writes.push(value);
      },
    } as unknown as Document;

    clearLegacyAuthCookies(document);

    expect(writes).toEqual([
      'accessToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;',
      'originalToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;',
    ]);
    expect(writes.join(';')).not.toContain('unrelated');
  });

  it('does not attempt to write legacy cookies during SSR initialization', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/auth/get-session').flush(null);
    http.expectNone('/api/users/me');

    expect(store.authRefreshed()).toBe(true);
  });
});
