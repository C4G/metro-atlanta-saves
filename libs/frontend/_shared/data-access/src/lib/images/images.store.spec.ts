import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImagesStore } from './images.store';

describe('Program document resource', () => {
  it('loads private receipt blobs for inline preview and exposes failures without retaining stale content', () => {
    TestBed.configureTestingModule({
      providers: [
        ImagesStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    const store = TestBed.inject(ImagesStore);
    const http = TestBed.inject(HttpTestingController);
    store.getImage('receipt-1');
    expect(store.previewLoading()).toBe(true);
    http
      .expectOne('/api/images/receipt-1')
      .flush(new Blob(['receipt'], { type: 'application/pdf' }), { headers: { 'Content-Type': 'application/pdf' } });
    expect(store.blob()).not.toBeNull();
    expect(store.previewLoading()).toBe(false);
    store.getImage('receipt-2');
    expect(store.blob()).toBeNull();
    http.expectOne('/api/images/receipt-2').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(store.previewLoading()).toBe(false);
    expect(store.previewError()).toBe(true);
    http.verify();
    TestBed.resetTestingModule();
  });
  it('distinguishes a failed request from an empty library and supports retry', () => {
    TestBed.configureTestingModule({
      providers: [
        ImagesStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    const store = TestBed.inject(ImagesStore);
    const http = TestBed.inject(HttpTestingController);
    store.getAllImages({ programId: 'program-1' });
    expect(store.loading()).toBe(true);
    http.expectOne('/api/images?programId=program-1').flush({}, { status: 500, statusText: 'Server error' });
    expect(store.loading()).toBe(false);
    expect(store.loadFailed()).toBe(true);
    store.getAllImages({ programId: 'program-1' });
    http.expectOne('/api/images?programId=program-1').flush([]);
    expect(store.loading()).toBe(false);
    expect(store.loadFailed()).toBe(false);
    expect(store.images()).toEqual([]);
    http.verify();
    TestBed.resetTestingModule();
  });
});
