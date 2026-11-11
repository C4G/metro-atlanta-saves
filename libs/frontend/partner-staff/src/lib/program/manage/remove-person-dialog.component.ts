import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ManageProgramStore } from './manage-program.store';

@Component({
  selector: 'mas-remove-person-dialog',
  imports: [MatDialogModule, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.removal(); as person) {
      <div
        role="alertdialog"
        aria-labelledby="remove-person-title"
        class="flex flex-col items-center gap-4 p-6 text-center"
      >
        <span
          class="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand-strong"
        >
          {{ person.initials }}
          <span
            aria-hidden="true"
            class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-surface-raised bg-danger text-brand-on"
          >
            <mat-icon class="!h-3.5 !w-3.5 !text-[0.875rem] !leading-none">
              {{ person.isParticipant ? 'person_remove' : 'visibility_off' }}
            </mat-icon>
          </span>
        </span>
        <div>
          <h2 id="remove-person-title" class="text-lg font-bold">Remove {{ person.name }}?</h2>
          <p class="mt-1 text-sm text-ink-muted">{{ person.roleLabel }}</p>
        </div>
        <ul class="w-full space-y-2 rounded-xl bg-surface-subtle px-4 py-3 text-left">
          @for (point of person.points; track point.text) {
            <li class="flex items-center gap-2 text-sm">
              <mat-icon
                aria-hidden="true"
                class="!h-4 !w-4 shrink-0 !text-base !leading-none"
                [class.text-brand-strong]="point.isKept"
                [class.text-danger]="!point.isKept"
              >
                {{ point.isKept ? 'check' : 'do_not_disturb_on' }}
              </mat-icon>
              {{ point.text }}
            </li>
          }
        </ul>
        <div class="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            mat-dialog-close
            cdkFocusInitial
            class="min-h-11 rounded-xl border border-outline bg-surface px-4 text-sm font-bold text-ink hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand"
          >
            Keep
          </button>
          <button
            type="button"
            (click)="remove()"
            class="min-h-11 rounded-xl border border-danger bg-danger px-4 text-sm font-bold text-brand-on hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 focus:ring-offset-surface-raised"
          >
            {{ person.confirmLabel }}
          </button>
        </div>
      </div>
    }
  `,
})
export class RemovePersonDialogComponent {
  readonly store = inject(ManageProgramStore);
  private readonly dialogRef = inject(MatDialogRef<RemovePersonDialogComponent>);

  remove(): void {
    this.store.confirmRemove();
    this.dialogRef.close(true);
  }
}
