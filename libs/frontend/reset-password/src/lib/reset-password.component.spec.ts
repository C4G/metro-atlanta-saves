import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  const resetPassword = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: { resetPassword } }],
    });
  });
  afterEach(() => TestBed.resetTestingModule());
  it('shows recovery guidance instead of an unusable form when a token is missing', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Request a new password link');
    fixture.componentInstance.submitForm();
    expect(resetPassword).not.toHaveBeenCalled();
  });
  it('blocks mismatched passwords and preserves the token and password when valid', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.componentRef.setInput('token', 'reset-token');
    fixture.componentInstance.resetPasswordForm.setValue({ password: 'Password123!', confirmPassword: 'different' });
    fixture.componentInstance.submitForm();
    expect(resetPassword).not.toHaveBeenCalled();
    expect(fixture.componentInstance.resetPasswordForm.hasError('passwordMismatch')).toBe(true);
    fixture.componentInstance.resetPasswordForm.controls.confirmPassword.setValue('Password123!');
    fixture.componentInstance.submitForm();
    expect(resetPassword).toHaveBeenCalledWith({ password: 'Password123!', token: 'reset-token' });
  });
  it('handles invalid-token callbacks and supports new-account password setup', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.componentRef.setInput('token', 'token');
    fixture.componentRef.setInput('error', 'INVALID_TOKEN');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    fixture.componentRef.setInput('error', '');
    fixture.componentRef.setInput('set', 'true');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Set your password');
    fixture.nativeElement.querySelector('button[aria-label="Show passwords"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#reset-password').type).toBe('text');
    expect(fixture.nativeElement.querySelector('#reset-confirm-password').type).toBe('text');
  });
});
