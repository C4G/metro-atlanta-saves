import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { UsersStore } from '@mas/frontend-shared-data-access';
import { UserFull } from '@mas/models';
import { mimicGroupsFor, MimicUserModalComponent } from './mimic-user-modal.component';

type Candidate = Pick<UserFull, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;

describe('Mimic user window', () => {
  const people = [
    { id: 'regular-1', firstName: 'Regular', lastName: 'User', email: 'regular@example.com', role: null },
    { id: 'admin-2', firstName: 'Admin', lastName: 'Target', email: 'admin-target@example.com', role: 'Administrator' },
    { id: 'staff-1', firstName: 'Staff', lastName: 'Target', email: 'staff@example.com', role: 'Partner_Staff' },
    { id: 'admin-1', firstName: 'Current', lastName: 'Admin', email: 'admin@example.com', role: 'Administrator' },
  ] as unknown as Candidate[];

  describe('mimicGroupsFor', () => {
    it('groups everyone but the current user by role in a fixed order', () => {
      const groups = mimicGroupsFor(people, 'admin@example.com', '', 'all');

      expect(groups.map(({ label, people }) => [label, people.map(({ id }) => id)])).toEqual([
        ['Participants', ['regular-1']],
        ['Partner staff', ['staff-1']],
        ['Admins', ['admin-2']],
      ]);
      expect(groups[0].people[0]).toEqual({
        id: 'regular-1',
        name: 'Regular User',
        email: 'regular@example.com',
        initials: 'RU',
        roleLabel: 'Participant',
      });
    });

    it('filters by role and by name or email', () => {
      expect(mimicGroupsFor(people, 'admin@example.com', '', 'Partner_Staff').map(({ label }) => label)).toEqual([
        'Partner staff',
      ]);
      expect(
        mimicGroupsFor(people, 'admin@example.com', '  ADMIN-TARGET ', 'all').flatMap((group) =>
          group.people.map(({ id }) => id),
        ),
      ).toEqual(['admin-2']);
      expect(mimicGroupsFor(people, 'admin@example.com', 'nobody', 'all')).toEqual([]);
    });
  });

  describe('component', () => {
    const mimicUser = jest.fn();
    const getUsers = jest.fn();
    const close = jest.fn();

    const setup = () => {
      TestBed.configureTestingModule({
        imports: [MimicUserModalComponent],
        providers: [
          { provide: AuthStore, useValue: { user: () => ({ email: 'admin@example.com' }), mimicUser } },
          { provide: UsersStore, useValue: { users: signal(people), getUsers } },
          { provide: MatDialogRef, useValue: { close } },
        ],
      });
      const fixture = TestBed.createComponent(MimicUserModalComponent);
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const button = (text: string) =>
        Array.from(element.querySelectorAll('button')).find((item) => item.textContent?.trim() === text);
      return { fixture, element, button };
    };

    afterEach(() => {
      [mimicUser, getUsers, close].forEach((fn) => fn.mockReset());
      TestBed.resetTestingModule();
    });

    it('loads people, keeps Mimic disabled until someone is picked, then mimics them', () => {
      const { fixture, element, button } = setup();
      expect(getUsers).toHaveBeenCalled();
      expect(button('Mimic')?.disabled).toBe(true);
      expect(element.textContent).toContain('Pick someone to mimic');

      element.querySelector<HTMLButtonElement>('ul button')?.click();
      fixture.detectChanges();

      expect(element.querySelector('ul button')?.getAttribute('aria-pressed')).toBe('true');
      expect(element.textContent).toContain('Mimic as Regular User');
      expect(element.querySelector('mas-mimic-ring')).not.toBeNull();
      button('Mimic')?.click();
      expect(mimicUser).toHaveBeenCalledWith('regular-1');
    });

    it('filters by role from the bar and gives every role the same badge', () => {
      const { fixture, element, button } = setup();
      const badges = Array.from(element.querySelectorAll('ul button span.rounded-full'));
      expect(new Set(badges.map((badge) => badge.className)).size).toBe(1);

      button('Admins')?.click();
      fixture.detectChanges();

      expect(button('Admins')?.getAttribute('aria-pressed')).toBe('true');
      expect(Array.from(element.querySelectorAll('h3')).map((heading) => heading.textContent?.trim())).toEqual([
        'Admins',
      ]);
    });

    it('closes from the close and cancel buttons', () => {
      const { element, button } = setup();
      element.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click();
      button('Cancel')?.click();

      expect(close).toHaveBeenCalledTimes(2);
    });
  });
});
