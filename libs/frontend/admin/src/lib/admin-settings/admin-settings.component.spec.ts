import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthStore } from '@mas/frontend-shared-auth';

import AdminSettingsComponent, { ADMIN_GROUPS, filterAdminAreas } from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { user: signal(null), isStaff: signal(false), isAdmin: signal(false) } },
      ],
    });
  });

  it('presents every management area in clear work groups', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Admin');
    expect(fixture.nativeElement.querySelectorAll('section[aria-labelledby]')).toHaveLength(5);
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(11);
  });

  it('gives every group panel its own search and marks the C4G tools as internal', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    const panels = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('mas-section-panel'));

    expect(panels.map((panel) => panel.querySelectorAll('input[type="search"]').length)).toEqual([1, 1, 1, 1, 1]);
    expect(panels[2].querySelector('input')?.getAttribute('placeholder')).toBe('Search content & guidance');
    expect(panels[4].querySelector('input')?.getAttribute('placeholder')).toBe('Search C4G tools');
    expect(panels[4].querySelector('h2')?.parentElement?.textContent).toContain('Internal');
    expect(panels[0].querySelector('h2')?.parentElement?.textContent).not.toContain('Internal');
  });

  it('filters only the panel being searched and keeps the others whole', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelectorAll('mas-section-panel')[2] as HTMLElement;
    const input = content.querySelector('input') as HTMLInputElement;
    input.value = 'blog';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(content.querySelectorAll('a')).toHaveLength(1);
    expect(content.querySelector('a')?.getAttribute('href')).toBe('/admin/blogs');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(7);

    input.value = 'not a real admin tool';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(content.textContent).toContain('No matches in this section.');
  });
});

describe('filterAdminAreas', () => {
  const areas = ADMIN_GROUPS[0].areas;

  it('returns every area for a blank search', () => {
    expect(filterAdminAreas(areas, '   ')).toBe(areas);
  });

  it('matches titles and descriptions without case', () => {
    expect(filterAdminAreas(areas, 'PARTNER').map(({ title }) => title)).toEqual(['Users', 'Partners']);
    expect(filterAdminAreas(areas, 'organizations').map(({ title }) => title)).toEqual(['Partners']);
    expect(filterAdminAreas(areas, 'nothing here')).toEqual([]);
  });
});
