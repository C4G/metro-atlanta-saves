import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AVATAR, CONTROL, CONTROL_SOLID_SM, FIELD, ROW } from '../ui/staff-ui';
import { WindowFrameComponent } from '../ui/window-frame.component';
import { ManageProgramStore } from './manage-program.store';

@Component({
  selector: 'mas-add-people-dialog',
  imports: [MatIcon, WindowFrameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mas-window-frame
      [heading]="store.addView().heading"
      headingId="add-people-heading"
      [subtitle]="store.addView().hint"
    >
      <div class="flex flex-col gap-3 p-4 sm:p-5">
        <label class="relative block">
          <span class="sr-only">Search people to add</span>
          <mat-icon
            class="mas-icon-sm pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          >
            search
          </mat-icon>
          <input
            #search
            type="search"
            [class]="fieldClass + ' pl-9'"
            placeholder="Search by name or email"
            [value]="store.addQuery()"
            (input)="store.setAddQuery(search.value)"
          />
        </label>
        <ul class="flex flex-col gap-2" aria-label="People you can add">
          @for (candidate of store.candidates(); track candidate.id) {
            <li [class]="rowClass + ' flex items-center gap-3 p-2'">
              <span [class]="avatarClass" aria-hidden="true">{{ candidate.initials }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-bold">{{ candidate.name }}</span>
                <span class="block truncate text-xs text-ink-muted">{{ candidate.email }}</span>
              </span>
              <button
                type="button"
                [class]="solidSmClass"
                [attr.aria-label]="'Add ' + candidate.name"
                (click)="store.add(candidate.id)"
              >
                Add
              </button>
            </li>
          } @empty {
            <li class="rounded-xl border border-dashed border-outline p-5 text-center text-sm text-ink-muted">
              No one else matches. Invite them from Admin › People first.
            </li>
          }
        </ul>
      </div>
      <button windowFooter type="button" [class]="controlClass" (click)="dialogRef.close()">Done</button>
    </mas-window-frame>
  `,
})
export class AddPeopleDialogComponent {
  readonly store = inject(ManageProgramStore);
  readonly dialogRef = inject(MatDialogRef<AddPeopleDialogComponent>);
  readonly fieldClass = FIELD;
  readonly rowClass = ROW;
  readonly avatarClass = AVATAR;
  readonly controlClass = CONTROL;
  readonly solidSmClass = CONTROL_SOLID_SM;
}
