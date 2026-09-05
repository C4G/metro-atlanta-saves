import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@mas/frontend-shared-auth';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { MimicUserModalComponent } from './mimic-user-modal.component';

describe('MimicUserModalComponent managed candidates', () => {
  const currentUser = { id: 'admin-1', email: 'admin@example.com', role: 'Administrator' } as any;
  const users = signal([
    { id: 'regular-1', firstName: 'Regular', lastName: 'User', email: 'regular@example.com', role: null },
    { id: 'admin-2', firstName: 'Admin', lastName: 'Target', email: 'admin-target@example.com', role: 'Administrator' },
    { id: 'staff-1', firstName: 'Staff', lastName: 'Target', email: 'staff@example.com', role: 'Partner_Staff' },
    { id: currentUser.id, firstName: 'Current', lastName: 'Admin', email: currentUser.email, role: 'Administrator' },
  ] as any[]);
  const mimicUser = jest.fn();
  const getUsers = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthStore, useValue: { user: () => currentUser, mimicUser } },
        { provide: UsersStore, useValue: { users, getUsers } },
      ],
    });
    mimicUser.mockReset();
    getUsers.mockReset();
  });

  it('shows all server-provided candidates and excludes only the current user', () => {
    const component = TestBed.runInInjectionContext(() => new MimicUserModalComponent());

    expect(getUsers).toHaveBeenCalled();
    expect(component.formattedUsers()).toEqual([
      { label: 'Regular User (regular@example.com)', value: 'regular-1' },
      { label: 'Admin Target (admin-target@example.com)', value: 'admin-2' },
      { label: 'Staff Target (staff@example.com)', value: 'staff-1' },
    ]);

    component.mimicForm.setValue({ userId: 'regular-1' });
    component.submitForm();

    expect(mimicUser).toHaveBeenCalledWith('regular-1');
  });
});
