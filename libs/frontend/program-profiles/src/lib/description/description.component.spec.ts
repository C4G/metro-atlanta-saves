import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProgramsStore } from '@mas/frontend-shared-data-access';
import DescriptionComponent from './description.component';

describe('Program description sanitization', () => {
  it('preserves supported content while stripping executable markup', () => {
    TestBed.configureTestingModule({
      imports: [DescriptionComponent],
      providers: [{ provide: ProgramsStore, useValue: { program: signal({
        description: '<p><strong>Welcome</strong></p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Unsafe link</a>',
      }) } }],
    });
    const fixture = TestBed.createComponent(DescriptionComponent);
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement.querySelector('.rich-content');
    expect(content.querySelector('strong')?.textContent).toBe('Welcome');
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('img')?.hasAttribute('onerror')).toBe(false);
    expect(content.querySelector('a')?.getAttribute('href')).not.toBe('javascript:alert(1)');
  });
});
