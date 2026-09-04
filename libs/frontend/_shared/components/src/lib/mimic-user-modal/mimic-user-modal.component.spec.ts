import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@mas/frontend-shared-auth';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { MimicUserModalComponent } from './mimic-user-modal.component';

describe('MimicUserModalComponent managed candidates', () => {
  const currentUser = { id: 'staff-1', email: 'staff@example.com', role: 'Partner_Staff' } as any;
  const users = signal([
    { id: 'regular-1', firstName: 'Regular', lastName: 'User', email: 'regular@example.com', role: null },
    { id: 'admin-1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'Administrator' },
    { id: 'staff-1', firstName: 'Staff', lastName: 'User', email: currentUser.email, role: 'Partner_Staff' },
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

  it('shows only regular server-provided candidates and submits the target ID', () => {
    const component = TestBed.runInInjectionContext(() => new MimicUserModalComponent());

    expect(getUsers).toHaveBeenCalled();
    expect(component.formattedUsers()).toEqual([{ label: 'Regular User (regular@example.com)', value: 'regular-1' }]);

    component.mimicForm.setValue({ userId: 'regular-1' });
    component.submitForm();

    expect(mimicUser).toHaveBeenCalledWith('regular-1');
  });
});
