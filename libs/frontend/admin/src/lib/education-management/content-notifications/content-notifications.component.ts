import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EducationalContentStore, ProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';

const SPECIFIC_USER_VALUE = '__specific_user__';

@Component({
  selector: 'mas-content-notifications',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatAutocompleteModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center p-6">
      <div class="w-full max-w-2xl">
        <p class="text-xl font-semibold mb-6 text-center">
          Configure notifications to send an email to program users when new educational content is uploaded.
        </p>
        <form #form="ngForm" class="flex flex-col gap-4" [formGroup]="notificationForm" (ngSubmit)="onSubmit()">
          <div class="flex justify-center mb-2">
            <button mat-raised-button color="primary" type="submit">Save Notification</button>
          </div>

          <mat-form-field>
            <mat-label>Email Heading</mat-label>
            <input matInput formControlName="heading" placeholder="e.g. New educational content is available!" />
            @if (
              (notificationForm.get('heading')?.touched || form.submitted) &&
              notificationForm.get('heading')?.errors?.['required']
            ) {
              <mat-error>Please enter a heading.</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Email Body</mat-label>
            <textarea
              matInput
              rows="4"
              formControlName="body"
              placeholder="e.g. Check out the latest resources we have added for you."
            ></textarea>
            @if (
              (notificationForm.get('body')?.touched || form.submitted) &&
              notificationForm.get('body')?.errors?.['required']
            ) {
              <mat-error>Please enter a body.</mat-error>
            }
          </mat-form-field>

          <mat-form-field>
            <mat-label>Send To</mat-label>
            <mat-select formControlName="sendTo">
              <mat-option [value]="specificUserValue">Specific User</mat-option>
              @for (program of programsStore.programs(); track program.id) {
                <mat-option [value]="program.id">{{ program.name }} (all enrolled users)</mat-option>
              }
            </mat-select>
            @if (
              (notificationForm.get('sendTo')?.touched || form.submitted) &&
              notificationForm.get('sendTo')?.errors?.['required']
            ) {
              <mat-error>Please select a recipient.</mat-error>
            }
          </mat-form-field>

          @if (isSpecificUserSelected()) {
            <mat-form-field>
              <mat-label>User</mat-label>
              <input
                matInput
                [value]="userDisplayValue()"
                (input)="onUserInput($event)"
                [matAutocomplete]="userAuto"
                placeholder="Search by name or email..."
              />
              <mat-autocomplete #userAuto="matAutocomplete" (optionSelected)="onUserSelected($event)">
                @for (user of filteredUsers(); track user.id) {
                  <mat-option [value]="user.id">{{ user.firstName }} {{ user.lastName }} ({{ user.email }})</mat-option>
                }
              </mat-autocomplete>
              @if (
                (notificationForm.get('userId')?.touched || form.submitted) &&
                notificationForm.get('userId')?.errors?.['required']
              ) {
                <mat-error>Please select a user.</mat-error>
              }
            </mat-form-field>
          }
        </form>
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class ContentNotificationsComponent {
  educationalContentStore = inject(EducationalContentStore);
  programsStore = inject(ProgramsStore);
  usersStore = inject(UsersStore);

  readonly specificUserValue = SPECIFIC_USER_VALUE;

  private fb = inject(FormBuilder);

  notificationForm = this.fb.nonNullable.group({
    heading: ['', Validators.required],
    body: ['', Validators.required],
    sendTo: ['', Validators.required],
    userId: [''],
  });

  isSpecificUserSelected = signal(false);
  userSearchQuery = signal('');
  userDisplayValue = signal('');

  filteredUsers = computed(() => {
    const query = this.userSearchQuery().toLowerCase();
    const users = this.usersStore.users();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  });

  constructor() {
    this.programsStore.getPrograms(undefined);
    this.usersStore.getUsers();
    this.educationalContentStore.getNotificationConfig();

    effect(() => {
      const config = this.educationalContentStore.notificationConfig();
      if (config) {
        const sendToValue = config.programId ?? (config.userId ? SPECIFIC_USER_VALUE : '');
        this.notificationForm.patchValue({
          heading: config.heading,
          body: config.body,
          sendTo: sendToValue,
          userId: config.userId ?? '',
        });
        const isUser = !!config.userId && !config.programId;
        this.isSpecificUserSelected.set(isUser);
        const userIdControl = this.notificationForm.get('userId');
        if (isUser) {
          userIdControl?.setValidators(Validators.required);
          const user = this.usersStore.users().find((u) => u.id === config.userId);
          if (user) {
            this.userDisplayValue.set(`${user.firstName} ${user.lastName} (${user.email})`);
          }
        } else {
          userIdControl?.clearValidators();
        }
        userIdControl?.updateValueAndValidity();
      }
    });

    this.notificationForm.get('sendTo')?.valueChanges.subscribe((value: string) => {
      const isUser = value === SPECIFIC_USER_VALUE;
      this.isSpecificUserSelected.set(isUser);
      const userIdControl = this.notificationForm.get('userId');
      if (isUser) {
        userIdControl?.setValidators(Validators.required);
      } else {
        userIdControl?.clearValidators();
        userIdControl?.setValue('');
        this.userDisplayValue.set('');
        this.userSearchQuery.set('');
      }
      userIdControl?.updateValueAndValidity();
    });
  }

  onUserInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.userSearchQuery.set(value);
    this.userDisplayValue.set(value);
    this.notificationForm.get('userId')?.setValue('');
  }

  onUserSelected(event: MatAutocompleteSelectedEvent) {
    const userId = event.option.value as string;
    const user = this.usersStore.users().find((u) => u.id === userId);
    if (user) {
      this.userDisplayValue.set(`${user.firstName} ${user.lastName} (${user.email})`);
      this.userSearchQuery.set('');
    }
    this.notificationForm.get('userId')?.setValue(userId);
  }

  onSubmit() {
    if (this.notificationForm.invalid) {
      return;
    }

    const { heading, body, sendTo, userId } = this.notificationForm.getRawValue();

    if (sendTo === SPECIFIC_USER_VALUE) {
      this.educationalContentStore.saveNotificationConfig({ heading, body, userId });
    } else {
      this.educationalContentStore.saveNotificationConfig({ heading, body, programId: sendTo });
    }
  }
}
