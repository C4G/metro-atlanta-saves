import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { EmailBlastStore, type EmailCampaignAudience } from './email-blast.store';
import EmailBlastComponent from './email-blast.component';

describe('EmailBlastComponent', () => {
  let http: HttpTestingController;
  let chosenAudience: EmailCampaignAudience;
  let component: EmailBlastComponent;
  const dialog = {
    open: jest.fn(() => ({ afterClosed: () => of(chosenAudience) })),
  };

  beforeEach(() => {
    chosenAudience = { type: 'board', boardId: 'board-1' };
    dialog.open.mockImplementation(() => ({ afterClosed: () => of(chosenAudience) }) as never);
    TestBed.configureTestingModule({
      imports: [EmailBlastComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    TestBed.overrideComponent(EmailBlastComponent, {
      set: {
        template: '',
        providers: [{ provide: EmailBlastStore, useValue: { sending: signal(false), sendEmail: jest.fn() } }],
      },
    });
    http = TestBed.inject(HttpTestingController);
    component = TestBed.createComponent(EmailBlastComponent).componentInstance;
  });

  afterEach(() => http.verify());

  it('appends the selected board link after the authored message body', async () => {
    component.emailForm.controls.body.setValue('<p>Community update</p>');

    const pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;

    const body = component.emailForm.controls.body.value;
    expect(body.indexOf('<p>Community update</p>')).toBeLessThan(body.indexOf('Join the Discussion'));
    expect(body).toContain('/discussion/board-1');
    expect(component.selectedAudience()).toEqual({ type: 'board', boardId: 'board-1' });
  });

  it('removes the prior board link when switching to an individual audience', async () => {
    component.emailForm.controls.body.setValue('<p>Community update</p>');
    let pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;
    expect(component.emailForm.controls.body.value).toContain('/discussion/board-1');

    chosenAudience = { type: 'users', userIds: ['user-1'] };
    pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;

    expect(component.emailForm.controls.body.value).not.toContain('/discussion/board-1');
    expect(component.selectedAudience()).toEqual({ type: 'users', userIds: ['user-1'] });
  });

  it('replaces an editor-serialized board link when selecting a different board', async () => {
    component.emailForm.controls.body.setValue('<p>Community update</p>');
    let pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;

    const origin = window.location.origin;
    component.emailForm.controls.body.setValue(
      `<p>Community update</p><p><a target="_blank" rel="noopener noreferrer" href="${origin}/discussion/board-1">Join the Discussion →</a></p>`,
    );
    chosenAudience = { type: 'board', boardId: 'board-2' };
    pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;

    expect(component.emailForm.controls.body.value).not.toContain('/discussion/board-1');
    expect(component.emailForm.controls.body.value).toContain('/discussion/board-2');
  });

  it('does not add a board link for an individual audience', async () => {
    chosenAudience = { type: 'users', userIds: ['user-1'] };
    component.emailForm.controls.body.setValue('<p>Community update</p>');

    const pending = component.openRecipientPicker();
    await Promise.resolve();
    http.expectOne('/api/users/campaign-recipients').flush({ emails: ['member@example.com'] });
    await pending;

    expect(component.emailForm.controls.body.value).toBe('<p>Community update</p>');
  });
});
