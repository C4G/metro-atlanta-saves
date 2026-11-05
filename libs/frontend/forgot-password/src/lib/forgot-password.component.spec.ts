import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  it('does not show validation errors when untouched empty fields lose focus', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    for (const input of Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[]) {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    }
    expect(fixture.nativeElement.querySelector('[aria-invalid="true"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(forgotPassword).not.toHaveBeenCalled();
  });
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
    expect(forgotPassword).toHaveBeenCalledWith({ email: 'member@example.com', onSent: expect.any(Function) });
  });
  it('shows the check-your-email screen once the link is sent and can send it again', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    fixture.componentInstance.forgotPasswordForm.setValue({ email: 'member@example.com' });
    fixture.componentInstance.submitForm();
    forgotPassword.mock.calls[0][0].onSent();
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toContain('Check your email');
    expect(element.textContent).toContain('member@example.com');
    (
      Array.from(element.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('send it again'),
      ) as HTMLButtonElement
    ).click();
    forgotPassword.mock.calls[1][0].onSent();
    fixture.detectChanges();
    expect(element.textContent).toContain('We sent the link again.');
    (
      Array.from(element.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Use a different email'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(element.querySelector('h1')?.textContent).toContain('Reset your password');
    expect(fixture.componentInstance.forgotPasswordForm.controls.email.value).toBe('');
  });
  it('rejects missing and invalid email with visible field guidance', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type=submit]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Enter the email connected to your account',
    );
    expect(fixture.nativeElement.querySelector('#recovery-email-error').textContent).toContain(
      'Enter your email address',
    );
    expect(forgotPassword).not.toHaveBeenCalled();
    fixture.componentInstance.forgotPasswordForm.setValue({ email: 'invalid' });
    fixture.componentInstance.submitForm();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it('waits for the button before pointing out a mistyped email', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#recovery-email') as HTMLInputElement;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#recovery-email-error')).toBeNull();
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#recovery-email-error').textContent).toContain(
      'Enter an email like name@example.com',
    );
  });
});
