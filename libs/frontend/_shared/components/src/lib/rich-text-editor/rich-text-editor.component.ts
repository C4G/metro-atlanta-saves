import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  OnDestroy,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor, Extension } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import Color from '@tiptap/extension-color';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import { ThemeService } from '@mas/frontend-shared-data-access';

const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-indent')) || 0,
            renderHTML: (attributes: { indent?: number }) => {
              const indent = Math.max(0, Math.min(6, attributes.indent ?? 0));
              return indent ? { 'data-indent': indent, style: `margin-left: ${indent * 2}em` } : {};
            },
          },
        },
      },
    ];
  },
});

const SUPPORTED_SOURCE_TAGS = new Set([
  'a',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

@Component({
  selector: 'mas-rich-text-editor',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.rte-dark-theme]': 'themeService.darkMode()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      mas-rich-text-editor {
        --rte-surface: #ffffff;
        --rte-toolbar: rgba(249, 250, 251, 0.8);
        --rte-border: #e5e7eb;
        --rte-text: #111827;
        --rte-muted: #9ca3af;
        --rte-link: #2563eb;
        --rte-cell: #f3f4f6;
      }
      mas-rich-text-editor.rte-dark-theme {
        --rte-surface: #1f2937;
        --rte-toolbar: rgba(17, 24, 39, 0.8);
        --rte-border: #4b5563;
        --rte-text: #f3f4f6;
        --rte-muted: #9ca3af;
        --rte-link: #93c5fd;
        --rte-cell: #374151;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror {
        outline: none;
        padding: 10px 12px;
        font-size: 14px;
        line-height: 1.65;
        color: var(--rte-text);
        min-height: inherit;
        caret-color: #2563eb;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror > * + * {
        margin-top: 0.4em;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror p {
        margin: 0;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        color: var(--rte-muted);
        pointer-events: none;
        float: left;
        height: 0;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin: 0.35em 0;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin: 0.35em 0;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror li {
        margin: 0.15em 0;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror a {
        color: var(--rte-link);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror strong {
        font-weight: 600;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror em {
        font-style: italic;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror u {
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror h1 {
        font-size: 1.5em;
        font-weight: 700;
        line-height: 1.3;
        margin: 0.6em 0 0.2em;
        color: var(--rte-text);
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror h2 {
        font-size: 1.25em;
        font-weight: 700;
        line-height: 1.35;
        margin: 0.5em 0 0.2em;
        color: var(--rte-text);
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror h3 {
        font-size: 1.1em;
        font-weight: 600;
        line-height: 1.4;
        margin: 0.4em 0 0.15em;
        color: var(--rte-text);
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
        margin: 0.5em 0;
        cursor: default;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror img.ProseMirror-selectednode {
        outline: 2px solid #2563eb;
        outline-offset: 2px;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror table {
        border-collapse: collapse;
        table-layout: fixed;
        width: 100%;
        overflow: hidden;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror td,
      mas-rich-text-editor .rte-editor-host .ProseMirror th {
        border: 1px solid var(--rte-border);
        min-width: 1em;
        padding: 4px 6px;
        vertical-align: top;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror th {
        background: var(--rte-cell);
        font-weight: 600;
      }
      mas-rich-text-editor .rte-source-editor {
        min-height: inherit;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      mas-rich-text-editor .rte-uploading-spinner {
        pointer-events: none;
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child {
        background-color: var(--rte-surface);
        color: var(--rte-text);
        border-color: var(--rte-border);
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child > div:first-child {
        background-color: var(--rte-toolbar);
        border-color: var(--rte-border);
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child > div:first-child button {
        color: #d1d5db !important;
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child > div:first-child button:hover {
        color: #ffffff !important;
        background-color: #374151;
      }
      mas-rich-text-editor.rte-dark-theme select,
      mas-rich-text-editor.rte-dark-theme input[type='color'],
      mas-rich-text-editor.rte-dark-theme .rte-source-editor {
        background-color: var(--rte-surface);
        color: var(--rte-text);
        border-color: var(--rte-border);
      }
      mas-rich-text-editor.rte-dark-theme .rte-source-editor {
        caret-color: #93c5fd;
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child > div:last-child {
        color: var(--rte-muted);
        border-color: var(--rte-border);
      }
      mas-rich-text-editor.rte-dark-theme p[role='alert'] {
        background-color: #451a1a;
        color: #fecaca;
      }
      mas-rich-text-editor.rte-dark-theme .rte-link-popover {
        background-color: #1f2937;
        border-color: var(--rte-border);
        color: var(--rte-text);
      }
      mas-rich-text-editor.rte-dark-theme .rte-link-input {
        background-color: #111827;
        border-color: var(--rte-border);
        color: var(--rte-text);
      }
    `,
  ],
  template: `
    <div
      class="bg-white overflow-hidden"
      [class.rounded-lg]="!noBorder()"
      [class.border]="!noBorder()"
      [class.border-gray-200]="!noBorder()"
      [class.opacity-50]="isDisabled()"
      [class.pointer-events-none]="isDisabled()"
    >
      <!-- ── Toolbar ── -->
      <div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80 select-none flex-wrap">
        <!-- Heading / Paragraph selector -->
        <select
          class="h-[28px] rounded px-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-400 cursor-pointer transition-colors mr-0.5"
          [value]="currentHeadingLevel()"
          (mousedown)="$event.stopPropagation()"
          (change)="setHeading($event)"
        >
          <option value="1">Title</option>
          <option value="2">Heading</option>
          <option value="3">Subheading</option>
          <option value="0">Paragraph</option>
        </select>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>
        <!-- Bold -->
        <button
          type="button"
          title="Bold (⌘B)"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isBold()"
          [class.!text-gray-900]="isBold()"
          (mousedown)="$event.preventDefault(); toggle('bold')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
          </svg>
        </button>

        <!-- Italic -->
        <button
          type="button"
          title="Italic (⌘I)"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isItalic()"
          [class.!text-gray-900]="isItalic()"
          (mousedown)="$event.preventDefault(); toggle('italic')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        <!-- Underline -->
        <button
          type="button"
          title="Underline (⌘U)"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isUnderline()"
          [class.!text-gray-900]="isUnderline()"
          (mousedown)="$event.preventDefault(); toggle('underline')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <!-- Link -->
        <button
          type="button"
          title="Link"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isLink()"
          [class.!text-gray-900]="isLink()"
          (mousedown)="$event.preventDefault(); toggleLink()"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <!-- Bullet list -->
        <button
          type="button"
          title="Bullet list"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isBulletList()"
          [class.!text-gray-900]="isBulletList()"
          (mousedown)="$event.preventDefault(); toggle('bulletList')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <!-- Ordered list -->
        <button
          type="button"
          title="Numbered list"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isOrderedList()"
          [class.!text-gray-900]="isOrderedList()"
          (mousedown)="$event.preventDefault(); toggle('orderedList')"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-2-2-2" />
          </svg>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <button
          type="button"
          title="Align left"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('left')"
          (mousedown)="$event.preventDefault(); setTextAlign('left')"
        >
          Left
        </button>
        <button
          type="button"
          title="Align center"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('center')"
          (mousedown)="$event.preventDefault(); setTextAlign('center')"
        >
          Center
        </button>
        <button
          type="button"
          title="Align right"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('right')"
          (mousedown)="$event.preventDefault(); setTextAlign('right')"
        >
          Right
        </button>
        <button
          type="button"
          title="Justify"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('justify')"
          (mousedown)="$event.preventDefault(); setTextAlign('justify')"
        >
          Justify
        </button>
        <button
          type="button"
          title="Decrease indent"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); changeIndent(-1)"
        >
          Outdent
        </button>
        <button
          type="button"
          title="Increase indent"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); changeIndent(1)"
        >
          Indent
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <button
          type="button"
          title="Insert table"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); insertTable()"
        >
          Table
        </button>
        <button
          type="button"
          title="Add table row"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); addTableRow()"
        >
          + Row
        </button>
        <button
          type="button"
          title="Add table column"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); addTableColumn()"
        >
          + Col
        </button>
        <button
          type="button"
          title="Delete table"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-red-600 transition-colors"
          (mousedown)="$event.preventDefault(); deleteTable()"
        >
          Delete table
        </button>

        <label class="flex items-center gap-1 px-1 text-xs text-gray-500" title="Text color">
          <span aria-hidden="true">A</span>
          <input type="color" class="w-5 h-5 cursor-pointer" value="#111827" (input)="setColor($event)" />
        </label>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>
        <button
          type="button"
          title="Undo"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); undo()"
        >
          Undo
        </button>
        <button
          type="button"
          title="Redo"
          class="px-2 h-[28px] rounded text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); redo()"
        >
          Redo
        </button>

        <!-- Image upload -->
        <input #imageFileInput type="file" accept="image/*" class="hidden" (change)="handleImageUpload($event)" />
        <button
          type="button"
          title="Insert image"
          class="flex items-center justify-center w-[28px] h-[28px] rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.opacity-50]="uploadingImage()"
          (mousedown)="$event.preventDefault(); imageFileInput.click()"
          [disabled]="uploadingImage()"
        >
          @if (uploadingImage()) {
            <svg
              class="animate-spin"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          } @else {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          }
        </button>
      </div>
      <!-- ── Editor mount ── -->
      <div #editorHost class="rte-editor-host" [class.hidden]="sourceMode()" [style.minHeight]="minHeight()"></div>
      @if (sourceMode()) {
        <textarea
          class="rte-source-editor block w-full border-0 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-0"
          [style.minHeight]="minHeight()"
          aria-label="HTML source"
          [value]="sourceHtml()"
          (input)="setSourceHtml($event)"
        ></textarea>
      }
      @if (uploadError()) {
        <p class="px-3 py-1.5 text-xs text-red-600 bg-red-50" role="alert">{{ uploadError() }}</p>
      }
      @if (sourceError()) {
        <p class="px-3 py-1.5 text-xs text-red-600 bg-red-50" role="alert">{{ sourceError() }}</p>
      }
      <div class="flex items-center justify-between px-3 py-1 text-[11px] text-gray-400 border-t border-gray-100">
        <span>{{ wordCount() }} words</span>
        <button
          type="button"
          class="text-blue-600 hover:underline"
          [disabled]="isDisabled()"
          (mousedown)="$event.preventDefault(); toggleSourceMode()"
        >
          {{ sourceMode() ? 'Apply HTML' : 'Edit HTML' }}
        </button>
      </div>
    </div>

    <!-- ── Link popover ── -->
    @if (linkMode() !== 'none') {
      @if (linkMode() === 'editing') {
        <div class="fixed inset-0 z-40" (mousedown)="cancelLink()"></div>
      }
      <div
        class="rte-link-popover fixed z-50 flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2"
        [style.left.px]="linkPopoverPos().x"
        [style.top.px]="linkPopoverPos().y"
        (mousedown)="$event.stopPropagation()"
      >
        @if (linkMode() === 'preview') {
          <a
            [href]="existingLinkHref()"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 text-xs hover:underline truncate max-w-[200px]"
          >
            {{ existingLinkHref() }}
          </a>
          <div class="w-px h-3.5 bg-gray-200 mx-0.5 shrink-0"></div>
          <button
            type="button"
            title="Edit link"
            class="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); editLink()"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          <button
            type="button"
            title="Remove link"
            class="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); deleteLink()"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        } @else {
          <input
            type="url"
            class="rte-link-input w-48 text-xs rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
            placeholder="https://"
            [value]="pendingLinkUrl()"
            (input)="setPendingLinkUrl($event)"
            (keydown.enter)="confirmLink()"
            (keydown.escape)="cancelLink()"
          />
          <button
            type="button"
            title="Confirm"
            class="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); confirmLink()"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
          <button
            type="button"
            title="Cancel"
            class="flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); cancelLink()"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        }
      </div>
    }
  `,
})
export class RichTextEditorComponent implements ControlValueAccessor, OnDestroy {
  private readonly http = inject(HttpClient);
  readonly themeService = inject(ThemeService);

  readonly editorHostRef = viewChild.required<ElementRef<HTMLElement>>('editorHost');

  readonly value = model('');
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly minHeight = input('80px');
  readonly noBorder = input(false);
  readonly uploadEndpoint = input('/api/rich-text-images/upload');

  readonly isBold = signal(false);
  readonly isItalic = signal(false);
  readonly isUnderline = signal(false);
  readonly isLink = signal(false);
  readonly isBulletList = signal(false);
  readonly isOrderedList = signal(false);
  readonly activeTextAlign = signal('left');
  readonly currentHeadingLevel = signal<0 | 1 | 2 | 3>(0);
  readonly uploadingImage = signal(false);
  readonly uploadError = signal('');
  readonly sourceMode = signal(false);
  readonly sourceHtml = signal('');
  readonly sourceError = signal('');
  readonly wordCount = signal(0);
  readonly linkMode = signal<'none' | 'preview' | 'editing'>('none');
  readonly linkPopoverPos = signal({ x: 0, y: 0 });
  readonly existingLinkHref = signal('');
  readonly pendingLinkUrl = signal('');
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private editor: Editor | null = null;
  private readonly formDisabled = signal(false);
  private readonly editorContent = computed(() => this.value());
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const value = this.editorContent();
      const disabled = this.isDisabled();
      untracked(() => {
        if (!this.editor) return;

        if (this.editor.isEditable !== !disabled) {
          this.editor.setEditable(!disabled);
        }
        this.setEditorContent(value);
      });
    });
    afterNextRender(() => this.initEditor());
  }

  private setEditorContent(newValue: string): void {
    if (!this.editor) return;

    const current = this.editor.getHTML();
    const normalizedCurrent = current === '<p></p>' ? '' : current;
    if (normalizedCurrent !== newValue) {
      this.editor.commands.setContent(newValue, { emitUpdate: false });
      this.refreshEditorState();
    }
  }

  private initEditor(): void {
    this.editor = new Editor({
      element: this.editorHostRef().nativeElement,
      extensions: [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Underline,
        Heading.configure({ levels: [1, 2, 3] }),
        Image.configure({ inline: false, allowBase64: false }),
        TextStyle,
        Color,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        }),
        BulletList,
        OrderedList,
        ListItem,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
        Indent,
        UndoRedo,
        Placeholder.configure({ placeholder: this.placeholder() }),
      ],
      content: this.editorContent(),
      editable: !this.isDisabled(),
      onTransaction: () => {
        if (!this.editor) return;
        this.isBold.set(this.editor.isActive('bold'));
        this.isItalic.set(this.editor.isActive('italic'));
        this.isUnderline.set(this.editor.isActive('underline'));
        this.isLink.set(this.editor.isActive('link'));
        this.isBulletList.set(this.editor.isActive('bulletList'));
        this.isOrderedList.set(this.editor.isActive('orderedList'));
        this.activeTextAlign.set(
          this.editor.getAttributes('paragraph')['textAlign'] ||
            this.editor.getAttributes('heading')['textAlign'] ||
            'left',
        );
        if (this.editor.isActive('heading', { level: 1 })) this.currentHeadingLevel.set(1);
        else if (this.editor.isActive('heading', { level: 2 })) this.currentHeadingLevel.set(2);
        else if (this.editor.isActive('heading', { level: 3 })) this.currentHeadingLevel.set(3);
        else this.currentHeadingLevel.set(0);
        this.wordCount.set(this.editor.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length);
      },
      onSelectionUpdate: ({ editor }) => {
        if (this.linkMode() === 'editing') return;
        if (editor.isActive('link')) {
          const { view } = editor;
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          this.existingLinkHref.set(editor.getAttributes('link')['href'] || '');
          this.linkPopoverPos.set({ x: coords.left, y: coords.bottom + 8 });
          this.linkMode.set('preview');
        } else {
          this.linkMode.set('none');
        }
      },
      onUpdate: () => {
        this.emitValue();
      },
      onBlur: () => this.onTouched(),
    });
    this.refreshEditorState();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  writeValue(value: string | null): void {
    const normalizedValue = value ?? '';
    this.value.set(normalizedValue);
    this.setEditorContent(normalizedValue);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    this.editor?.setEditable(!this.isDisabled());
  }

  private emitValue(): void {
    if (!this.editor) return;
    const html = this.editor.getHTML();
    const value = html === '<p></p>' ? '' : html;
    this.value.set(value);
    this.onChange(value);
  }

  private refreshEditorState(): void {
    if (!this.editor) return;
    this.isBold.set(this.editor.isActive('bold'));
    this.isItalic.set(this.editor.isActive('italic'));
    this.isUnderline.set(this.editor.isActive('underline'));
    this.isLink.set(this.editor.isActive('link'));
    this.isBulletList.set(this.editor.isActive('bulletList'));
    this.isOrderedList.set(this.editor.isActive('orderedList'));
    this.activeTextAlign.set(
      this.editor.getAttributes('paragraph')['textAlign'] ||
        this.editor.getAttributes('heading')['textAlign'] ||
        'left',
    );
    if (this.editor.isActive('heading', { level: 1 })) this.currentHeadingLevel.set(1);
    else if (this.editor.isActive('heading', { level: 2 })) this.currentHeadingLevel.set(2);
    else if (this.editor.isActive('heading', { level: 3 })) this.currentHeadingLevel.set(3);
    else this.currentHeadingLevel.set(0);
    this.wordCount.set(this.editor.state.doc.textContent.trim().split(/\s+/).filter(Boolean).length);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get chain(): any {
    return this.editor?.chain().focus();
  }

  toggle(mark: string): void {
    if (!this.editor) return;
    switch (mark) {
      case 'bold':
        this.chain.toggleBold().run();
        break;
      case 'italic':
        this.chain.toggleItalic().run();
        break;
      case 'underline':
        this.chain.toggleUnderline().run();
        break;
      case 'bulletList':
        this.chain.toggleBulletList().run();
        break;
      case 'orderedList':
        this.chain.toggleOrderedList().run();
        break;
    }
  }

  isTextAlign(alignment: string): boolean {
    return this.activeTextAlign() === alignment;
  }

  setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify'): void {
    this.editor?.chain().focus().setTextAlign(alignment).run();
  }

  changeIndent(delta: number): void {
    if (!this.editor) return;
    const current = Number(
      this.editor.getAttributes('paragraph')['indent'] ?? this.editor.getAttributes('heading')['indent'] ?? 0,
    );
    const indent = Math.max(0, Math.min(6, current + delta));
    this.editor
      .chain()
      .focus()
      .updateAttributes(this.editor.isActive('heading') ? 'heading' : 'paragraph', { indent })
      .run();
  }

  insertTable(): void {
    this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  addTableRow(): void {
    this.editor?.chain().focus().addRowAfter().run();
  }

  addTableColumn(): void {
    this.editor?.chain().focus().addColumnAfter().run();
  }

  deleteTable(): void {
    this.editor?.chain().focus().deleteTable().run();
  }

  undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  setColor(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.editor?.chain().focus().setColor(color).run();
  }

  toggleSourceMode(): void {
    if (!this.editor) return;
    if (!this.sourceMode()) {
      this.sourceError.set('');
      this.sourceHtml.set(this.editor.getHTML());
      this.sourceMode.set(true);
      return;
    }

    const source = this.sourceHtml();
    const unsupportedTag = source.match(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)?.find((tag) => {
      const name = tag.match(/<\/?([a-z][a-z0-9-]*)/i)?.[1]?.toLowerCase();
      return !!name && !SUPPORTED_SOURCE_TAGS.has(name);
    });
    if (unsupportedTag) {
      this.sourceError.set(`Unsupported HTML element: ${unsupportedTag}`);
      return;
    }

    try {
      this.editor.commands.setContent(source, { emitUpdate: false });
      this.sourceError.set('');
      this.sourceMode.set(false);
      this.refreshEditorState();
      this.emitValue();
    } catch {
      this.sourceError.set('That HTML could not be applied. Your previous content was kept.');
    }
  }

  setSourceHtml(event: Event): void {
    this.sourceHtml.set((event.target as HTMLTextAreaElement).value);
  }

  toggleLink(): void {
    if (!this.editor) return;
    if (this.editor.isActive('link')) {
      this.editor.chain().focus().unsetLink().run();
      this.linkMode.set('none');
    } else {
      this.openLinkEdit();
    }
  }

  private openLinkEdit(): void {
    if (!this.editor) return;
    const { view } = this.editor;
    const { from } = view.state.selection;
    const coords = view.coordsAtPos(from);
    this.pendingLinkUrl.set('');
    this.linkPopoverPos.set({ x: coords.left, y: coords.bottom + 8 });
    this.linkMode.set('editing');
    setTimeout(() => document.querySelector<HTMLInputElement>('.rte-link-input')?.focus(), 0);
  }

  editLink(): void {
    this.pendingLinkUrl.set(this.existingLinkHref());
    this.linkMode.set('editing');
    setTimeout(() => document.querySelector<HTMLInputElement>('.rte-link-input')?.focus(), 0);
  }

  deleteLink(): void {
    this.editor?.chain().focus().unsetLink().run();
    this.linkMode.set('none');
  }

  confirmLink(): void {
    const url = this.pendingLinkUrl().trim();
    if (url) {
      const href = url.startsWith('http') ? url : `https://${url}`;
      this.editor?.chain().focus().setLink({ href }).run();
    }
    this.linkMode.set('none');
  }

  cancelLink(): void {
    this.linkMode.set('none');
  }

  setHeading(event: Event): void {
    if (!this.editor) return;
    const value = (event.target as HTMLSelectElement).value;
    const level = parseInt(value) as 0 | 1 | 2 | 3;
    if (level === 0) {
      this.editor.chain().focus().setParagraph().run();
    } else {
      this.editor.chain().focus().setHeading({ level }).run();
    }
  }

  setPendingLinkUrl(event: Event): void {
    this.pendingLinkUrl.set((event.target as HTMLInputElement).value);
  }

  handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploadError.set('');
    this.uploadingImage.set(true);
    const formData = new FormData();
    formData.append('image', file);
    this.http.post<{ url: string }>(this.uploadEndpoint(), formData).subscribe({
      next: ({ url }) => {
        this.editor?.chain().focus().setImage({ src: url }).run();
        this.uploadingImage.set(false);
      },
      error: () => {
        this.uploadingImage.set(false);
        this.uploadError.set('The image could not be uploaded. Please try again.');
      },
    });
  }
}
