import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthStore } from '@mas/frontend-shared-auth';
import { ExtendedImage } from '@mas/models';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, concatMap, from, map, of } from 'rxjs';
import { CheckpointsStore } from '../checkpoints';
import { ImagesStore } from '../images';

type DocumentManagementState = {
  programId: string | null;
  fixedUserId: string | null;
  imageUrls: Record<string, SafeUrl>;
  loadingImageId: string | null;
  loadedImages: Record<string, boolean>;
  currentImageIndex: number;
  selectedUserFilter: string | null;
  selectedCheckpointFilter: string | null;
  pendingUpdates: {
    userId: string | null;
    checkpointId: string | null;
  };
};

const initialState: DocumentManagementState = {
  programId: null,
  fixedUserId: null,
  imageUrls: {},
  loadingImageId: null,
  loadedImages: {},
  currentImageIndex: 0,
  selectedUserFilter: null,
  selectedCheckpointFilter: 'unassigned',
  pendingUpdates: { userId: null, checkpointId: null },
};

export const DocumentManagementStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const imagesStore = inject(ImagesStore);

    const filteredImages = computed(() => {
      return imagesStore.images().sort((a, b) => imageComparer(a, b));
    });

    const checkpointsStore = inject(CheckpointsStore);
    const userCheckpoints = computed(() => {
      const userId = store.pendingUpdates().userId;
      return userId ? checkpointsStore.checkpoints().filter((checkpoint) => checkpoint.userId === userId) : [];
    });
    const currentImage = computed(() => {
      const images = filteredImages();
      return images[store.currentImageIndex()] || null;
    });

    return {
      filteredImages,
      userCheckpoints,
      currentImage,
      currentImageUser: computed(() => {
        const currentImageSignal = currentImage();
        return currentImageSignal.user
          ? `${currentImageSignal.user.firstName} ${currentImageSignal.user.lastName}`
          : 'Unassigned';
      }),
      hasPendingChanges: computed(() => {
        const current = filteredImages()[store.currentImageIndex()] || null;
        if (!current) return false;

        const state = store.pendingUpdates();
        const currentCheckpointId = current.checkpoint?.id ?? null;

        return (
          (state.userId !== null && state.userId !== current.userId) ||
          (state.checkpointId !== null && state.checkpointId !== currentCheckpointId)
        );
      }),
    };
  }),

  withMethods((store) => {
    // Inject dependencies
    const sanitizer = inject(DomSanitizer);
    const imagesStore = inject(ImagesStore);
    const checkpointsStore = inject(CheckpointsStore);
    const authStore = inject(AuthStore);
    const snackBar = inject(MatSnackBar);
    const http = inject(HttpClient);

    return {
      updateProgramId(id: string) {
        patchState(store, {
          programId: id,
          loadedImages: {},
          imageUrls: {},
        });

        this.loadImagesWithFilters();
      },

      loadImagesWithFilters() {
        const programId = store.programId();
        if (!programId) return;

        const userFilter = store.selectedUserFilter();
        const checkpointFilter = store.selectedCheckpointFilter();

        if (authStore.isStaff()) {
          imagesStore.getAllImages({
            programId,
            userFilter,
            checkpointFilter,
          });
        } else {
          const userId = authStore.user()?.id;
          if (userId) {
            imagesStore.getAllImagesForUser({
              programId,
              userId,
            });
          }
        }

        // Allow time for images to load before processing them
        setTimeout(() => this.loadAllImages(), 300);
      },

      // Add a new method that directly loads all images
      loadAllImages() {
        const images = imagesStore.images();

        if (images.length === 0) return;

        // Get images that need loading
        const imagesToLoad = images.filter((img) => !store.loadedImages()[img.id]);

        // Use concatMap to process one at a time
        from(imagesToLoad)
          .pipe(
            concatMap((image) => {
              // Update loading state
              patchState(store, { loadingImageId: image.id });

              // Fetch image directly
              return http
                .get(`/api/images/${image.id}`, {
                  responseType: 'blob',
                })
                .pipe(
                  map((blob) => ({ imageId: image.id, blob })),
                  catchError((error) => {
                    console.error(`Error loading image ${image.id}:`, error);
                    return of({ imageId: image.id, blob: null });
                  }),
                );
            }),
          )
          .subscribe({
            next: ({ imageId, blob }) => {
              if (blob) {
                const url = sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));

                // Update state with the loaded image
                patchState(store, (state) => ({
                  imageUrls: { ...state.imageUrls, [imageId]: url },
                  loadedImages: { ...state.loadedImages, [imageId]: true },
                  loadingImageId: null,
                }));
              } else {
                patchState(store, { loadingImageId: null });
              }
            },
            complete: () => {
              patchState(store, { loadingImageId: null });
            },
          });
      },

      navigateNext() {
        if (store.currentImageIndex() < store.filteredImages().length - 1) {
          patchState(store, (state) => ({
            ...state,
            currentImageIndex: state.currentImageIndex + 1,
          }));
        }
      },

      navigatePrevious() {
        if (store.currentImageIndex() > 0) {
          patchState(store, (state) => ({
            ...state,
            currentImageIndex: state.currentImageIndex - 1,
          }));
        }
      },

      selectImage(index: number) {
        const images = store.filteredImages();
        if (index >= 0 && index < images.length) {
          patchState(store, { currentImageIndex: index });
        }
      },

      setUserFilter(userId: string | null) {
        patchState(store, { selectedUserFilter: userId });

        // Safely update current index before loading new images
        this.updateCurrentIndexAfterFiltering();

        // Then load images with the new filter
        this.loadImagesWithFilters();
      },

      setCheckpointFilter(checkpointId: string | null) {
        patchState(store, { selectedCheckpointFilter: checkpointId });

        // Safely update current index before loading new images
        this.updateCurrentIndexAfterFiltering();

        // Then load images with the new filter
        this.loadImagesWithFilters();
      },

      clearFilters() {
        patchState(store, {
          selectedUserFilter: null,
          selectedCheckpointFilter: null,
        });
        this.loadImagesWithFilters();
      },

      setSelectedUser(userId: string) {
        patchState(store, (state) => ({
          ...state,
          pendingUpdates: {
            ...state.pendingUpdates,
            userId,
            checkpointId: null,
          },
        }));
        this.loadCheckpoints(userId);
      },

      setSelectedCheckpoint(checkpointId: string) {
        patchState(store, (state) => ({
          ...state,
          pendingUpdates: {
            ...state.pendingUpdates,
            checkpointId,
          },
        }));
      },

      updateCurrentIndexAfterFiltering() {
        // First reset to a safe state
        patchState(store, { currentImageIndex: 0 });

        // Wait for next render cycle before trying to access filtered results
        setTimeout(() => {
          const filtered = store.filteredImages();

          if (filtered.length === 0) {
            return; // Already at index 0, nothing to do
          }

          // Try to keep the current image if possible
          const currentImage = store.currentImage();
          if (currentImage) {
            const newIndex = filtered.findIndex((img) => img.id === currentImage.id);
            if (newIndex !== -1) {
              patchState(store, { currentImageIndex: newIndex });
            }
          }
        }, 0);
      },

      loadCheckpoints(userId: string) {
        const programId = store.programId();
        if (!programId) return;

        checkpointsStore.setProgramId(programId);
        checkpointsStore.setUserId(userId);
        checkpointsStore.getCheckpoints();
      },

      async updateUser(image: ExtendedImage, userId: string) {
        const existingCheckpointId = image.checkpoint?.id;
        if (existingCheckpointId) {
          await checkpointsStore.patchCheckpoint({ id: existingCheckpointId, userId });
        }
        await imagesStore.updateImageUserId({ id: image.id, userId });
      },

      async updateCheckpoint(image: ExtendedImage, checkpointId: string) {
        // Update the image to point to the new checkpoint
        await imagesStore.updateImageCheckpointId({
          id: image.id,
          checkpointId,
        });
      },

      async refreshDataAndKeepCurrentImage(imageId: string) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const programId = store.programId();
        if (!programId) return;

        await imagesStore.getAllImages({
          programId,
          userFilter: store.selectedUserFilter(),
          checkpointFilter: store.selectedCheckpointFilter(),
        });

        const newIndex = store.filteredImages().findIndex((img) => img.id === imageId);
        if (newIndex !== -1) {
          patchState(store, { currentImageIndex: newIndex });
        }
      },

      async saveChanges() {
        const image = store.currentImage();
        if (!image || !store.programId()) return;

        const currentImageId = image.id;
        const newState = store.pendingUpdates();

        if (newState.userId && newState.userId !== image.userId) {
          await this.updateUser(image, newState.userId);
        }

        if (newState.checkpointId && newState.checkpointId !== image.checkpoint?.id) {
          await this.updateCheckpoint(image, newState.checkpointId);
        }

        await this.refreshDataAndKeepCurrentImage(currentImageId);
        snackBar.open('Changes saved successfully', 'Dismiss', { duration: 3000 });
      },

      addImages(files: File[]) {
        const programId = store.programId();
        if (!programId) return Promise.resolve();

        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));

        return new Promise<void>((resolve) => {
          imagesStore.addImages({
            form: formData,
            programId: programId,
            cb: () => {
              if (authStore.isStaff()) {
                imagesStore.getAllImages({
                  programId,
                  userFilter: store.selectedUserFilter(),
                  checkpointFilter: store.selectedCheckpointFilter(),
                });
              } else {
                const userId = authStore.user()?.id;
                if (userId) {
                  imagesStore.getAllImagesForUser({ programId, userId });
                }
              }

              // Reload images
              setTimeout(() => this.loadAllImages(), 300);

              resolve();
            },
          });
        });
      },
      async deleteImage(id: string) {
        imagesStore.deleteImage({ id });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const programId = store.programId();
        if (!programId) return;

        await imagesStore.getAllImages({
          programId,
          userFilter: store.selectedUserFilter(),
          checkpointFilter: store.selectedCheckpointFilter(),
        });

        patchState(store, { currentImageIndex: 0 });
      },

      cleanup() {
        Object.values(store.imageUrls()).forEach((safeUrl) => {
          const urlString = (safeUrl as any).changingThisBreaksApplicationSecurity;
          if (urlString) {
            URL.revokeObjectURL(urlString);
          }
        });
        patchState(store, {
          loadedImages: {},
          imageUrls: {},
        });
      },
    };
  }),
);

// Sorts images by user's name
function imageComparer(a: ExtendedImage, b: ExtendedImage): number {
  if (!a.userId && b.userId) return -1;
  if (a.userId && !b.userId) return 1;
  if (!a.checkpoint && b.checkpoint) return -1;
  if (a.checkpoint && !b.checkpoint) return 1;
  if (a.userId && b.userId && a.user?.lastName && b.user?.lastName) {
    const lastNameCompare = a.user.lastName.localeCompare(b.user.lastName);
    if (lastNameCompare !== 0) return lastNameCompare;
  }
  return a.id.localeCompare(b.id);
}
