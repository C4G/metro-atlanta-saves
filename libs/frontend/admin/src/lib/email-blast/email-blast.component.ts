import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { EmailBlastStore } from './email-blast.store';

@Component({
  selector: 'mas-email-blast',
  imports: [EditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EmailBlastStore],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-3">Email Campaign</h2>
      <p class="mb-4 text-sm text-gray-500">
        Send an email to all users. Fill in a Discussion Board ID to automatically include a link to that board.
      </p>
      <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="emailForm" (ngSubmit)="onSubmit()">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <mat-form-field class="sm:col-span-2">
            <mat-label>Subject</mat-label>
            <input matInput formControlName="subject" cdkFocusInitial />
            @if (
              (emailForm.get('subject')?.touched || form.submitted) && emailForm.get('subject')?.errors?.['required']
            ) {
              <mat-error>Subject is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field class="sm:col-span-2">
            <mat-label>Discussion Board ID (optional)</mat-label>
            <input matInput formControlName="discussionBoardId" placeholder="e.g. abc123" (input)="updateBodyLink()" />
            <mat-hint>Creates a direct link to brpatl.com/discussion/&lt;id&gt; in the email</mat-hint>
          </mat-form-field>
        </div>
        <div>
          <mat-label>Body</mat-label>
          <editor
            apiKey="goqs3emxc9qfnlk1vk4gq4a1ciccd4vlpl7e02cruoew0y9v"
            formControlName="body"
            [init]="{
              license_key: 'gpl',
              base_url: '/tinymce',
              suffix: '.min',
              plugins: 'lists link table code help wordcount',
              toolbar:
                'undo redo | blocks | bold italic | numlist bullist | alignleft aligncenter alignright alignjustify | outdent indent',
              promotion: false,
              skin: themeService.darkMode() ? 'oxide-dark' : undefined,
              content_css: themeService.darkMode() ? 'dark' : undefined,
            }"
          />
          @if ((emailForm.get('body')?.touched || form.submitted) && emailForm.get('body')?.errors?.['required']) {
            <mat-error>Body is required.</mat-error>
          }
        </div>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="emailBlastStore.sending()"
          class="w-fit ml-auto"
        >
          {{ emailBlastStore.sending() ? 'Sending...' : 'Send to All Users' }}
        </button>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class EmailBlastComponent {
  private fb = inject(FormBuilder);
  themeService = inject(ThemeService);
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
