import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { type Story } from '@prisma/client';
import { MatDialog } from '@angular/material/dialog';

type StoriesState = {
  stories: Story[];
  editStoryId: string;
  sectionHiddenOverride: boolean;
};

const initialState: StoriesState = {
  stories: [],
  editStoryId: '',
  sectionHiddenOverride: false,
};

const BASE_URL = '/api/stories';

export const StoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    sectionHidden: computed(() => store.sectionHiddenOverride() || store.stories().length === 0),
  })),
  withMethods((store) => ({
    setEditStoryId: (editStoryId: string) => {
      patchState(store, (state) => ({ ...state, editStoryId }));
    },
    setSectionHidden: (hidden: boolean) => {
      patchState(store, { sectionHiddenOverride: hidden });
    },
  })),
  withMethods((store, http = inject(HttpClient), snackBar = inject(MatSnackBar), dialogRef = inject(MatDialog)) => ({
    getStories: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<Story[]>(BASE_URL).pipe(
            tapResponse({
              next: (stories) => {
                patchState(store, (state) => ({ ...state, stories }));
              },
              error: () => {
                snackBar.open('There was an error retreiving stories', undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    patchStory: rxMethod<Partial<Story> | FormData>(
      pipe(
        switchMap((story) =>
          http.patch<Story>(`${BASE_URL}/${store.editStoryId()}`, story).pipe(
            tapResponse({
              next: (story) => {
                patchState(store, (state) => ({
                  ...state,
                  stories: state.stories.map((a) => (a.id === story.id ? story : a)),
                }));
                store.setEditStoryId('');
                dialogRef.closeAll();
                snackBar.open(`${story.name} has been updated`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error updating the story`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    addStory: rxMethod<FormData>(
      pipe(
        switchMap((story) =>
          http.post<Story>(BASE_URL, story).pipe(
            tapResponse({
              next: (story) => {
                patchState(store, (state) => ({
                  ...state,
                  stories: [...state.stories, story],
                }));
                dialogRef.closeAll();
                snackBar.open(`${story.name} has been created!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error creating the story`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
    deleteStory: rxMethod<string>(
      pipe(
        switchMap((id) =>
          http.delete<Story>(`${BASE_URL}/${id}`).pipe(
            tapResponse({
              next: (story) => {
                patchState(store, (state) => ({
                  ...state,
                  stories: state.stories.filter((p) => p.id !== story.id),
                }));
                snackBar.open(`${story.name} has been deleted!`, undefined, {
                  panelClass: 'success',
                  duration: 5000,
                });
              },
              error: (resp: HttpErrorResponse) => {
                snackBar.open(resp.error.message[0] || `There was an error deleting the story`, undefined, {
                  panelClass: 'error',
                  duration: 5000,
                });
              },
            }),
          ),
        ),
      ),
    ),
  })),
);
