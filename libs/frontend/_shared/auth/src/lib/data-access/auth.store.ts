import { computed, inject, PLATFORM_ID } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ForgotResponse, UserFull } from '@mas/models';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { CookieService } from '../util/cookie.service';
import { isPlatformBrowser } from '@angular/common';
import { decodeJwt, jwtPayloadToUserData } from '../util/jwt-decode';

type ForgotPasswordData = {
  email: string;
};

type ResetPasswordData = {
  email: string;
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
const AUTH_TOKEN_COOKIE = 'accessToken';
const ORIGINAL_TOKEN_COOKIE = 'originalToken';

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
      cookieService = inject(CookieService),
      http = inject(HttpClient),
      dialogRef = inject(MatDialog),
    ) => {
      const update = (data: { user?: AuthState['user']; realUser?: AuthState['realUser'] }): void => {
        patchState(store, { user: data.user, realUser: data.realUser });
        // When mimicking: accessToken = mimicked user, originalToken = real admin
        // When not mimicking: accessToken = current user, no originalToken
        if (data.user?.accessToken) {
          cookieService.setCookie(AUTH_TOKEN_COOKIE, data.user.accessToken, 7);
          // If realUser exists, we're mimicking - store original admin token
          if (data.realUser?.accessToken) {
            cookieService.setCookie(ORIGINAL_TOKEN_COOKIE, data.realUser.accessToken, 7);
          } else {
            // Not mimicking, clear originalToken if it exists
            cookieService.deleteCookie(ORIGINAL_TOKEN_COOKIE);
          }
        } else if (!data.user && !data.realUser) {
          cookieService.deleteCookie(AUTH_TOKEN_COOKIE);
          cookieService.deleteCookie(ORIGINAL_TOKEN_COOKIE);
        }
      };

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
          switchMap((email) =>
            http.post<UserFull>(`${BASE_URL}/mimic-user`, { email }).pipe(
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
            http.post<UserFull>(`${BASE_URL}/signin`, requestData).pipe(
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
            http.post<UserFull>(`${BASE_URL}/signup`, requestData).pipe(
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
            http.post<ForgotResponse>(`${BASE_URL}/forgot-password`, requestData).pipe(
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
            http.post<UserFull>(`${BASE_URL}/reset-password`, requestData).pipe(
              tapResponse({
                next: (user) => {
                  update({ user });
                  snackBar.open(`Your password was reset and you're logged in!`, undefined, {
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
            http.patch<UserFull>(`${BASE_URL}`, { ...userData, id: store.user()?.id }).pipe(
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

      const stopMimickingUser = (): void => {
        const name = `${store.user()?.firstName} ${store.user()?.lastName}`;
        const user = store.realUser();
        // Clean up original token cookie
        cookieService.deleteCookie(ORIGINAL_TOKEN_COOKIE);
        update({ user, realUser: null });
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
    onInit(store, cookieService = inject(CookieService), platformId = inject(PLATFORM_ID)) {
      const isBrowser = isPlatformBrowser(platformId);

      // Check for originalToken to detect if we're mimicking
      const accessToken = cookieService.getCookie(AUTH_TOKEN_COOKIE);
      const originalToken = cookieService.getCookie(ORIGINAL_TOKEN_COOKIE);

      if (accessToken && originalToken) {
        // Mimicking scenario: accessToken = mimicked user, originalToken = real admin
        const userDecoded = decodeJwt(accessToken);
        const realDecoded = decodeJwt(originalToken);

        if (!userDecoded || !realDecoded) {
          // Invalid tokens, clear cookies
          if (isBrowser) {
            cookieService.deleteCookie(AUTH_TOKEN_COOKIE);
            cookieService.deleteCookie(ORIGINAL_TOKEN_COOKIE);
          }
          patchState(store, { loading: false });
          return;
        }

        // Set both mimicked user and real user
        patchState(store, {
          user: {
            ...jwtPayloadToUserData(userDecoded),
            accessToken,
          },
          realUser: {
            ...jwtPayloadToUserData(realDecoded),
            accessToken: originalToken,
          },
          loading: false,
          authRefreshed: true,
        });
      } else if (accessToken) {
        // Normal login scenario
        const decoded = decodeJwt(accessToken);

        if (!decoded) {
          // Invalid token, clear cookie and don't proceed
          if (isBrowser) {
            cookieService.deleteCookie(AUTH_TOKEN_COOKIE);
          }
          patchState(store, { loading: false });
          return;
        }

        // Set user with full decoded JWT data
        patchState(store, {
          user: {
            ...jwtPayloadToUserData(decoded),
            accessToken,
          },
          loading: false,
          authRefreshed: true,
        });
      } else {
        // No token found, not logged in
        patchState(store, { loading: false });
      }
    },
  }),
);

export type AuthStore = InstanceType<typeof AuthStore>;
