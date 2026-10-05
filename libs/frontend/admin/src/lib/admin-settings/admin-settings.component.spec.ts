import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import AdminSettingsComponent from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminSettingsComponent],
      providers: [provideRouter([])],
    });
  });

  it('presents every management area in clear work groups', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Admin Dashboard');
    expect(fixture.nativeElement.querySelectorAll('section[aria-labelledby]')).toHaveLength(5);
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(11);
  });

  it('filters areas through computed view state', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.componentInstance.searchQuery.set('email');
    fixture.detectChanges();

    expect(fixture.componentInstance.visibleGroups()).toHaveLength(1);
    expect(fixture.componentInstance.visibleGroups()[0].title).toBe('Participant engagement');
    expect(fixture.componentInstance.visibleGroups()[0].areas[0].title).toBe('Email campaign');
  });

  it('shows a useful empty state and can clear the search', () => {
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.componentInstance.searchQuery.set('not a real admin tool');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No management tools found');

    fixture.componentInstance.clearSearch();
    fixture.detectChanges();
    expect(fixture.componentInstance.visibleGroups()).toHaveLength(5);
  });
});
