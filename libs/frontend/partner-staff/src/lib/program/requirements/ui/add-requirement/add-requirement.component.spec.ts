import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { expect } from '@jest/globals';
import { EducationalContentStore } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../../requirements.store';
import { AddRequirementComponent } from './add-requirement.component';

describe('AddRequirementComponent action configuration', () => {
  const addRequirement = jest.fn();
  const patchRequirement = jest.fn();
  let dialogData: any;
  let fixture: ComponentFixture<AddRequirementComponent>;

  beforeEach(() => {
    dialogData = null;
    addRequirement.mockReset();
    patchRequirement.mockReset();

    TestBed.configureTestingModule({
      imports: [AddRequirementComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useFactory: () => dialogData },
        {
          provide: EducationalContentStore,
          useValue: { contentList: signal([]), getContentList: jest.fn() },
        },
        { provide: RequirementsStore, useValue: { addRequirement, patchRequirement } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('saves optional action instructions and converts the shared local due date and time to ISO', () => {
    fixture = TestBed.createComponent(AddRequirementComponent);
    const component = fixture.componentInstance;
    const localDueDate = '2026-11-15';
    const localDueTime = '17:30';
    component.requirementForm.setValue({
      name: 'Attend a meetup',
      educationalContentId: null,
      actionInstructions: '  Join the in-person meetup.  ',
      dueDate: localDueDate,
      dueTime: localDueTime,
      reminderDaysBefore: null,
    });

    component.submitForm();

    expect(addRequirement).toHaveBeenCalledWith({
      name: 'Attend a meetup',
      educationalContentId: null,
      actionInstructions: 'Join the in-person meetup.',
      dueAt: new Date(`${localDueDate}T${localDueTime}`).toISOString(),
      reminderDaysBefore: null,
    });
  });

  it('round-trips the shared due timestamp when editing a requirement', () => {
    const dueAt = '2026-11-15T23:59:00.000Z';
    dialogData = {
      id: 'requirement-1',
      name: 'Attend a meetup',
      educationalContentId: null,
      actionInstructions: 'Join the in-person meetup.',
      dueAt,
      reminderDaysBefore: null,
    };
    fixture = TestBed.createComponent(AddRequirementComponent);

    const localDueDate = new Date(dueAt);
    const dateValue = fixture.componentInstance.requirementForm.controls.dueDate.value;
    const timeValue = fixture.componentInstance.requirementForm.controls.dueTime.value;
    expect(dateValue).toBe(
      `${localDueDate.getFullYear()}-${String(localDueDate.getMonth() + 1).padStart(2, '0')}-${String(localDueDate.getDate()).padStart(2, '0')}`,
    );
    expect(timeValue).toBe(
      `${String(localDueDate.getHours()).padStart(2, '0')}:${String(localDueDate.getMinutes()).padStart(2, '0')}`,
    );

    fixture.componentInstance.submitForm();

    expect(patchRequirement).toHaveBeenCalledWith({
      id: 'requirement-1',
      name: 'Attend a meetup',
      educationalContentId: null,
      actionInstructions: 'Join the in-person meetup.',
      dueAt,
      reminderDaysBefore: null,
    });
  });

  it('defaults a missing due time to local midnight and keeps an omitted date optional', () => {
    fixture = TestBed.createComponent(AddRequirementComponent);
    fixture.componentInstance.requirementForm.setValue({
      name: 'Read the guide',
      educationalContentId: null,
      actionInstructions: '   ',
      dueDate: '2026-11-15',
      dueTime: '',
      reminderDaysBefore: 7,
    });

    fixture.componentInstance.submitForm();

    expect(addRequirement).toHaveBeenCalledWith(
      expect.objectContaining({
        actionInstructions: null,
        dueAt: new Date('2026-11-15T00:00').toISOString(),
        reminderDaysBefore: 7,
      }),
    );

    fixture.componentInstance.requirementForm.controls.dueDate.setValue('');
    fixture.componentInstance.submitForm();
    expect(addRequirement).toHaveBeenLastCalledWith(expect.objectContaining({ dueAt: null, reminderDaysBefore: null }));
  });

  it('persists the selected reminder offset when creating a requirement', () => {
    fixture = TestBed.createComponent(AddRequirementComponent);
    fixture.componentInstance.requirementForm.patchValue({
      name: 'Read the guide',
      dueDate: '2026-11-15',
      reminderDaysBefore: 1,
    });

    fixture.componentInstance.submitForm();

    expect(addRequirement).toHaveBeenCalledWith(expect.objectContaining({ reminderDaysBefore: 1 }));
  });

  it('persists the selected reminder offset when editing a requirement', () => {
    dialogData = {
      id: 'requirement-1',
      name: 'Read the guide',
      educationalContentId: null,
      actionInstructions: '',
      dueAt: '2026-11-15T23:59:00.000Z',
      reminderDaysBefore: 7,
    };
    fixture = TestBed.createComponent(AddRequirementComponent);
    fixture.componentInstance.submitForm();
    expect(patchRequirement).toHaveBeenCalledWith(expect.objectContaining({ reminderDaysBefore: 7 }));
  });
});
