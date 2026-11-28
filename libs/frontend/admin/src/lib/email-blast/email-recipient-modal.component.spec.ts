import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DiscussionBoardsStore, ProgramsStore, UsersStore } from '@mas/frontend-shared-data-access';
import { EmailRecipientModalComponent } from './email-recipient-modal.component';

describe('EmailRecipientModalComponent', () => {
  const people = [
    { id: 'participant-1', firstName: 'Alex', lastName: 'Participant', email: 'alex@example.com', role: null },
    { id: 'staff-1', firstName: 'Pat', lastName: 'Staff', email: 'pat@example.com', role: 'Partner_Staff' },
    { id: 'admin-1', firstName: 'Ari', lastName: 'Admin', email: 'ari@example.com', role: 'Administrator' },
  ];
  const boards = [{ id: 'board-1', name: 'Community board', memberCount: 12 }];
  const programs = [{ id: 'program-1', name: 'Career Launch' }];
  const dialogRef = { close: jest.fn() };
  let fixture: ComponentFixture<EmailRecipientModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmailRecipientModalComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: UsersStore,
          useValue: { users: signal(people), getUsers: jest.fn() },
        },
        {
          provide: DiscussionBoardsStore,
          useValue: { boards: signal(boards), getAllBoards: jest.fn(() => of(boards)) },
        },
        {
          provide: ProgramsStore,
          useValue: { programs: signal(programs), getPrograms: jest.fn() },
        },
      ],
    });
    fixture = TestBed.createComponent(EmailRecipientModalComponent);
  });

  it('filters the individual-user list by participant, partner-staff, and admin roles', () => {
    const component = fixture.componentInstance;

    expect(component.userGroups().flatMap(({ people: grouped }) => grouped.map(({ id }) => id))).toEqual([
      'participant-1',
      'staff-1',
      'admin-1',
    ]);

    component.roleFilter.set('Partner_Staff');
    expect(component.userGroups().flatMap(({ people: grouped }) => grouped.map(({ id }) => id))).toEqual(['staff-1']);
    component.roleFilter.set('Administrator');
    expect(component.userGroups().flatMap(({ people: grouped }) => grouped.map(({ id }) => id))).toEqual(['admin-1']);
  });

  it('allows multiple users in Users mode and clears selections when switching modes', () => {
    const component = fixture.componentInstance;
    component.toggleUser('participant-1');
    component.toggleUser('staff-1');
    expect(component.selection()).toEqual({ type: 'users', userIds: ['participant-1', 'staff-1'] });

    component.setMode('board');
    expect(component.selection()).toBeNull();
    expect(component.selectedUserIds()).toEqual([]);
    expect(component.selectedBoardId()).toBeNull();

    component.selectedBoardId.set('board-1');
    expect(component.selection()).toEqual({ type: 'board', boardId: 'board-1' });
    component.setMode('program');
    expect(component.selection()).toBeNull();
    component.selectedProgramId.set('program-1');
    expect(component.selection()).toEqual({ type: 'program', programId: 'program-1' });
  });

  it('returns the one selected audience when the administrator confirms', () => {
    const component = fixture.componentInstance;
    component.setMode('board');
    component.selectedBoardId.set('board-1');
    component.confirm();

    expect(dialogRef.close).toHaveBeenCalledWith({ type: 'board', boardId: 'board-1' });
  });
});
