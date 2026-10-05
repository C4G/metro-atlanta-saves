import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

type DeleteProgramData = {
  name: string;
  onConfirm: () => void;
};

@Component({
  selector: 'mas-delete-program-dialog',
  imports: [MatDialogClose, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface px-5 py-6 text-ink sm:px-6">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <mat-icon aria-hidden="true">delete_outline</mat-icon>
      </span>
      <h2 class="mt-4 text-xl font-bold tracking-tight">Delete program?</h2>
      <p class="mt-2 text-sm leading-6 text-ink-muted">
        <span class="font-bold text-ink">{{ data.name }}</span>
        will be permanently removed. This action cannot be undone.
      </p>
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          mat-dialog-close
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline bg-surface px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          Keep program
        </button>
        <button
          type="button"
          mat-dialog-close
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-danger px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger/40 focus:ring-offset-2 focus:ring-offset-surface"
          (click)="data.onConfirm()"
        >
          Delete program
        </button>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class DeleteProgramDialogComponent {
  readonly data = inject<DeleteProgramData>(MAT_DIALOG_DATA);
}
