import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
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
    <main
      class="admin-content-shell min-h-full bg-[#f6faf9] text-[#102a2c] dark:bg-[#0c1222] dark:text-slate-100 [&_.mat-mdc-tab-link]:font-bold [&_.mat-mdc-tab-link]:text-[#52666a] [&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-700 dark:[&_.mat-mdc-tab-link]:text-slate-400 dark:[&_.mat-mdc-tab-link.mdc-tab--active]:text-teal-200 dark:[&_.mdc-tab-indicator__content--underline]:!border-teal-400 [&_.mat-mdc-raised-button]:!rounded-xl [&_.mat-mdc-raised-button]:!font-bold dark:[&_.mat-mdc-raised-button]:!bg-teal-400 dark:[&_.mat-mdc-raised-button]:!text-teal-950 dark:[&_.mat-mdc-slide-toggle_.mdc-label]:text-slate-300 dark:[&_.tox_.tox-editor-header]:!bg-[#151b2e] dark:[&_.tox_.tox-menubar]:!bg-[#151b2e] dark:[&_.tox_.tox-toolbar-overlord]:!bg-[#151b2e] mx-auto max-w-[74rem] p-[clamp(1.25rem,3vw,2.5rem)]"
    >
      <header class="mb-8 flex flex-col items-stretch gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.11em] text-[var(--primary)]">
            Content & guidance
          </p>
          <h1 class="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
            User guide
          </h1>
          <p class="mt-3 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Write the practical guidance members need to get started and return with confidence.
          </p>
        </div>
        <div
          class="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] px-3 py-2.5 text-[0.82rem] font-bold text-[var(--primary)]"
        >
          <mat-icon class="!size-[1.1rem] !text-[1.1rem]" aria-hidden="true">menu_book</mat-icon>
          <span>Visible to signed-in members</span>
        </div>
      </header>
      <form
        #form="ngForm"
        class="overflow-hidden rounded-[1.1rem] border border-[color-mix(in_srgb,var(--text-primary,currentColor)_12%,transparent)] bg-[var(--surface-card)]"
        [formGroup]="userGuideForm"
        (ngSubmit)="onSubmit()"
      >
        <section
          class="flex items-center gap-3.5 border-b border-[color-mix(in_srgb,var(--text-primary,currentColor)_10%,transparent)] px-5 py-4"
        >
          <div
            class="grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]"
          >
            <mat-icon class="!size-5 !text-xl" aria-hidden="true">edit_note</mat-icon>
          </div>
          <div>
            <h2 class="font-bold tracking-[-0.035em] text-[var(--text-primary)]">Guide content</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Use headings and short sections so members can quickly find the help they need.
            </p>
          </div>
        </section>
        <div class="p-5">
          <div>
            <mas-rich-text-editor formControlName="body" minHeight="360px" />
            @if (
              (userGuideForm.get('body')?.touched || form.submitted) && userGuideForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Body is required.</mat-error>
            }
          </div>
        </div>
        <footer
          class="flex flex-col items-stretch gap-4 border-t border-[color-mix(in_srgb,var(--text-primary,currentColor)_10%,transparent)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-[0.82rem] text-[var(--text-secondary)]">
            Changes are published to the User Guide when you save.
          </p>
          <button mat-raised-button color="primary" class="!min-h-11 !w-full !rounded-xl sm:!w-auto" type="submit">
            <mat-icon>save</mat-icon>
            Save changes
          </button>
        </footer>
      </form>
    </main>
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
        untracked(() => this.userGuideForm.patchValue(userGuideData));
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
