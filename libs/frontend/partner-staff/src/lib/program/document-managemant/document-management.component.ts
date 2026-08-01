import { ChangeDetectionStrategy, Component, effect, inject, input, OnDestroy, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DocumentDropzoneComponent } from '@mas/frontend-shared-components';
import {
  CheckpointsStore,
  DocumentManagementStore,
  ImagesStore,
  UsersOnProgramsStore,
} from '@mas/frontend-shared-data-access';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'mas-document-management',
  imports: [
    DatePipe,
    DocumentDropzoneComponent,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenu,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col">
      <div class="flex justify-between align-middle p-6">
        <h2 class="text-2xl font-bold">User Documents</h2>
      </div>

      <mas-document-dropzone [programId]="id()" />

      <div class="flex gap-4 items-center">
        <mat-form-field class="w-64 mt-4">
          <mat-label>Filter by User</mat-label>
          <mat-select
            [ngModel]="documentManagementStore.selectedUserFilter()"
            (ngModelChange)="documentManagementStore.setUserFilter($event)"
          >
            <mat-option [value]="null" selected>All Users</mat-option>
            <mat-option [value]="'unassigned'">Unassigned Users</mat-option>
            @for (user of usersOnProgramsStore.users(); track user.userId) {
              <mat-option [value]="user.userId">{{ user.firstName }} {{ user.lastName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-64 mt-4">
          <mat-label>Filter by Checkpoint</mat-label>
          <mat-select
            [ngModel]="documentManagementStore.selectedCheckpointFilter()"
            (ngModelChange)="documentManagementStore.setCheckpointFilter($event)"
          >
            <mat-option [value]="null" selected>All Checkpoints</mat-option>
            <mat-option [value]="'unassigned'">Unassigned Checkpoints</mat-option>
            @for (checkpoint of checkpointsStore.checkpoints(); track checkpoint.id) {
              <mat-option [value]="checkpoint.id">{{ checkpoint.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (documentManagementStore.selectedUserFilter() || documentManagementStore.selectedCheckpointFilter()) {
          <button mat-stroked-button color="warn" class="h-10" (click)="documentManagementStore.clearFilters()">
            <mat-icon class="mr-1">filter_alt_off</mat-icon>
            Clear Filters
          </button>
        }
      </div>

      @if (documentManagementStore.filteredImages().length > 0) {
        <div class="flex items-center justify-center gap-4 p-6 pt-0">
          <button
            mat-icon-button
            (click)="documentManagementStore.navigatePrevious()"
            [disabled]="documentManagementStore.currentImageIndex() === 0"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>

          <mat-card class="relative">
            @if (documentManagementStore.currentImage(); as image) {
              <div class="flex justify-between items-center p-4 pb-0">
                <div>
                  <h3 class="text-xl font-bold truncate">
                    Checkpoint: {{ image.checkpoint?.name ? image.checkpoint?.name : 'Unassigned' }}
                  </h3>
                  <p class="text-white-600 text-sm">File Name: {{ image.name }}</p>
                  <p class="text-white-600 text-sm">User: {{ documentManagementStore.currentImageUser() }}</p>
                  <p class="text-white-500 text-sm">Created: {{ image.createdAt | date: 'short' }}</p>
                </div>

                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <div class="p-4 min-w-[200px]" (click)="$event.stopPropagation()">
                    <mat-form-field class="w-full mt-4">
                      <mat-label>User</mat-label>
                      <mat-select
                        [ngModel]="documentManagementStore.pendingUpdates().userId"
                        (ngModelChange)="documentManagementStore.setSelectedUser($event)"
                      >
                        @for (user of usersOnProgramsStore.users(); track user.userId) {
                          <mat-option [value]="user.userId">{{ user.firstName }} {{ user.lastName }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    @if (documentManagementStore.pendingUpdates().userId) {
                      <mat-form-field class="w-full">
                        <mat-label>Checkpoint</mat-label>
                        <mat-select
                          [ngModel]="documentManagementStore.pendingUpdates().checkpointId"
                          (ngModelChange)="documentManagementStore.setSelectedCheckpoint($event)"
                        >
                          @for (checkpoint of documentManagementStore.userCheckpoints(); track checkpoint.id) {
                            <mat-option [value]="checkpoint.id">{{ checkpoint.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    }

                    <div class="flex justify-end mt-4">
                      <button
                        mat-button
                        color="primary"
                        [disabled]="!documentManagementStore.hasPendingChanges()"
                        (click)="documentManagementStore.saveChanges()"
                      >
                        Save Changes
                      </button>
                    </div>

                    <div class="flex justify-end mt-4">
                      <button mat-button color="warn" (click)="documentManagementStore.deleteImage(image.id)">
                        Delete Image
                      </button>
                    </div>
                  </div>
                </mat-menu>
              </div>

              <mat-card-content class="flex justify-center p-4">
                @if (documentManagementStore.imageUrls()[image.id]; as url) {
                  @if (image.type.includes('pdf')) {
                    <iframe [src]="url" class="w-[800px] h-[600px]"></iframe>
                  } @else {
                    <img [src]="url" class="max-w-[800px] max-h-[600px] w-auto h-auto object-contain" alt="Document" />
                  }
                } @else if (documentManagementStore.loadedImages()[image.id]) {
                  <div class="flex items-center justify-center w-[800px] h-[600px]">
                    <mat-spinner diameter="40" />
                  </div>
                }
              </mat-card-content>
            }
          </mat-card>

          <button
            mat-icon-button
            (click)="documentManagementStore.navigateNext()"
            [disabled]="
              documentManagementStore.currentImageIndex() === documentManagementStore.filteredImages().length - 1
            "
          >
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <!-- Thumbnail Gallery -->
        <div class="mt-8 px-6">
          <h3 class="text-xl font-bold mb-4">All Documents</h3>
          <div class="overflow-x-auto">
            <div class="flex gap-4 min-w-max pb-4">
              @for (image of documentManagementStore.filteredImages(); track image.id) {
                <div
                  class="flex flex-col items-center cursor-pointer"
                  [class.border-2]="documentManagementStore.currentImage().id === image.id"
                  [class.border-primary]="documentManagementStore.currentImage().id === image.id"
                  [class.p-1]="documentManagementStore.currentImage().id === image.id"
                  (click)="documentManagementStore.selectImage($index)"
                >
                  @if (documentManagementStore.imageUrls()[image.id]; as url) {
                    <div class="h-24 w-24 flex items-center justify-center">
                      @if (image.type.includes('pdf')) {
                        <mat-icon class="text-4xl">picture_as_pdf</mat-icon>
                      } @else {
                        <img [src]="url" class="max-h-24 max-w-24 object-contain" alt="Thumbnail" />
                      }
                    </div>
                  } @else {
                    <div class="h-24 w-24 flex items-center justify-center bg-gray-100">
                      <mat-icon>image</mat-icon>
                    </div>
                  }
                  <div class="text-center mt-2 max-w-24">
                    <p class="text-xs truncate">
                      {{ image.user ? image.user.firstName + ' ' + image.user.lastName : 'No user' }}
                    </p>
                    <p class="text-xs text-gray-500 truncate">{{ image.checkpoint?.name || 'No checkpoint' }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ image.createdAt | date: 'short' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  host: {
    class: 'block',
  },
})
export default class DocumentManagementComponent implements OnDestroy {
  id = input.required<string>();

  documentManagementStore = inject(DocumentManagementStore);
  imagesStore = inject(ImagesStore);
  checkpointsStore = inject(CheckpointsStore);
  usersOnProgramsStore = inject(UsersOnProgramsStore);

  constructor() {
    // Create an effect to set program ID when it's available
    effect(() => {
      const programId = this.id();
      untracked(() => {
        if (programId) {
          this.documentManagementStore.updateProgramId(programId);
          this.usersOnProgramsStore.setProgramId(programId);
          this.usersOnProgramsStore.getUsers();
          this.checkpointsStore.setProgramId(programId);
          this.imagesStore.getAllImages({
            programId,
            userFilter: this.documentManagementStore.selectedUserFilter(),
            checkpointFilter: this.documentManagementStore.selectedCheckpointFilter(),
          });
        }
      });
    });
  }

  ngOnDestroy() {
    this.documentManagementStore.cleanup();
  }
}
