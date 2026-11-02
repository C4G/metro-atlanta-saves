import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@mas/frontend-shared-auth';
import { MonthReceiptsStore } from '@mas/frontend-shared-data-access';
import { MonthReceiptsComponent } from './month-receipts.component';

describe('Monthly receipt control', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('shows the same upload control for an empty month and a busy spinner during upload', () => {
    const uploading = signal(false);
    const load = jest.fn();
    const reset = jest.fn();
    const open = jest.fn();
    const receipts = signal<{ id: string; name: string; imageVerified?: boolean }[]>([]);
    const remove = jest.fn();
    TestBed.configureTestingModule({
      imports: [MonthReceiptsComponent],
      providers: [
        { provide: AuthStore, useValue: { user: signal({ id: 'participant-1' }), isAdmin: () => false } },
        { provide: MatDialog, useValue: { open } },
      ],
    }).overrideComponent(MonthReceiptsComponent, {
      set: {
        providers: [
          {
            provide: MonthReceiptsStore,
            useValue: {
              uploading,
              loading: signal(false),
              loadFailed: signal(false),
              receipts,
              error: signal(''),
              notice: signal(''),
              load,
              reset,
              deletingId: signal(''),
              remove,
            },
          },
        ],
      },
    });
    const fixture = TestBed.createComponent(MonthReceiptsComponent);
    const root: HTMLElement = fixture.nativeElement;
    const buttons = () => Array.from(root.querySelectorAll('button'));
    fixture.componentRef.setInput('programId', 'program-1');
    fixture.componentRef.setInput('checkpointId', '');
    fixture.componentRef.setInput('monthName', 'Month 3');
    fixture.detectChanges();
    const button = root.querySelector<HTMLButtonElement>('button');
    expect(button?.textContent).toContain('Upload receipts');
    expect(button?.disabled).toBe(false);
    expect(load).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('JPG, PNG, WebP or PDF');
    uploading.set(true);
    fixture.detectChanges();
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-busy')).toBe('true');
    expect(button?.querySelector('.animate-spin')).not.toBeNull();
    uploading.set(false);
    fixture.detectChanges();
    expect(button?.disabled).toBe(false);
    expect(button?.querySelector('.animate-spin')).toBeNull();
    receipts.set([{ id: 'receipt-1', name: 'Savings.pdf' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type=file]')?.hasAttribute('multiple')).toBe(true);
    expect(buttons().find((item) => item.textContent?.includes('Add more receipts'))).toBeDefined();
    expect(root.querySelector('[role="status"]')?.textContent?.trim()).toBe('1 file');
    expect(root.querySelector('button[aria-label="View Savings.pdf"]')?.textContent).toContain('View receipt');
    const preview = root.querySelector<HTMLButtonElement>('button[aria-label="View Savings.pdf"]');
    preview?.click();
    expect(open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ data: { id: 'receipt-1', name: 'Savings.pdf' } }),
    );
    root.querySelector<HTMLButtonElement>('button[aria-label="Delete Savings.pdf"]')?.click();
    fixture.detectChanges();
    expect(remove).not.toHaveBeenCalled();
    buttons()
      .find((button) => button.textContent?.trim() === 'Keep receipt')
      ?.click();
    fixture.detectChanges();
    expect(remove).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('button[aria-label="Delete Savings.pdf"]')?.click();
    fixture.detectChanges();
    buttons()
      .find((button) => button.textContent?.trim() === 'Delete receipt')
      ?.click();
    expect(remove).toHaveBeenCalledWith('receipt-1');
    receipts.set([{ id: 'receipt-1', name: 'Savings.pdf', imageVerified: true }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[aria-label="Delete Savings.pdf"]')).toBeNull();
    receipts.set([
      { id: 'receipt-1', name: 'Savings.pdf' },
      { id: 'receipt-2', name: 'Statement.pdf' },
    ]);
    fixture.detectChanges();
    expect(root.querySelector('[role="status"]')?.textContent?.trim()).toBe('2 files');
    receipts.set([]);
    fixture.detectChanges();
    expect(root.querySelector('[role="status"]')).toBeNull();
    expect(buttons().find((item) => item.textContent?.includes('Upload receipts'))).toBeDefined();
    expect(reset).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('monthName', 'Month 4');
    fixture.detectChanges();
    expect(reset).toHaveBeenCalledTimes(2);
    expect(root.querySelector('section')?.getAttribute('aria-label')).toBe('Month 4 receipts');
  });
});
