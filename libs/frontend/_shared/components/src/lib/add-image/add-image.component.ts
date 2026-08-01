import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatError } from '@angular/material/form-field';
import { ImagesStore } from '@mas/frontend-shared-data-access';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'mas-add-image',
  imports: [MatError, MatDialogModule, MatButton, MatIconButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Add Banking Receipt(s)</h2>
    <mat-dialog-content>
      <div
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
        [class.border-blue-500]="isDragging()"
        [class.bg-blue-50]="isDragging()"
        [class.border-gray-300]="!isDragging()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <mat-icon class="text-6xl text-gray-400 dark:text-gray-300 mb-4">cloud_upload</mat-icon>
        <p class="text-lg mb-4 text-gray-900 dark:text-white">Drag and drop files here</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">or</p>
        <button type="button" mat-raised-button color="accent" (click)="fileInput.click()">Choose File(s)</button>
        <input
          hidden
          (change)="onFileSelected($event)"
          #fileInput
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        />
        @if (selectedFileError()) {
          <mat-error class="mt-4">{{ selectedFileError() }}</mat-error>
        }
      </div>

      @if (selectedFiles().length > 0) {
        <div class="mt-6">
          <p class="font-semibold mb-3 text-gray-900 dark:text-white">Selected files:</p>
          <div class="space-y-2">
            @for (file of selectedFiles(); track file.name; let idx = $index) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-4">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <mat-icon class="text-gray-600 dark:text-gray-400 flex-shrink-0">description</mat-icon>
                  <span class="text-sm text-gray-900 dark:text-white truncate">{{ file.name }}</span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs text-gray-500 dark:text-gray-400 leading-none">
                    {{ formatFileSize(file.size) }}
                  </span>
                  <button
                    type="button"
                    mat-icon-button
                    (click)="removeFile(idx)"
                    class="!w-8 !h-8 !flex !items-center !justify-center"
                    aria-label="Remove file"
                  >
                    <mat-icon class="!text-base text-red-500 !leading-none">delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="addImage()"
        type="submit"
        [disabled]="selectedFiles().length === 0"
      >
        Add
      </button>
    </mat-dialog-actions>
  `,
  host: {
    class: 'block',
  },
})
export class AddImageComponent {
  private imagesStore = inject(ImagesStore);
  data = inject<{ id: string; programId: string; cb?: () => void }>(MAT_DIALOG_DATA);
  fileChanged = signal(false);
  selectedFiles = signal<File[]>([]);
  selectedFileNames = signal<string[]>([]);
  selectedFileError = signal('');
  isDragging = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    this.processFiles(files);
  }

  private processFiles(files: File[]): void {
    this.fileChanged.set(true);

    if (files.length === 0) {
      this.selectedFileError.set('At least one image is required');
      return;
    }

    // Validate all files
    const invalidFiles = files.filter((file) => !/(jpg|jpeg|png|webp|pdf)$/.test(file.type));
    if (invalidFiles.length > 0) {
      this.selectedFileError.set('Only supported types: jpg, jpeg, png, webp, pdf');
      return;
    }

    this.selectedFileError.set('');
    this.selectedFiles.set(files);
    this.selectedFileNames.set(files.map((f) => f.name));
  }

  addImage() {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.selectedFileError.set('At least one image is required');
      return;
    }
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    this.imagesStore.addImages({
      form: formData,
      programId: this.data.programId,
      checkpointId: this.data.id,
      cb: this.data.cb,
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  removeFile(index: number): void {
    const files = this.selectedFiles();
    const names = this.selectedFileNames();
    this.selectedFiles.set(files.filter((_, i) => i !== index));
    this.selectedFileNames.set(names.filter((_, i) => i !== index));
  }
}
