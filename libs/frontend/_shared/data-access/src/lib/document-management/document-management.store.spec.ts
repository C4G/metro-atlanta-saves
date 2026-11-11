import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '@mas/frontend-shared-auth';
import { CheckpointsStore } from '../checkpoints/checkpoints.store';
import { ImagesStore } from '../images/images.store';
import { DocumentManagementStore } from './document-management.store';

describe('Document review selection', () => {
  const images = signal([
    { id: 'two', userId: null, checkpoint: null },
    { id: 'one', userId: null, checkpoint: null },
  ]);
  let store: InstanceType<typeof DocumentManagementStore>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentManagementStore,
        provideHttpClient(),
        { provide: ImagesStore, useValue: { images } },
        { provide: CheckpointsStore, useValue: { checkpoints: signal([]) } },
        { provide: AuthStore, useValue: {} },
        { provide: MatSnackBar, useValue: { open: jest.fn() } },
      ],
    });
    store = TestBed.inject(DocumentManagementStore);
  });
  afterEach(() => TestBed.resetTestingModule());
  it('sorts a copy without mutating the shared image resource', () => {
    expect(store.filteredImages().map((image) => image.id)).toEqual(['one', 'two']);
    expect(images().map((image) => image.id)).toEqual(['two', 'one']);
  });
  it.each(['next', 'select', 'previous'])('clears unsaved assignments when choosing %s document', (mode) => {
    if (mode === 'previous') store.selectImage(1);
    store.setSelectedUser('new-participant');
    store.setSelectedCheckpoint('new-checkpoint');
    if (mode === 'next') store.navigateNext();
    else if (mode === 'previous') store.navigatePrevious();
    else store.selectImage(1);
    expect(store.pendingUpdates()).toEqual({ userId: null, checkpointId: null });
  });
});
