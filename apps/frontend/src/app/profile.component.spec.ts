import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const user = signal({
    id: 'user-1',
    firstName: 'Jordan',
    lastName: 'Lee',
    email: 'jordan@example.com',
    emailVerified: true,
    bio: 'Program participant',
    role: null,
  });
  const patch = jest.fn();

  beforeEach(() => {
    user.set({
      id: 'user-1',
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan@example.com',
      emailVerified: true,
      bio: 'Program participant',
      role: null,
    });
    patch.mockClear();

    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            user,
            initials: () => 'JL',
            patch,
          },
        },
      ],
    });
  });

  it('shows the current profile and account summary', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.profileForm.getRawValue()).toEqual({
      firstName: 'Jordan',
      lastName: 'Lee',
      email: 'jordan@example.com',
      bio: 'Program participant',
    });
    expect(component.roleLabel()).toBe('Participant');
    expect(component.emailStatus()).toBe('Verified');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Profile and preferences');
  });

  it('submits valid profile changes through the auth store', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.profileForm.patchValue({ firstName: 'Jordyn', bio: 'Updated introduction' });
    fixture.componentInstance.save();

    expect(patch).toHaveBeenCalledWith({
      firstName: 'Jordyn',
      lastName: 'Lee',
      email: 'jordan@example.com',
      bio: 'Updated introduction',
    });
  });

  it('does not submit an invalid profile', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();

    fixture.componentInstance.profileForm.controls.firstName.setValue('');
    fixture.componentInstance.save();

    expect(fixture.componentInstance.submitted()).toBe(true);
    expect(patch).not.toHaveBeenCalled();
  });
});
