import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DescriptionStore, IntroductionStore, WhatWeAreStore } from '@mas/frontend-shared-data-access';

import { HomeComponent } from './home.component';

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
});
