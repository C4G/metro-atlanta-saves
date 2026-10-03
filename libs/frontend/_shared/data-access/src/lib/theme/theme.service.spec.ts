import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const serverRequest = (cookie: string | null): Request =>
    ({ headers: { get: (name: string) => (name === 'cookie' ? cookie : null) } }) as unknown as Request;

  afterEach(() => {
    TestBed.inject(DOCUMENT).body.classList.remove('dark-theme');
    TestBed.resetTestingModule();
  });

  it('applies the cookie theme during server initialization', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: serverRequest('mas-theme=dark') },
      ],
    });

    const service = TestBed.inject(ThemeService);
    service.init();

    expect(service.darkMode()).toBe(true);
    expect(TestBed.inject(DOCUMENT).body.classList.contains('dark-theme')).toBe(true);
  });

  it('defaults server rendering to light mode when no theme cookie exists', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: REQUEST, useValue: serverRequest(null) },
      ],
    });

    const service = TestBed.inject(ThemeService);
    service.init();

    expect(service.darkMode()).toBe(false);
    expect(TestBed.inject(DOCUMENT).body.classList.contains('dark-theme')).toBe(false);
  });

  it('updates the browser theme class and persistence cookie when toggled', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });

    const service = TestBed.inject(ThemeService);
    service.toggleDarkMode(true);

    expect(service.darkMode()).toBe(true);
    expect(TestBed.inject(DOCUMENT).body.classList.contains('dark-theme')).toBe(true);
    expect(TestBed.inject(DOCUMENT).cookie).toContain('mas-theme=dark');
  });
});
