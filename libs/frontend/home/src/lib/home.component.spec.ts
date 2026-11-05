import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DescriptionStore, IntroductionStore, WhatWeAreStore } from '@mas/frontend-shared-data-access';

import { HomeComponent, initialsFor } from './home.component';

describe('HomeComponent', () => {
  const getDescription = jest.fn();
  const getIntroduction = jest.fn();
  const getWhatWeAre = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: DescriptionStore,
          useValue: { description: signal(null), getDescription },
        },
        {
          provide: IntroductionStore,
          useValue: {
            introduction: signal({
              id: '-1',
              title: '',
              titleEnding: 'Financial Wellbeing Alliance',
              eyebrow: '',
              description: '',
              ctaText: '',
              imageText: null,
              imageUrl: '',
              hidden: false,
              imageHidden: false,
            }),
            getIntroduction,
          },
        },
        {
          provide: WhatWeAreStore,
          useValue: { whatWeAre: signal(null), getWhatWeAre },
        },
      ],
    });
  });

  it('does not render API-backed sections before their data is available', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(getDescription).toHaveBeenCalledTimes(1);
    expect(getIntroduction).toHaveBeenCalledTimes(1);
    expect(getWhatWeAre).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('section')).toHaveLength(0);
  });

  it('opens one program description at a time', () => {
    TestBed.overrideProvider(DescriptionStore, {
      useValue: {
        description: signal({
          hidden: false,
          title: 'Explore our financial programs',
          programsJson: JSON.stringify([
            { title: 'Financial Achievement Club', description: 'Families save together.' },
            { title: 'Wealth Builders United', description: 'Learn to invest.' },
          ]),
          factsJson: '[]',
        }),
        getDescription,
      },
    });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('#programs button')) as HTMLButtonElement[];
    expect(buttons().map((button) => button.getAttribute('aria-expanded'))).toEqual(['false', 'false']);
    buttons()[1].click();
    fixture.detectChanges();
    expect(buttons().map((button) => button.getAttribute('aria-expanded'))).toEqual(['false', 'true']);
    expect(buttons()[1].textContent).toContain('Show less');
    buttons()[1].click();
    fixture.detectChanges();
    expect(buttons()[1].getAttribute('aria-expanded')).toBe('false');
  });
});

describe('initialsFor', () => {
  it.each([
    ['CRP', 'CRP'],
    ['SPARC', 'SPARC'],
    ['Frontline Housing', 'FH'],
    ['Los Vecinos', 'LV'],
    ['Single Parent Alliance and Resource Center', 'SPA'],
  ])('shortens %s to %s', (name, initials) => {
    expect(initialsFor(name)).toBe(initials);
  });
});
