import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  it('does not show validation errors when untouched empty fields lose focus', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    for (const input of Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[]) {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    }
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(register).not.toHaveBeenCalled();
  });
  const register = jest.fn();
  const signInWithGoogle = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { register, signInWithGoogle, initializeGoogle: jest.fn(), googleClientId: signal(null) },
        },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());
  it('normalizes names and email without altering the password', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    component.registerForm.setValue({
      firstName: ' Jordan ',
      lastName: ' Lee ',
      email: ' MEMBER@EXAMPLE.COM ',
      password: 'Password123!',
    });
    component.submitForm();
    expect(register).toHaveBeenCalledWith({
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'member@example.com',
      password: 'Password123!',
    });
  });
  it('rejects whitespace-only names, invalid email, and short passwords', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    component.registerForm.setValue({ firstName: '   ', lastName: '', email: 'invalid', password: 'short' });
    component.submitForm();
    expect(register).not.toHaveBeenCalled();
    expect(component.registerForm.controls.firstName.hasError('required')).toBe(true);
    expect(component.registerForm.controls.password.touched).toBe(true);
  });
  it('labels inputs and lets the user reveal and hide the password', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#register-password') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('button[aria-label="Show password"]') as HTMLButtonElement;
    expect(input.autocomplete).toBe('new-password');
    expect(input.type).toBe('password');
    button.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
  it('keeps Google available even without a local client ID', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const button = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find((item) =>
      item.textContent?.includes('Continue with Google'),
    );
    button?.click();
    expect(signInWithGoogle).toHaveBeenCalledWith('register');
  });
});
