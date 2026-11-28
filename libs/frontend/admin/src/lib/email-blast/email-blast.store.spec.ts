import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmailBlastStore } from './email-blast.store';

describe('EmailBlastStore', () => {
  let http: HttpTestingController;
  let store: InstanceType<typeof EmailBlastStore>;
  const snackBar = { open: jest.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmailBlastStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(EmailBlastStore);
  });

  afterEach(() => {
    http.verify();
    jest.clearAllMocks();
  });

  it('submits the selected audience and reports a successful send', () => {
    const onSuccess = jest.fn();
    const audience = { type: 'board' as const, boardId: 'board-1' };
    store.sendEmail({ subject: 'Update', body: '<p>Hello</p>', audience, onSuccess });

    const request = http.expectOne('/api/users/send-email');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ subject: 'Update', body: '<p>Hello</p>', audience });
    expect(store.sending()).toBe(true);

    request.flush(null);

    expect(store.sending()).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(snackBar.open).toHaveBeenCalledWith('Campaign email sent successfully', undefined, {
      panelClass: 'success',
      duration: 5000,
    });
  });

  it('clears the sending state and reports a failed send', () => {
    const onSuccess = jest.fn();
    store.sendEmail({
      subject: 'Update',
      body: '<p>Hello</p>',
      audience: { type: 'users', userIds: ['user-1'] },
      onSuccess,
    });
    http.expectOne('/api/users/send-email').flush('Rejected', { status: 500, statusText: 'Server Error' });

    expect(store.sending()).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('There was an error sending the email', undefined, {
      panelClass: 'error',
      duration: 5000,
    });
  });
});
