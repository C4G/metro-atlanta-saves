import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AlliesOnProgramsStore, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { AddAlliesOnProgramsComponent } from './add-allies-on-programs.component';
import { UsersForProgramsStore } from './users-for-programs.store';

describe('Assign program allies', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('excludes participants and existing allies and requires a valid choice before saving', () => {
    const addAlly = jest.fn();
    const saving = signal(false);
    TestBed.configureTestingModule({
      imports: [AddAlliesOnProgramsComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialog, useValue: {} },
        {
          provide: AlliesOnProgramsStore,
          useValue: {
            allies: signal([{ userId: 'ally' }]),
            assignmentSaving: saving,
            loading: signal(false),
            loadFailed: signal(false),
            addAlly,
          },
        },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            users: signal([{ userId: 'participant' }]),
            usersLoading: signal(false),
            usersLoadFailed: signal(false),
          },
        },
        {
          provide: UsersForProgramsStore,
          useValue: {
            getUsers: jest.fn(),
            usersAsLabelValues: signal([
              { label: 'Existing ally', value: 'ally' },
              { label: 'Participant', value: 'participant' },
              { label: 'Available person', value: 'available' },
            ]),
          },
        },
      ],
    }).overrideComponent(AddAlliesOnProgramsComponent, { set: { template: '', imports: [] } });
    const component = TestBed.createComponent(AddAlliesOnProgramsComponent).componentInstance;
    expect(component.eligibleUsers()).toEqual([{ label: 'Available person', value: 'available' }]);
    component.submitForm();
    expect(component.usersOnProgramsForm.controls.userId.touched).toBe(true);
    expect(addAlly).not.toHaveBeenCalled();
    component.usersOnProgramsForm.controls.userId.setValue('available');
    saving.set(true);
    component.submitForm();
    expect(addAlly).not.toHaveBeenCalled();
    saving.set(false);
    component.submitForm();
    expect(addAlly).toHaveBeenCalledWith({ userId: 'available' });
  });
});
