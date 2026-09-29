import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthStore } from './auth.store';

const mockOneTap = jest.fn().mockResolvedValue(undefined);
jest.mock('better-auth/client', () => ({ createAuthClient: () => ({ oneTap: mockOneTap }) }));
jest.mock('better-auth/client/plugins', () => ({ oneTapClient: () => ({ id: 'one-tap' }) }));

describe('AuthStore managed sessions', () => {
  const user = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    role: null,
  } as any;

  beforeEach(() => {
    mockOneTap.mockReset().mockResolvedValue(undefined);
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

  it('requests password reset with a callback on the frontend origin', () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);

    store.forgotPassword({ email: user.email });

    const request = http.expectOne('/api/auth/request-password-reset');
    expect(request.request.body).toEqual({
      email: user.email,
      redirectTo: `${document.location.origin}/reset-password`,
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({ message: 'If the email exists, check your email.' });
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

  it('loads the managed session during SSR initialization', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);

    http.expectOne('/api/auth/get-session').flush(null);
    http.expectNone('/api/users/me');

    expect(store.authRefreshed()).toBe(true);
  });

  it('starts Google OAuth with an application return URL', async () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);

    const start = store.signInWithGoogle('login');
    const request = http.expectOne('/api/auth/sign-in/social');
    expect(request.request.body).toEqual({
      provider: 'google',
      callbackURL: `${document.location.origin}/login?google=success`,
      errorCallbackURL: `${document.location.origin}/login`,
      disableRedirect: true,
    });
    expect(request.request.withCredentials).toBe(true);
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await start;
  });

  it('keeps email sign-in available when Google is disabled', async () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);

    const initialize = store.initializeGoogle('login');
    http.expectOne('/api/google-auth/config').flush({ clientId: null });
    await initialize;
    expect(store.googleClientId()).toBeNull();

    store.login({ email: user.email, password: 'Password123!' });
    http.expectOne('/api/auth/sign-in/email').flush({ user: { id: user.id } });
    http.expectOne('/api/users/me').flush(user);
    expect(store.user()).toEqual(user);
  });

  it('keeps email sign-in available after One Tap is dismissed or blocked', async () => {
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);

    const dismissed = store.initializeGoogle('register');
    http.expectOne('/api/google-auth/config').flush({ clientId: 'public-client-id' });
    await dismissed;
    expect(mockOneTap).toHaveBeenCalledWith(expect.objectContaining({ context: 'signup' }));
    expect(store.googleClientId()).toBe('public-client-id');

    mockOneTap.mockRejectedValueOnce(new Error('Browser blocked prompt'));
    const blocked = store.initializeGoogle('login');
    http.expectOne('/api/google-auth/config').flush({ clientId: 'public-client-id' });
    await blocked;
    expect(mockOneTap).toHaveBeenCalledWith(expect.objectContaining({ context: 'signin' }));

    store.login({ email: user.email, password: 'Password123!' });
    http.expectOne('/api/auth/sign-in/email').flush({ user: { id: user.id } });
    http.expectOne('/api/users/me').flush(user);
    expect(store.user()).toEqual(user);
  });

  it('keeps the Google button available after an OAuth cancellation', async () => {
    const originalUrl = document.location.href;
    window.history.replaceState({}, '', '/login?error=access_denied');
    try {
      const store = TestBed.inject(AuthStore);
      const http = TestBed.inject(HttpTestingController);
      http.expectOne('/api/auth/get-session').flush(null);
      const initialize = store.initializeGoogle('login');
      http.expectOne('/api/google-auth/config').flush({ clientId: 'public-client-id' });
      await initialize;
      expect(store.googleClientId()).toBe('public-client-id');
      expect(mockOneTap).not.toHaveBeenCalled();
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('refreshes the shared user and follows login navigation after a Google return', async () => {
    const originalUrl = document.location.href;
    window.history.replaceState({}, '', '/login?google=success');
    try {
      const store = TestBed.inject(AuthStore);
      const http = TestBed.inject(HttpTestingController);
      const router = TestBed.inject(Router);
      http.expectOne('/api/auth/get-session').flush(null);

      const complete = store.initializeGoogle('login');
      http.expectOne('/api/users/me').flush({ ...user, firstProgramId: 'program-1' });
      await complete;

      expect(store.user()?.id).toBe(user.id);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/program-profiles/program-1/savings');
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('preserves Google auth if the initial session check finishes later', async () => {
    const originalUrl = document.location.href;
    window.history.replaceState({}, '', '/login?google=success');
    try {
      const store = TestBed.inject(AuthStore);
      const http = TestBed.inject(HttpTestingController);
      const initialSession = http.expectOne('/api/auth/get-session');

      const complete = store.initializeGoogle('login');
      http.expectOne('/api/users/me').flush(user);
      await complete;
      initialSession.flush(null);

      expect(store.user()).toEqual(user);
      expect(store.authRefreshed()).toBe(true);
    } finally {
      window.history.replaceState({}, '', originalUrl);
    }
  });

  it('does not request Google configuration when no browser window exists', async () => {
    TestBed.overrideProvider(DOCUMENT, { useValue: { defaultView: null } });
    const store = TestBed.inject(AuthStore);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/get-session').flush(null);
    await store.initializeGoogle('login');
    http.expectNone('/api/google-auth/config');
  });
});
