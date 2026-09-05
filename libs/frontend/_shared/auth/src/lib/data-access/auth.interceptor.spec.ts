import { HttpRequest } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { authServerInterceptor } from './auth-server.interceptor';

describe('managed auth interceptors', () => {
  it('sends browser requests with credentials and no legacy bearer header', () => {
    const next = jest.fn().mockReturnValue(of(undefined));
    const request = new HttpRequest('GET', '/api/users/me');

    authInterceptor(request, next);

    const forwarded = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwarded.withCredentials).toBe(true);
    expect(forwarded.headers.has('authorization')).toBe(false);
  });

  it('forwards the SSR cookie without converting it into a bearer token', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: REQUEST,
          useValue: { headers: new Headers({ cookie: 'better-auth.session_token=session-token' }) },
        },
      ],
    });
    const next = jest.fn().mockReturnValue(of(undefined));
    const request = new HttpRequest('GET', '/api/users/me');

    TestBed.runInInjectionContext(() => authServerInterceptor(request, next));

    const forwarded = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwarded.withCredentials).toBe(true);
    expect(forwarded.headers.get('cookie')).toBe('better-auth.session_token=session-token');
    expect(forwarded.headers.has('authorization')).toBe(false);
  });
});
