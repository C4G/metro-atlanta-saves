import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatError, MatHint, MatInput, MatLabel, MatPrefix } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import { FooterComponent } from '@mas/frontend-shared-layout';
// import { YesNoMaybe } from '@mas/prisma-client/browser';

@Component({
  selector: 'mas-enroll',
  imports: [
    FooterComponent,
    MatInput,
    MatAnchor,
    MatButton,
    MatFormFieldModule,
    MatLabel,
    ReactiveFormsModule,
    RouterLink,
    MatError,
    MatIcon,
    MatPrefix,
    MatOption,
    MatSelect,
    MatHint,
    MatDatepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h1 class="text-4xl font-bold mb-4">
        Enrollment Form for {{ programsStore.upcomingPrograms().at(0)?.name }} program
      </h1>
      <form #form="ngForm" [formGroup]="enrollForm" (ngSubmit)="submitForm()">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 container mx-auto">
          <mat-form-field>
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phone" />
            @if (
              (enrollForm.get('phone')?.touched || form.submitted) && enrollForm.get('phone')?.errors?.['required']
            ) {
              <mat-error>Phone Number is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Birth Date</mat-label>
            <input matInput [matDatepicker]="birthdatePicker" formControlName="birthdate" />
            <mat-hint>MM/DD/YYYY</mat-hint>
            <mat-datepicker-toggle matIconSuffix [for]="birthdatePicker" />
            <mat-datepicker #birthdatePicker />
            @if (
              (enrollForm.get('birthdate')?.touched || form.submitted) &&
              enrollForm.get('birthdate')?.errors?.['required']
            ) {
              <mat-error>Birth Date is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Race</mat-label>
            <mat-select formControlName="race">
              @for (option of raceOptions; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if ((enrollForm.get('race')?.touched || form.submitted) && enrollForm.get('race')?.errors?.['required']) {
              <mat-error>Race is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Gender</mat-label>
            <mat-select formControlName="gender">
              @for (option of genderOptions; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if (
              (enrollForm.get('gender')?.touched || form.submitted) && enrollForm.get('gender')?.errors?.['required']
            ) {
              <mat-error>Gender is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Place of Employment</mat-label>
            <input matInput formControlName="placeOfEmployment" />
            @if (
              (enrollForm.get('placeOfEmployment')?.touched || form.submitted) &&
              enrollForm.get('placeOfEmployment')?.errors?.['required']
            ) {
              <mat-error>Place of Employment is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Job Title</mat-label>
            <input matInput formControlName="jobTitle" />
            @if (
              (enrollForm.get('jobTitle')?.touched || form.submitted) &&
              enrollForm.get('jobTitle')?.errors?.['required']
            ) {
              <mat-error>Job Title is required.</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Months Employed</mat-label>
            <input matInput formControlName="monthsEmployed" type="number" />
            @if (
              (enrollForm.get('monthsEmployed')?.touched || form.submitted) &&
              enrollForm.get('monthsEmployed')?.errors?.['required']
            ) {
              <mat-error>Months Employed is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Zip Code</mat-label>
            <input matInput formControlName="zipCode" type="number" />
            @if (
              (enrollForm.get('zipCode')?.touched || form.submitted) && enrollForm.get('zipCode')?.errors?.['required']
            ) {
              <mat-error>Zip Code is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>County of Employment (where you work)</mat-label>
            <mat-select formControlName="address">
              @for (option of countyOptions; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if (
              (enrollForm.get('address')?.touched || form.submitted) && enrollForm.get('address')?.errors?.['required']
            ) {
              <mat-error>County of Employment is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Annual Income</mat-label>
            <input matInput formControlName="annualIncome" type="number" />
            <mat-icon matPrefix>attach_money</mat-icon>
            @if (
              (enrollForm.get('annualIncome')?.touched || form.submitted) &&
              enrollForm.get('annualIncome')?.errors?.['required']
            ) {
              <mat-error>Annual Income is required</mat-error>
            }
          </mat-form-field>
          <!-- <mat-form-field>
            <mat-label>Are you available to attend all 6 meetings (3 in-person/3 virtual)?</mat-label>
            <mat-select formControlName="meetingAvailablility">
              @for (option of yesNoMaybe; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if (
              (enrollForm.get('meetingAvailablility')?.touched || form.submitted) &&
              enrollForm.get('meetingAvailablility')?.errors?.['required']
            ) {
              <mat-error>Meeting availability is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Is your employer committed to you attending the program?</mat-label>
            <mat-select formControlName="employerCommitted">
              @for (option of yesNoMaybe; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if (
              (enrollForm.get('employerCommitted')?.touched || form.submitted) &&
              enrollForm.get('employerCommitted')?.errors?.['required']
            ) {
              <mat-error>Employer Committed is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Why are you interested in joining Buidling Resilient Professionals? (1-3 sentences)</mat-label>
            <textarea matInput formControlName="interest"></textarea>
            @if (
              (enrollForm.get('interest')?.touched || form.submitted) &&
              enrollForm.get('interest')?.errors?.['required']
            ) {
              <mat-error>Interest is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>What would you like to gain from the program? (1-3 sentences)</mat-label>
            <textarea matInput formControlName="gain"></textarea>
            @if ((enrollForm.get('gain')?.touched || form.submitted) && enrollForm.get('gain')?.errors?.['required']) {
              <mat-error>What you would like to gain is required</mat-error>
            }
          </mat-form-field> -->
        </div>
        <div class="flex gap-4 justify-end">
          <a mat-raised-button color="accent" routerLink="/dashboard">Back to Dashboard</a>
          <button mat-raised-button color="primary" type="submit">Enroll Now</button>
        </div>
      </form>
    </div>
    <mas-footer />
  `,
  host: {
    class: 'block',
  },
})
export class EnrollComponent {
  private fb = inject(NonNullableFormBuilder);
  private authStore = inject(AuthStore);
  programsStore = inject(ProgramsStore);

  id = input.required<string>();
  genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  yesNoMaybe = ['Yes', 'No', 'Maybe'];
  raceOptions = [
    'Black/African American',
    'White/Caucasian',
    'Asian',
    'Latinx/Latina/Latino',
    'American Indian/Alaska Native',
    'Native Hawaiian or Other Pacific Islander',
    'Other',
  ];
  countyOptions = [
    'Butts',
    'Chereokee',
    'Clayton',
    'Cobb',
    'Coweta',
    'Dekalb',
    'Douglas',
    'Fayette',
    'Fulton',
    'Gwinnett',
    'Henry',
    'Paulding',
    'Rockdale',
    'Other',
  ];

  idEffect = effect(() => {
    this.programsStore.getUpcoming(this.id());
  });

  enrollForm = this.fb.group({
    placeOfEmployment: ['', [Validators.required]],
    jobTitle: ['', [Validators.required]],
    annualIncome: [0, [Validators.required]],
    monthsEmployed: [0, [Validators.required]],
    zipCode: [0, [Validators.required]],
    address: ['', [Validators.required]],
    meetingAvailablility: [null],
    employerCommitted: [null],
    birthdate: [null, [Validators.required]],
    phone: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    race: ['', [Validators.required]],
    interest: [null],
    gain: [null],
  });

  submitForm() {
    if (this.enrollForm.invalid) {
      return;
    }

    const userId = this.authStore.user()?.id;

    if (userId) {
      const enrollment = {
        ...this.enrollForm.getRawValue(),
        programId: this.id(),
        userId,
      };

      this.programsStore.enroll(enrollment);
    }
  }
}
