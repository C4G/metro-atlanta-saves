import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  const forgotPassword = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: { forgotPassword } }],
    });
  });
  afterEach(() => TestBed.resetTestingModule());
  it('normalizes the email before delegating to the shared auth store', () => {
    const component = TestBed.createComponent(ForgotPasswordComponent).componentInstance;
    component.forgotPasswordForm.setValue({ email: ' MEMBER@EXAMPLE.COM ' });
    component.submitForm();
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'member@example.com' });
  });
  it('rejects missing and invalid email with visible field guidance', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type=submit]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Please enter your email address',
    );
    expect(forgotPassword).not.toHaveBeenCalled();
    fixture.componentInstance.forgotPasswordForm.setValue({ email: 'invalid' });
    fixture.componentInstance.submitForm();
    expect(forgotPassword).not.toHaveBeenCalled();
  });
});
