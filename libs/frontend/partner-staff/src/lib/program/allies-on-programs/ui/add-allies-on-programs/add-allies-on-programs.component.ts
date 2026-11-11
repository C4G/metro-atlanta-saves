import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AddUserComponent, SearchableDropdownComponent, SpinnerComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { UsersForProgramsStore } from './users-for-programs.store';

@Component({
  selector: 'mas-add-allies-on-programs',
  imports: [SpinnerComponent, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, SearchableDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-surface text-ink">
      <header class="border-b border-outline px-6 py-5">
        <h2 id="assign-ally-heading" class="text-xl font-semibold tracking-tight">Assign an ally</h2>
        <p class="mt-2 text-sm leading-6 text-ink-muted">
          Choose someone to support this program. Current participants and assigned allies are excluded.
        </p>
      </header>
      <form [formGroup]="usersOnProgramsForm" (ngSubmit)="submitForm()">
        <div class="px-6 py-5">
          <div class="grid gap-4">
            <mas-searchable-dropdown
              formControlName="userId"
              [items]="eligibleUsers()"
              label="Choose an ally"
              [required]="true"
              [showCreateButton]="true"
              createButtonText="Create user"
              (create)="createUser()"
            />
            @if (usersOnProgramsForm.get('userId')?.invalid && usersOnProgramsForm.get('userId')?.touched) {
              <mat-error>Choose an available person to assign as an ally.</mat-error>
            }
          </div>
        </div>
        <footer class="flex flex-wrap justify-end gap-2 border-t border-outline px-6 py-4">
          <button
            type="button"
            (click)="close()"
            [disabled]="alliesStore.assignmentSaving()"
            class="min-h-11 rounded-xl border border-outline px-4 text-sm font-semibold text-ink-muted hover:bg-brand-soft/20 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="
              alliesStore.assignmentSaving() ||
              participants.usersLoading() ||
              alliesStore.loading() ||
              participants.usersLoadFailed() ||
              alliesStore.loadFailed()
            "
            class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-strong px-4 text-sm font-semibold text-brand-on hover:bg-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            <span class="relative inline-flex items-center justify-center">
              <span [class.invisible]="alliesStore.assignmentSaving()">Assign ally</span>
              @if (alliesStore.assignmentSaving()) {
                <mas-spinner class="absolute" />
                <span class="sr-only">Assign ally</span>
              }
            </span>
          </button>
        </footer>
      </form>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class AddAlliesOnProgramsComponent {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  readonly alliesStore = inject(AlliesOnProgramsStore);
  readonly participants = inject(UsersOnProgramsStore);
  usersForProgramStore = inject(UsersForProgramsStore);
  search = this.fb.control('');
  data = inject<UsersOnProgramsWithName | null>(MAT_DIALOG_DATA);
  readonly eligibleUsers = computed(() => {
    const assignedIds = new Set([
      ...this.alliesStore.allies().map((ally) => ally.userId),
      ...this.participants.users().map((participant) => participant.userId),
    ]);
    return this.usersForProgramStore.usersAsLabelValues().filter((user) => !assignedIds.has(user.value));
  });

  usersOnProgramsForm = this.fb.group({
    userId: this.fb.nonNullable.control(this.data?.userId ?? '', { validators: [Validators.required] }),
  });

  constructor() {
    this.usersForProgramStore.getUsers();
  }

  close() {
    this.dialog.closeAll();
  }

  createUser() {
    this.dialog.closeAll();
    this.dialog.open(AddUserComponent, { panelClass: 'w-full' });
  }

  submitForm() {
    this.usersOnProgramsForm.markAllAsTouched();
    if (
      this.usersOnProgramsForm.invalid ||
      this.alliesStore.assignmentSaving() ||
      this.participants.usersLoading() ||
      this.alliesStore.loading() ||
      this.participants.usersLoadFailed() ||
      this.alliesStore.loadFailed()
    ) {
      return;
    }
    const addUserData = this.usersOnProgramsForm.getRawValue();
    if (!this.eligibleUsers().some((user) => user.value === addUserData.userId)) {
      this.usersOnProgramsForm.controls.userId.setErrors({ unavailable: true });
      return;
    }
    this.alliesStore.addAlly({ userId: addUserData.userId });
  }
}
