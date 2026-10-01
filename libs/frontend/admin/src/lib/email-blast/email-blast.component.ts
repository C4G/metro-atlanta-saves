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
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[74rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="mb-8 flex flex-col items-stretch gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
            Member communication
          </p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
            Email campaign
          </h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Send a thoughtful update to every BRP member. Review the subject and message carefully before publishing.
          </p>
        </div>
        <div
          class="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] px-3 py-2.5 text-[0.82rem] font-bold text-[var(--primary)]"
        >
          <mat-icon class="!size-[1.1rem] !text-[1.1rem]" aria-hidden="true">groups</mat-icon>
          <span>All registered users</span>
        </div>
      </header>
      <form
        #form="ngForm"
        class="overflow-hidden rounded-[1.1rem] border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card)]"
        [formGroup]="emailForm"
        (ngSubmit)="onSubmit()"
      >
        <section
          class="flex items-center gap-3.5 border-b border-[color-mix(in_srgb,var(--text-primary,currentColor)_10%,transparent)] px-5 py-4"
        >
          <div
            class="grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]"
          >
            <mat-icon class="!size-5 !text-xl" aria-hidden="true">mark_email_unread</mat-icon>
          </div>
          <div>
            <h2 class="font-bold tracking-[-0.035em] text-[var(--text-primary)]">Compose your message</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">This email will be sent to every registered user.</p>
          </div>
        </section>
        <div class="grid grid-cols-1 gap-4 px-5 pb-2 pt-5 sm:grid-cols-2">
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
        <section class="px-5 pb-5 pt-3">
          <div class="mb-3 flex items-start justify-between gap-4">
            <div>
              <h2 class="font-bold tracking-[-0.035em] text-[var(--text-primary)]">Message</h2>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Keep the main point near the beginning and use short sections for easy scanning.
              </p>
            </div>
            <span
              class="rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] px-2 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.05em] text-[var(--primary)]"
            >
              Required
            </span>
          </div>
          <mas-rich-text-editor formControlName="body" minHeight="220px" />
          @if ((emailForm.get('body')?.touched || form.submitted) && emailForm.get('body')?.errors?.['required']) {
            <mat-error>Body is required.</mat-error>
          }
        </section>
        <footer
          class="flex flex-col items-stretch gap-4 border-t border-[color-mix(in_srgb,var(--text-primary,currentColor)_10%,transparent)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="flex items-center gap-1.5 text-[0.82rem] text-[var(--text-secondary)]">
            <mat-icon class="!size-4 !text-base" aria-hidden="true">info</mat-icon>
            This action sends the message to all registered users.
          </p>
          <button
            mat-raised-button
            color="primary"
            class="!min-h-11 !w-full !rounded-xl sm:!w-auto"
            type="submit"
            [disabled]="emailBlastStore.sending()"
          >
            <mat-icon>{{ emailBlastStore.sending() ? 'progress_activity' : 'send' }}</mat-icon>
            {{ emailBlastStore.sending() ? 'Sending...' : 'Send campaign' }}
          </button>
        </footer>
      </form>
    </main>
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
