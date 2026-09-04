import { DOCUMENT } from '@angular/common';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ForgotResponse, UserFull } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { firstValueFrom, pipe, switchMap } from 'rxjs';

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  password: string;
  token: string;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type AuthState = {
  authRefreshed: boolean;
  loading: boolean;
  user: null | UserFull;
  realUser: null | UserFull;
};

const initialState: AuthState = {
  authRefreshed: false,
  loading: true, // Start as true to prevent guards from running before auth is checked
  user: null,
  realUser: null,
};

const BASE_URL = '/api/auth';
const LEGACY_AUTH_COOKIES = ['accessToken', 'originalToken'];

export const clearLegacyAuthCookies = (document: Document): void => {
  for (const name of LEGACY_AUTH_COOKIES) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    initials: computed<string>(() => {
      if (!user()?.firstName || !user()?.lastName) {
        return '';
      }
      return `${user()?.firstName.charAt(0)}${user()?.lastName.charAt(0)}`;
    }),
    isAdmin: computed<boolean>(() => user()?.role === 'Administrator'),
    isStaff: computed<boolean>(() => user()?.role === 'Administrator' || user()?.role === 'Partner_Staff'),
  })),
  withMethods(
    (
      store,
      snackBar = inject(MatSnackBar),
      router = inject(Router),
      http = inject(HttpClient),
      dialogRef = inject(MatDialog),
      document = inject(DOCUMENT),
    ) => {
      const update = (data: { user?: AuthState['user']; realUser?: AuthState['realUser'] }): void => {
        patchState(store, { user: data.user, realUser: data.realUser });
      };

      const currentUser = () => http.get<UserFull>('/api/users/me', { withCredentials: true });

      const navigateAfterAuthChange = async (): Promise<void> => {
        const currentUrl = router.url;
        // Try to stay on current route, fall back to dashboard if user lacks access
        try {
          await router.navigateByUrl('/', { skipLocationChange: true });
          const navigationSuccess = await router.navigateByUrl(currentUrl);
          if (!navigationSuccess) {
            await router.navigateByUrl('/dashboard');
          }
        } catch {
          // If navigation fails, go to dashboard
          await router.navigateByUrl('/dashboard');
        }
      };

      const mimicUser = rxMethod<string>(
        pipe(
          switchMap((userId) =>
            http
              .post(`${BASE_URL}/scoped-impersonate`, { userId, returnPath: router.url }, { withCredentials: true })
              .pipe(
                switchMap(() => currentUser()),
                tapResponse({
                  next: async (user) => {
                    dialogRef.closeAll();
                    const realUser = store.user();
                    update({ user, realUser });
                    snackBar.open(`You are now mimicking ${user.firstName} ${user.lastName}`, undefined, {
                      panelClass: 'success',
                      duration: 5000,
                    });
                    await navigateAfterAuthChange();
                  },
                  error: () => {
                    snackBar.open(
                      'There was an error mimicking the user, please check the email and try again',
                      undefined,
                      { panelClass: 'error', duration: 5000 },
                    );
                  },
                }),
              ),
          ),
        ),
      );

      const login = rxMethod<LoginData>(
        pipe(
          switchMap((requestData) =>
            http.post(`${BASE_URL}/sign-in/email`, requestData, { withCredentials: true }).pipe(
              switchMap(() => currentUser()),
              tapResponse({
                next: (user) => {
                  update({ user });
                  snackBar.open('You have been signed in!', undefined, { panelClass: 'success', duration: 5000 });
                  const route = user.firstProgramId ? `program-profiles/${user.firstProgramId}/savings` : '/';
                  router.navigate([route]);
                },
                error: () => {
                  snackBar.open(
                    'There was an error signing you in, please check your credentials and try again',
                    undefined,
                    { panelClass: 'error', duration: 5000 },
                  );
                },
              }),
            ),
          ),
        ),
      );

      const register = rxMethod<RegisterData>(
        pipe(
          switchMap((requestData) =>
            http
              .post(
                `${BASE_URL}/sign-up/email`,
                {
                  ...requestData,
                  name: `${requestData.firstName} ${requestData.lastName}`.trim(),
                },
                { withCredentials: true },
              )
              .pipe(
                switchMap(() => currentUser()),
                tapResponse({
                  next: (user) => {
                    update({ user });
                    snackBar.open('You have signed up, welcome to Building Resilient Professionals!', undefined, {
                      panelClass: 'success',
                      duration: 5000,
                    });
                    router.navigate(['/dashboard']);
                  },
                  error: () => {
                    snackBar.open('There was an error signing you up, please try again.', undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      );

      const forgotPassword = rxMethod<ForgotPasswordData>(
        pipe(
          switchMap((requestData) =>
            http
              .post<ForgotResponse>(
                `${BASE_URL}/request-password-reset`,
                {
                  ...requestData,
                  redirectTo: '/reset-password',
                },
                { withCredentials: true },
              )
              .pipe(
                tapResponse({
                  next: ({ message }) => {
                    snackBar.open(message, undefined, {
                      panelClass: 'success',
                      duration: 5000,
                    });
                    router.navigate(['/']);
                  },
                  error: () => {
                    snackBar.open('There was an error requesting password reset, please try again.', undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      );

      const resetPassword = rxMethod<ResetPasswordData>(
        pipe(
          switchMap((requestData) =>
            http
              .post(
                `${BASE_URL}/reset-password`,
                {
                  newPassword: requestData.password,
                  token: requestData.token,
                },
                { withCredentials: true },
              )
              .pipe(
                tapResponse({
                  next: () => {
                    update({ user: null, realUser: null });
                    snackBar.open('Your password was reset. Please sign in again.', undefined, {
                      panelClass: 'success',
                      duration: 5000,
                    });
                    router.navigate(['/']);
                  },
                  error: () => {
                    snackBar.open('There was an error resetting your password, please try again.', undefined, {
                      panelClass: 'error',
                      duration: 5000,
                    });
                  },
                }),
              ),
          ),
        ),
      );

      const logout = async (): Promise<void> => {
        await firstValueFrom(http.post(`${BASE_URL}/sign-out`, {}, { withCredentials: true }));
        clearLegacyAuthCookies(document);
        update({ user: null, realUser: null });
        snackBar.open('You have been logged out!', undefined, {
          panelClass: 'success',
          duration: 5000,
        });
        await navigateAfterAuthChange();
      };

      const patch = rxMethod<Partial<UserFull>>(
        pipe(
          switchMap((userData) =>
            http.patch<UserFull>('/api/users/me', userData, { withCredentials: true }).pipe(
              tapResponse({
                next: (user) => {
                  patchState(store, (state) => ({ user: { ...state.user, ...user } }));
                  dialogRef.closeAll();
                  snackBar.open('Your profile has been updated!', undefined, {
                    panelClass: 'success',
                    duration: 5000,
                  });
                },
                error: () => {
                  snackBar.open('There was an error updating your profile, please try again.', undefined, {
                    panelClass: 'error',
                    duration: 5000,
                  });
                },
              }),
            ),
          ),
        ),
      );

      const stopMimickingUser = async (): Promise<void> => {
        const name = `${store.user()?.firstName} ${store.user()?.lastName}`;
        try {
          const user = await firstValueFrom(
            http
              .post(`${BASE_URL}/scoped-stop-impersonating`, {}, { withCredentials: true })
              .pipe(switchMap(() => currentUser())),
          );
          update({ user, realUser: null });
        } catch {
          snackBar.open('There was an error stopping impersonation, please try again.', undefined, {
            panelClass: 'error',
            duration: 5000,
          });
          return;
        }
        snackBar.open(`You are no longer mimicking ${name}`, undefined, {
          panelClass: 'success',
          duration: 5000,
        });
      };

      return {
        update,
        stopMimickingUser,
        mimicUser,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        patch,
      };
    },
  ),
  withHooks({
    onInit(store, http = inject(HttpClient), document = inject(DOCUMENT)) {
      clearLegacyAuthCookies(document);
      http.get<UserFull>('/api/users/me', { withCredentials: true }).subscribe({
        next: (user) => patchState(store, { user, realUser: null, loading: false, authRefreshed: true }),
        error: () => patchState(store, { user: null, realUser: null, loading: false, authRefreshed: true }),
      });
    },
  }),
);

export type AuthStore = InstanceType<typeof AuthStore>;
