import { TestBed } from '@angular/core/testing';
import { LoaderComponent } from './loader.component';

describe('LoaderComponent', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('shows a spinner and announces its label only to assistive technology', () => {
    const fixture = TestBed.createComponent(LoaderComponent);
    fixture.componentRef.setInput('label', 'Loading your months');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="status"] .animate-spin')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('.sr-only')?.textContent?.trim()).toBe('Loading your months');
  });
});
