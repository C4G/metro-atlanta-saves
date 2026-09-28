import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RichTextEditorComponent } from '@mas/frontend-shared-components';
import { EmailBlastStore } from './email-blast.store';

@Component({
  selector: 'mas-email-blast',
  imports: [RichTextEditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailBlastStore],
  template: `
    <main class="admin-content-shell campaign-workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Member communication</p>
          <h1>Email campaign</h1>
          <p>
            Send a thoughtful update to every BRP member. Review the subject and message carefully before publishing.
          </p>
        </div>
        <div class="audience-note">
          <mat-icon aria-hidden="true">groups</mat-icon>
          <span>All registered users</span>
        </div>
      </header>
      <form #form="ngForm" class="campaign-editor" [formGroup]="emailForm" (ngSubmit)="onSubmit()">
        <section class="campaign-brief">
          <div class="campaign-brief__icon"><mat-icon aria-hidden="true">mark_email_unread</mat-icon></div>
          <div>
            <h2>Compose your message</h2>
            <p>This email will be sent to every registered user.</p>
          </div>
        </section>
        <div class="campaign-fields">
          <mat-form-field>
            <mat-label>Subject</mat-label>
            <input matInput formControlName="subject" cdkFocusInitial />
            @if (
              (emailForm.get('subject')?.touched || form.submitted) && emailForm.get('subject')?.errors?.['required']
            ) {
              <mat-error>Subject is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Discussion board ID (optional)</mat-label>
            <input matInput formControlName="discussionBoardId" placeholder="e.g. abc123" (input)="updateBodyLink()" />
            <mat-hint>Adds a direct discussion link to your message.</mat-hint>
          </mat-form-field>
        </div>
        <section class="message-editor">
          <div class="message-editor__label">
            <div>
              <h2>Message</h2>
              <p>Keep the main point near the beginning and use short sections for easy scanning.</p>
            </div>
            <span>Required</span>
          </div>
          <mas-rich-text-editor formControlName="body" minHeight="220px" />
          @if ((emailForm.get('body')?.touched || form.submitted) && emailForm.get('body')?.errors?.['required']) {
            <mat-error>Body is required.</mat-error>
          }
        </section>
        <footer class="campaign-actions">
          <p>
            <mat-icon aria-hidden="true">info</mat-icon>
            This action sends the message to all registered users.
          </p>
          <button mat-raised-button color="primary" type="submit" [disabled]="emailBlastStore.sending()">
            <mat-icon>{{ emailBlastStore.sending() ? 'progress_activity' : 'send' }}</mat-icon>
            {{ emailBlastStore.sending() ? 'Sending...' : 'Send campaign' }}
          </button>
        </footer>
      </form>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .campaign-workspace {
      max-width: 74rem;
      margin: 0 auto;
      padding: clamp(1.25rem, 3vw, 2.5rem);
    }
    .workspace-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .eyebrow {
      margin: 0 0 0.5rem;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.11em;
      text-transform: uppercase;
    }
    h1,
    h2 {
      color: var(--text-primary, inherit);
      letter-spacing: -0.035em;
    }
    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 750;
    }
    .workspace-header > div > p:last-child {
      max-width: 42rem;
      margin: 0.75rem 0 0;
      color: var(--text-secondary, inherit);
      line-height: 1.6;
    }
    .audience-note {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.8rem;
      border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
      border-radius: 0.75rem;
      color: var(--primary);
      font-size: 0.82rem;
      font-weight: 700;
    }
    .audience-note mat-icon {
      width: 1.1rem;
      height: 1.1rem;
      font-size: 1.1rem;
    }
    .campaign-editor {
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1.1rem;
      background: var(--surface-card, transparent);
    }
    .campaign-brief {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 10%, transparent);
    }
    .campaign-brief__icon {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border-radius: 0.7rem;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
    }
    .campaign-brief__icon mat-icon {
      width: 1.2rem;
      height: 1.2rem;
      font-size: 1.2rem;
    }
    .campaign-brief h2,
    .message-editor h2 {
      margin: 0;
      font-size: 1rem;
    }
    .campaign-brief p,
    .message-editor p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 0.84rem;
    }
    .campaign-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      padding: 1.25rem 1.25rem 0.5rem;
    }
    .message-editor {
      padding: 0.75rem 1.25rem 1.25rem;
    }
    .message-editor__label {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    .message-editor__label > span {
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .campaign-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 10%, transparent);
    }
    .campaign-actions p {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      color: var(--text-secondary, inherit);
      font-size: 0.82rem;
    }
    .campaign-actions p mat-icon {
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }
    .campaign-actions button {
      min-height: 2.8rem;
      border-radius: 0.75rem;
    }
    @media (max-width: 40rem) {
      .workspace-header,
      .campaign-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .audience-note {
        width: fit-content;
      }
      .campaign-fields {
        grid-template-columns: 1fr;
      }
      .campaign-actions button {
        width: 100%;
      }
    }
  `,
  host: {
    class: 'block',
  },
})
export default class EmailBlastComponent {
  private fb = inject(FormBuilder);
  emailBlastStore = inject(EmailBlastStore);

  readonly discussionBaseUrl = 'https://brpatl.com/discussion';

  emailForm = this.fb.group({
    subject: this.fb.nonNullable.control('', [Validators.required]),
    discussionBoardId: this.fb.nonNullable.control(''),
    body: this.fb.nonNullable.control('', [Validators.required]),
  });

  updateBodyLink() {
    const id = this.emailForm.get('discussionBoardId')?.value?.trim();
    const link = id ? `${this.discussionBaseUrl}/${id}` : this.discussionBaseUrl;
    const linkHtml = `<p><a href="${link}">Join the Discussion &rarr;</a></p>`;
    const current: string = this.emailForm.get('body')?.value ?? '';
    const withoutOld = current
      .replace(/<p><a href="https:\/\/brpatl\.com\/discussion[^"]*">Join the Discussion.*?<\/a><\/p>/g, '')
      .trim();
    this.emailForm.get('body')?.setValue(withoutOld + '\n' + linkHtml);
  }

  onSubmit() {
    if (this.emailForm.invalid) {
      return;
    }

    const { discussionBoardId, ...payload } = this.emailForm.getRawValue();
    this.emailBlastStore.sendEmail({
      ...payload,
      onSuccess: () => this.emailForm.reset(),
    });
  }
}
