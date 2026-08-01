import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AddUserComponent, SearchableDropdownComponent } from '@mas/frontend-shared-components';
import { AlliesOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { UsersForProgramsStore } from './users-for-programs.store';

@Component({
  selector: 'mas-add-allies-on-programs',
  imports: [MatDialogModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, SearchableDropdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Add Ally</h2>
    <form [formGroup]="usersOnProgramsForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid gap-4">
          <mas-searchable-dropdown
            formControlName="userId"
            [items]="usersForProgramStore.usersAsLabelValues()"
            label="User"
            [required]="true"
            [showCreateButton]="true"
            createButtonText="Create user"
            (create)="createUser()"
          />
          @if (usersOnProgramsForm.get('userId')?.invalid && usersOnProgramsForm.get('userId')?.touched) {
            <mat-error>User is required.</mat-error>
          }
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit">Add</button>
      </mat-dialog-actions>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class AddAlliesOnProgramsComponent {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private alliesStore = inject(AlliesOnProgramsStore);
  usersForProgramStore = inject(UsersForProgramsStore);
  search = this.fb.control('');
  data = inject<UsersOnProgramsWithName | null>(MAT_DIALOG_DATA);

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
    if (this.usersOnProgramsForm.invalid) {
      return;
    }
    const addUserData = this.usersOnProgramsForm.getRawValue();
    this.alliesStore.addAlly({ userId: addUserData.userId });
  }
}
