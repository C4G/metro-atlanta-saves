import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  it('does not show validation errors when untouched empty fields lose focus', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    for (const input of Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[]) {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    }
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(login).not.toHaveBeenCalled();
  });
  const googleClientId = signal<string | null>(null);
  const initializeGoogle = jest.fn();
  const login = jest.fn();
  const signInWithGoogle = jest.fn();

  beforeEach(() => {
    googleClientId.set(null);
    initializeGoogle.mockClear();
    login.mockClear();
    signInWithGoogle.mockClear();

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { googleClientId, initializeGoogle, login, signInWithGoogle },
        },
      ],
    });
  });

  it('presents the branded member sign-in experience', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Sign in to your account');
    expect(fixture.nativeElement.textContent).toContain('Continue with Google');
    expect(initializeGoogle).toHaveBeenCalledWith('login');
  });

  it('normalizes valid credentials before signing in', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.loginForm.setValue({ email: ' MEMBER@EXAMPLE.COM ', password: 'Password123!' });

    fixture.componentInstance.submitForm();

    expect(login).toHaveBeenCalledWith({ email: 'member@example.com', password: 'Password123!' });
  });

  it('clearly identifies missing credentials after submission', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Enter your email and password');
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    expect(login).not.toHaveBeenCalled();
  });

  it('lets members reveal and hide their password', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const passwordInput = fixture.nativeElement.querySelector('#login-password') as HTMLInputElement;
    const visibilityButton = fixture.nativeElement.querySelector(
      'button[aria-label="Show password"]',
    ) as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');
    visibilityButton.click();
    fixture.detectChanges();
    expect(passwordInput.type).toBe('text');
    expect(visibilityButton.getAttribute('aria-label')).toBe('Hide password');
  });

  it('keeps Google sign-in available in the layout when local configuration is unavailable', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const googleButton = [...fixture.nativeElement.querySelectorAll('button')].find((button: HTMLButtonElement) =>
      button.textContent?.includes('Continue with Google'),
    ) as HTMLButtonElement;
    googleButton.click();

    expect(signInWithGoogle).toHaveBeenCalledWith('login');
  });
});
