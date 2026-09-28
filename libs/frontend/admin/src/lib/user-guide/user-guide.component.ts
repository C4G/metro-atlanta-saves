import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserGuideStore } from '@mas/frontend-shared-data-access';
import { RichTextEditorComponent } from '@mas/frontend-shared-components';

@Component({
  selector: 'mas-user-guide',
  imports: [RichTextEditorComponent, ReactiveFormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-content-shell guide-workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Content & guidance</p>
          <h1>User guide</h1>
          <p>Write the practical guidance members need to get started and return with confidence.</p>
        </div>
        <div class="guide-status">
          <mat-icon aria-hidden="true">menu_book</mat-icon>
          <span>Visible to signed-in members</span>
        </div>
      </header>
      <form #form="ngForm" class="guide-editor" [formGroup]="userGuideForm" (ngSubmit)="onSubmit()">
        <section class="editor-intro">
          <div class="editor-intro__icon"><mat-icon aria-hidden="true">edit_note</mat-icon></div>
          <div>
            <h2>Guide content</h2>
            <p>Use headings and short sections so members can quickly find the help they need.</p>
          </div>
        </section>
        <div class="editor-surface">
          <div>
            <mas-rich-text-editor formControlName="body" minHeight="360px" />
            @if (
              (userGuideForm.get('body')?.touched || form.submitted) && userGuideForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
            }
          </div>
        </div>
        <footer class="editor-actions">
          <p>Changes are published to the User Guide when you save.</p>
          <button mat-raised-button color="primary" type="submit">
            <mat-icon>save</mat-icon>
            Save changes
          </button>
        </footer>
      </form>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .guide-workspace {
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
    .guide-status {
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
    .guide-status mat-icon {
      width: 1.1rem;
      height: 1.1rem;
      font-size: 1.1rem;
    }
    .guide-editor {
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 12%, transparent);
      border-radius: 1.1rem;
      background: var(--surface-card, transparent);
    }
    .editor-intro {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 10%, transparent);
    }
    .editor-intro__icon {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border-radius: 0.7rem;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      color: var(--primary);
    }
    .editor-intro__icon mat-icon {
      width: 1.2rem;
      height: 1.2rem;
      font-size: 1.2rem;
    }
    .editor-intro h2 {
      margin: 0;
      font-size: 1rem;
    }
    .editor-intro p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary, inherit);
      font-size: 0.84rem;
    }
    .editor-surface {
      padding: 1.25rem;
    }
    .editor-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid color-mix(in srgb, var(--text-primary, currentColor) 10%, transparent);
    }
    .editor-actions p {
      margin: 0;
      color: var(--text-secondary, inherit);
      font-size: 0.82rem;
    }
    .editor-actions button {
      min-height: 2.75rem;
      border-radius: 0.75rem;
    }
    @media (max-width: 40rem) {
      .workspace-header,
      .editor-actions {
        align-items: stretch;
        flex-direction: column;
      }
      .guide-status,
      .editor-actions button {
        width: fit-content;
      }
      .editor-actions button {
        width: 100%;
      }
    }
  `,
  host: {
    class: 'block',
  },
})
export default class UserGuideComponent {
  private fb = inject(NonNullableFormBuilder);
  userGuideStore = inject(UserGuideStore);
  userGuideForm = this.fb.group({
    id: ['', Validators.required],
    body: ['', Validators.required],
  });

  constructor() {
    this.userGuideStore.getUserGuide();
    effect(() => {
      const userGuideData = this.userGuideStore.userGuide();
      if (userGuideData) {
        this.userGuideForm.patchValue(userGuideData);
      }
    });
  }

  onSubmit() {
    if (this.userGuideForm.invalid) {
      return;
    }

    this.userGuideStore.patchUserGuide(this.userGuideForm.getRawValue());
  }
}
