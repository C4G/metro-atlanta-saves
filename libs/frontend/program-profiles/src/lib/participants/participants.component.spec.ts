import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@mas/frontend-shared-auth';
import { matchesParticipantQuery, participantInitials, UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import ParticipantsComponent from './participants.component';

describe('ParticipantsComponent', () => {
  const users = signal([
    { userId: 'user-1', firstName: 'Jordan', lastName: 'Okafor', bio: 'Saving for a first car and a cushion' },
    { userId: 'user-2', firstName: 'Rosa', lastName: 'Patel', bio: null },
  ]);
  const participantQuery = signal('');

  const setup = () => {
    participantQuery.set('');
    TestBed.configureTestingModule({
      imports: [ParticipantsComponent],
      providers: [
        { provide: AuthStore, useValue: { user: signal({ id: 'user-1' }) } },
        {
          provide: UsersOnProgramsStore,
          useValue: {
            users,
            usersLoading: signal(false),
            participantQuery,
            setParticipantQuery: (query: string) => participantQuery.set(query),
            visibleParticipants: computed(() =>
              users()
                .filter((user) => matchesParticipantQuery(user, participantQuery()))
                .map((user) => ({ ...user, initials: participantInitials(user) })),
            ),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ParticipantsComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cards = () => Array.from(element.querySelectorAll<HTMLButtonElement>('ul button'));
    return { fixture, element, cards };
  };
  afterEach(() => TestBed.resetTestingModule());

  it('shows one card per participant with initials, a one-line bio and a You pill on the name line', () => {
    const { cards } = setup();
    const [mine, rosa] = cards();

    expect(mine.textContent).toContain('JO');
    expect(mine.querySelector('.truncate.text-sm')?.parentElement?.textContent).toContain('You');
    expect(mine.querySelector('.text-xs.truncate')?.textContent?.trim()).toBe('Saving for a first car and a cushion');
    expect(rosa.textContent).toContain('No bio added yet');
    expect(rosa.textContent).not.toContain('You');
  });

  it('expands a bio in place when the card is clicked and folds it again', () => {
    const { fixture, cards } = setup();

    cards()[0].click();
    fixture.detectChanges();
    expect(cards()[0].getAttribute('aria-expanded')).toBe('true');
    expect(cards()[0].querySelector('.text-xs.truncate')).toBeNull();
    expect(cards()[1].getAttribute('aria-expanded')).toBe('false');

    cards()[0].click();
    fixture.detectChanges();
    expect(cards()[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('filters by name or bio and says when nothing matches', () => {
    const { fixture, element, cards } = setup();
    const search = (value: string) => {
      const input = element.querySelector<HTMLInputElement>('input[type="search"]');
      if (!input) throw new Error('Search field missing');
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    search('rosa');
    expect(cards().map((card) => card.textContent?.includes('Rosa'))).toEqual([true]);

    search('zzz');
    expect(element.textContent).toContain('No participants match your search');
  });
});
