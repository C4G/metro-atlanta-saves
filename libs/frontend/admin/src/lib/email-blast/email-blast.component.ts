import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { RichTextEditorComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { EmailBlastStore, type EmailCampaignAudience } from './email-blast.store';
import { EmailRecipientModalComponent } from './email-recipient-modal.component';

@Component({
  selector: 'mas-email-blast',
  imports: [
    SpinnerComponent,
    RichTextEditorComponent,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailBlastStore],
  template: `
    <div class="p-6">
      <h2 class="mb-3 text-2xl font-bold">Email Campaign</h2>
      <p class="mb-4 text-sm text-gray-500">Choose individual users, one discussion board, or one program.</p>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="emailForm" (ngSubmit)="onSubmit()">
        <section aria-labelledby="recipients-heading" class="rounded-xl border border-gray-200 p-4">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 id="recipients-heading" class="font-bold">Recipients</h3>
              <p class="text-sm text-gray-500">{{ audienceSummary() || 'No recipients selected' }}</p>
            </div>
            <button mat-stroked-button type="button" (click)="openRecipientPicker()">
              {{ recipientEmails().length ? 'Change recipients' : 'Choose recipients' }}
            </button>
          </div>
          @if (resolvingRecipients()) {
            <p class="text-sm text-gray-500">Loading recipient emails…</p>
          }
          @if (recipientEmails().length) {
            <div class="flex flex-wrap gap-2" aria-label="Selected recipient email addresses">
              @for (email of recipientEmails(); track email) {
                <span
                  class="max-w-full break-all rounded-full border border-brand/25 bg-surface-raised/70 px-3 py-1 text-xs text-ink"
                >
                  {{ email }}
                </span>
              }
            </div>
          }
        </section>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <mat-form-field class="sm:col-span-2">
            <mat-label>Subject</mat-label>
            <input matInput formControlName="subject" cdkFocusInitial />
            @if (
              (emailForm.get('subject')?.touched || form.submitted) && emailForm.get('subject')?.errors?.['required']
            ) {
              <mat-error>Subject is required.</mat-error>
            }
          </mat-form-field>
        </div>
        <div>
          <mat-label>Body</mat-label>
          <mas-rich-text-editor formControlName="body" minHeight="220px" />
          @if ((emailForm.get('body')?.touched || form.submitted) && emailForm.get('body')?.errors?.['required']) {
            <mat-error>Body is required.</mat-error>
          }
        </div>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="
            emailBlastStore.sending() ||
            emailForm.invalid ||
            !selectedAudience() ||
            !recipientEmails().length ||
            resolvingRecipients()
          "
          class="ml-auto w-fit"
        >
          <span class="relative inline-flex items-center justify-center">
            <span [class.invisible]="emailBlastStore.sending()">{{ submitLabel() }}</span>
            @if (emailBlastStore.sending()) {
              <mas-spinner class="absolute" />
              <span class="sr-only">Sending campaign</span>
            }
          </span>
        </button>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export default class EmailBlastComponent {
  private readonly document = inject(DOCUMENT);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly emailBlastStore = inject(EmailBlastStore);
  private readonly discussionBaseUrl = `${this.document.location?.origin || 'https://metroatlantasaves.com'}/discussion`;
  private appendedBoardId: string | null = null;
  readonly selectedAudience = signal<EmailCampaignAudience | null>(null);
  readonly recipientEmails = signal<string[]>([]);
  readonly resolvingRecipients = signal(false);
  readonly audienceSummary = computed(() => {
    const audience = this.selectedAudience();
    if (!audience) return '';
    if (audience.type === 'users') return `${audience.userIds.length} individual users`;
    return `${this.recipientEmails().length} recipients from ${audience.type === 'board' ? 'discussion board' : 'program'}`;
  });
  readonly submitLabel = computed(() =>
    this.recipientEmails().length ? `Send to ${this.recipientEmails().length} recipients` : 'Select recipients',
  );
  emailForm = this.fb.group({
    subject: this.fb.nonNullable.control('', [Validators.required]),
    body: this.fb.nonNullable.control('', [Validators.required]),
  });

  async openRecipientPicker(): Promise<void> {
    const audience = await firstValueFrom(
      this.dialog
        .open(EmailRecipientModalComponent, {
          width: 'min(100% - 2rem, 44rem)',
          maxWidth: '44rem',
          maxHeight: 'calc(100dvh - 2rem)',
          autoFocus: false,
          data: this.selectedAudience(),
        })
        .afterClosed(),
    );
    if (!audience) return;
    this.resolvingRecipients.set(true);
    this.selectedAudience.set(null);
    this.recipientEmails.set([]);
    this.updateBoardLink(null);
    try {
      const result = await firstValueFrom(
        this.http.post<{ emails: string[] }>('/api/users/campaign-recipients', { audience }),
      );
      if (!result.emails.length) {
        this.snackBar.open('This audience has no eligible email recipients.', undefined, {
          panelClass: 'error',
          duration: 5000,
        });
        return;
      }
      this.selectedAudience.set(audience);
      this.recipientEmails.set(result.emails);
      this.updateBoardLink(audience);
    } catch {
      this.snackBar.open('There was an error loading recipient emails.', undefined, {
        panelClass: 'error',
        duration: 5000,
      });
    } finally {
      this.resolvingRecipients.set(false);
    }
  }

  private updateBoardLink(audience: EmailCampaignAudience | null): void {
    const bodyControl = this.emailForm.controls.body;
    let body = bodyControl.value;
    if (this.appendedBoardId) {
      body = this.removeBoardLink(body, this.appendedBoardId).trimEnd();
    }
    this.appendedBoardId = audience?.type === 'board' ? audience.boardId : null;
    if (this.appendedBoardId) {
      const link = `${this.discussionBaseUrl}/${encodeURIComponent(this.appendedBoardId)}`;
      const linkHtml = `<p><a href="${link}">Join the Discussion &rarr;</a></p>`;
      body = `${body.trimEnd()}${body.trim() ? '\n' : ''}${linkHtml}`;
    }
    bodyControl.setValue(body);
  }

  private removeBoardLink(body: string, boardId: string): string {
    const url = `${this.discussionBaseUrl}/${encodeURIComponent(boardId)}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkPattern = new RegExp(
      `<p>\\s*<a\\b[^>]*href=["']${url}["'][^>]*>Join the Discussion(?:\\s*&rarr;|\\s*→)?</a>\\s*</p>`,
      'g',
    );
    return body.replace(linkPattern, '');
  }

  onSubmit(): void {
    const audience = this.selectedAudience();
    if (this.emailForm.invalid || !audience || !this.recipientEmails().length) return;
    const { subject, body } = this.emailForm.getRawValue();
    this.emailBlastStore.sendEmail({
      subject,
      body,
      audience,
      onSuccess: () => {
        this.emailForm.reset();
        this.appendedBoardId = null;
        this.selectedAudience.set(null);
        this.recipientEmails.set([]);
      },
    });
  }
}
