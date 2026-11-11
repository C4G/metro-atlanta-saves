import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { CheckpointNamesStore, PartnersStore, ProgramsStore } from '@mas/frontend-shared-data-access';
import { AddProgramComponent } from './add-program.component';

describe('Program editor', () => {
  const patchProgram = jest.fn();
  const addProgram = jest.fn();
  const saving = signal(false);
  const program = {
    id: 'program-1',
    name: 'Pilot',
    partnerId: 'partner-1',
    description: '<p>Our program</p>',
    startDate: null,
    endDate: null,
    checkpointNames: [{ name: 'Month 1' }],
    isTemplate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let fixture: ComponentFixture<AddProgramComponent>;

  beforeEach(() => {
    jest.clearAllMocks();
    saving.set(false);
    TestBed.configureTestingModule({
      imports: [AddProgramComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: AuthStore, useValue: { user: signal({ partnerId: 'partner-1' }) } },
        { provide: ProgramsStore, useValue: { patchProgram, addProgram, programSaving: saving } },
        { provide: PartnersStore, useValue: { getPartners: jest.fn(), partners: signal([]) } },
        { provide: CheckpointNamesStore, useValue: { getCheckpointNames: jest.fn(), checkpointNames: signal([]) } },
      ],
    }).overrideComponent(AddProgramComponent, { set: { template: '' } });
    fixture = TestBed.createComponent(AddProgramComponent);
    fixture.componentRef.setInput('program', program);
    fixture.componentRef.setInput('inline', true);
    fixture.detectChanges();
  });
  afterEach(() => TestBed.resetTestingModule());

  it('loads the existing fields and saves inline without creating a program', () => {
    expect(fixture.componentInstance.programForm.controls.checkpointNames.value).toEqual(program.checkpointNames);
    fixture.componentInstance.programForm.controls.name.setValue('Updated Pilot');
    fixture.componentInstance.submitForm();
    expect(patchProgram).toHaveBeenCalledWith(
      expect.objectContaining({ id: program.id, name: 'Updated Pilot', keepOpen: true }),
    );
    expect(addProgram).not.toHaveBeenCalled();
  });

  it('resets edits to the current saved program', () => {
    fixture.componentInstance.programForm.controls.name.setValue('Unsaved');
    fixture.componentInstance.resetForm();
    expect(fixture.componentInstance.programForm.controls.name.value).toBe('Pilot');
    expect(fixture.componentInstance.programForm.pristine).toBe(true);
  });

  it('blocks invalid dates and duplicate saves', () => {
    fixture.componentInstance.programForm.patchValue({
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-11-01'),
    });
    fixture.componentInstance.submitForm();
    expect(patchProgram).not.toHaveBeenCalled();
    fixture.componentInstance.resetForm();
    saving.set(true);
    fixture.componentInstance.submitForm();
    expect(patchProgram).not.toHaveBeenCalled();
  });
});
