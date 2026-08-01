import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatHint, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { AddUserComponent, SearchableDropdownComponent } from '@mas/frontend-shared-components';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { UsersOnProgramsWithName } from '@mas/models';
import { RequirementsStore } from '../../../requirements/requirements.store';
import { UsersForProgramsStore } from './users-for-programs.store';

@Component({
  selector: 'mas-add-users-on-programs',
  imports: [
    MatDialogModule,
    MatInput,
    MatButtonModule,
    MatFormFieldModule,
    MatLabel,
    ReactiveFormsModule,
    MatIcon,
    MatPrefix,
    MatOption,
    MatSelect,
    MatCheckbox,
    MatHint,
    MatDatepickerModule,
    SearchableDropdownComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit User' : 'Add User' }}</h2>
    <form #form="ngForm" [formGroup]="usersOnProgramsForm" (ngSubmit)="submitForm()">
      <mat-dialog-content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 content-center">
          <div>
            <mas-searchable-dropdown
              formControlName="userId"
              [items]="this.usersForProgramStore.usersAsLabelValues()"
              label="User"
              createButtonText="Create New User"
              (create)="createUser()"
            />
            @if (
              (usersOnProgramsForm.get('userId')?.touched || form.submitted) &&
              usersOnProgramsForm.get('userId')?.errors?.['required']
            ) {
              <mat-error>User is required.</mat-error>
            }
          </div>
          <mat-form-field>
            <mat-label>Completed Requirements</mat-label>
            <mat-select formControlName="requirementStatus" multiple>
              @for (requirement of requirementsStore.programRequirement(); track requirement.id) {
                <mat-option [value]="requirement.id">{{ requirement.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-checkbox formControlName="married">Married</mat-checkbox>
          <mat-checkbox formControlName="militaryStatus">Military Status</mat-checkbox>
          <mat-form-field>
            <mat-label>Place of Employment</mat-label>
            <input matInput formControlName="placeOfEmployment" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Job Title</mat-label>
            <input matInput formControlName="jobTitle" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Education Status</mat-label>
            <input matInput formControlName="educationStatus" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Annual Income</mat-label>
            <input matInput formControlName="annualIncome" type="number" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Months Employed</mat-label>
            <input matInput formControlName="monthsEmployed" type="number" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startDatePicker" formControlName="start" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="startDatePicker" />
            <mat-datepicker #startDatePicker />
          </mat-form-field>
          <mat-form-field>
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endDatePicker" formControlName="end" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="endDatePicker" />
            <mat-datepicker #endDatePicker />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Birth Date</mat-label>
            <input matInput [matDatepicker]="birthdatePicker" formControlName="birthdate" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="birthdatePicker" />
            <mat-datepicker #birthdatePicker />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Gender</mat-label>
            <input matInput formControlName="gender" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Race</mat-label>
            <input matInput formControlName="race" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Total Amount Paid Out</mat-label>
            <input matInput formControlName="totalAmountPaidOut" type="number" />
            <mat-icon matPrefix>attach_money</mat-icon>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Paid Date</mat-label>
            <input matInput [matDatepicker]="paidDatePicker" formControlName="paidDate" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="paidDatePicker" />
            <mat-datepicker #paidDatePicker />
          </mat-form-field>
          <mat-checkbox formControlName="creditScoreIncentive">Credit Score Incentive</mat-checkbox>
          <mat-checkbox formControlName="graduated">Graduated</mat-checkbox>
          <mat-checkbox formControlName="inactive">Inactive</mat-checkbox>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit">{{ data ? 'Save' : 'Add' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  host: {
    class: 'block',
  },
})
export class AddUsersOnProgramsComponent {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private usersOnProgramsStore = inject(UsersOnProgramsStore);
  usersForProgramStore = inject(UsersForProgramsStore);
  requirementsStore = inject(RequirementsStore);
  search = this.fb.control('');
  data = inject<UsersOnProgramsWithName | null>(MAT_DIALOG_DATA);

  usersOnProgramsForm = this.fb.group({
    userId: this.fb.nonNullable.control(this.data?.userId ?? '', { validators: [Validators.required] }),
    requirementStatus: this.fb.nonNullable.control(this.data?.requirementStatus ?? []),
    married: this.fb.nonNullable.control(this.data?.married ?? false),
    educationStatus: [this.data?.educationStatus ?? ''],
    militaryStatus: this.fb.nonNullable.control(this.data?.militaryStatus ?? false),
    placeOfEmployment: [this.data?.placeOfEmployment ?? ''],
    jobTitle: [this.data?.jobTitle ?? ''],
    annualIncome: [this.data?.annualIncome ?? 0],
    monthsEmployed: [this.data?.annualIncome ?? 0],
    address: [this.data?.address ?? ''],
    start: [this.data?.start ?? null],
    end: [this.data?.end ?? null],
    birthdate: [this.data?.birthdate ?? null],
    phone: [this.data?.phone ?? ''],
    gender: [this.data?.gender ?? ''],
    race: [this.data?.race ?? ''],
    paidDate: [this.data?.paidDate ?? null],
    totalAmountPaidOut: this.fb.nonNullable.control(this.data?.totalAmountPaidOut ?? 0),
    creditScoreIncentive: this.fb.nonNullable.control(this.data?.creditScoreIncentive ?? false),
    graduated: this.fb.nonNullable.control(this.data?.graduated ?? false),
    inactive: this.fb.nonNullable.control(this.data?.inactive ?? false),
  });

  constructor() {
    this.usersForProgramStore.getUsers();
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

    if (this.data) {
      this.usersOnProgramsStore.patchUser({
        programId: this.data.programId,
        ...addUserData,
      });
      return;
    }

    this.usersOnProgramsStore.addUser(addUserData);
  }
}
