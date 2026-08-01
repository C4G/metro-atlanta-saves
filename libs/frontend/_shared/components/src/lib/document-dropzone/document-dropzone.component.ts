import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentManagementStore } from '@mas/frontend-shared-data-access';

@Component({
  selector: 'mas-document-dropzone',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-transparent cursor-pointer transition-all duration-300 ease-in-out m-4 hover:border-primary"
      [ngClass]="{ 'border-primary border-4 bg-gray-600': isDragging() }"
      (dragover)="handleDragOver($event)"
      (dragleave)="handleDragLeave($event)"
      (drop)="handleDrop($event)"
    >
      <input
        type="file"
        #fileInput
        class="hidden"
        (change)="handleFileSelection($event)"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        multiple
      />
      <div class="flex flex-col items-center gap-4">
        <mat-icon class="text-4xl opacity-30">cloud_upload</mat-icon>
        <div class="text-center">
          <p class="text-lg mb-2">Drag and drop files here</p>
          <p class="text-sm opacity-70">or</p>
        </div>
        <button mat-stroked-button color="primary" (click)="fileInput.click()">Choose File</button>
      </div>
    </div>
  `,
  host: {
    class: 'block',
  },
})
export class DocumentDropzoneComponent {
  // Required input
  programId = input.required<string>();

  documentStore = inject(DocumentManagementStore);

  isDragging = signal(false);

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  handleFileSelection(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  handleFiles(files: FileList) {
    const validFiles = Array.from(files).filter(this.isValidFile);
    this.documentStore.addImages(validFiles);
  }

  private isValidFile(file: File): boolean {
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }
}
