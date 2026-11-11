import { MatIcon } from '@angular/material/icon';
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
  imports: [MatIcon],
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
        color: var(--rte-muted);
      }
      mas-rich-text-editor.rte-dark-theme > div:first-child > div:first-child button:hover {
        color: var(--rte-text);
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
          class="h-[28px] rounded-lg px-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer transition-colors mr-0.5"
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
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isBold()"
          [class.!text-gray-900]="isBold()"
          (mousedown)="$event.preventDefault(); toggle('bold')"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">format_bold</mat-icon>
        </button>

        <!-- Italic -->
        <button
          type="button"
          title="Italic (⌘I)"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isItalic()"
          [class.!text-gray-900]="isItalic()"
          (mousedown)="$event.preventDefault(); toggle('italic')"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">format_italic</mat-icon>
        </button>

        <!-- Underline -->
        <button
          type="button"
          title="Underline (⌘U)"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isUnderline()"
          [class.!text-gray-900]="isUnderline()"
          (mousedown)="$event.preventDefault(); toggle('underline')"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">format_underlined</mat-icon>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <!-- Link -->
        <button
          type="button"
          title="Link"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isLink()"
          [class.!text-gray-900]="isLink()"
          (mousedown)="$event.preventDefault(); toggleLink()"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">link</mat-icon>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <!-- Bullet list -->
        <button
          type="button"
          title="Bullet list"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isBulletList()"
          [class.!text-gray-900]="isBulletList()"
          (mousedown)="$event.preventDefault(); toggle('bulletList')"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">format_list_bulleted</mat-icon>
        </button>

        <!-- Ordered list -->
        <button
          type="button"
          title="Numbered list"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isOrderedList()"
          [class.!text-gray-900]="isOrderedList()"
          (mousedown)="$event.preventDefault(); toggle('orderedList')"
        >
          <mat-icon aria-hidden="true" class="mas-icon-sm">format_list_numbered</mat-icon>
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <button
          type="button"
          title="Align left"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('left')"
          (mousedown)="$event.preventDefault(); setTextAlign('left')"
        >
          Left
        </button>
        <button
          type="button"
          title="Align center"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('center')"
          (mousedown)="$event.preventDefault(); setTextAlign('center')"
        >
          Center
        </button>
        <button
          type="button"
          title="Align right"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('right')"
          (mousedown)="$event.preventDefault(); setTextAlign('right')"
        >
          Right
        </button>
        <button
          type="button"
          title="Justify"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          [class.bg-gray-200]="isTextAlign('justify')"
          (mousedown)="$event.preventDefault(); setTextAlign('justify')"
        >
          Justify
        </button>
        <button
          type="button"
          title="Decrease indent"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); changeIndent(-1)"
        >
          Outdent
        </button>
        <button
          type="button"
          title="Increase indent"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); changeIndent(1)"
        >
          Indent
        </button>

        <div class="w-px h-4 bg-gray-200 mx-1 shrink-0"></div>

        <button
          type="button"
          title="Insert table"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); insertTable()"
        >
          Table
        </button>
        <button
          type="button"
          title="Add table row"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); addTableRow()"
        >
          + Row
        </button>
        <button
          type="button"
          title="Add table column"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); addTableColumn()"
        >
          + Col
        </button>
        <button
          type="button"
          title="Delete table"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-red-600 transition-colors"
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
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); undo()"
        >
          Undo
        </button>
        <button
          type="button"
          title="Redo"
          class="px-2 h-[28px] rounded-lg text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
          (mousedown)="$event.preventDefault(); redo()"
        >
          Redo
        </button>

        <!-- Image upload -->
        <input #imageFileInput type="file" accept="image/*" class="hidden" (change)="handleImageUpload($event)" />
        <button
          type="button"
          title="Insert image"
          class="flex items-center justify-center w-[28px] h-[28px] rounded-lg text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
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
            <mat-icon aria-hidden="true" class="mas-icon-sm">image</mat-icon>
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
      <div class="flex items-center justify-between px-3 py-1 text-xs text-gray-400 border-t border-gray-100">
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
            class="flex items-center justify-center w-6 h-6 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); editLink()"
          >
            <mat-icon aria-hidden="true" class="mas-icon-sm">edit</mat-icon>
          </button>
          <button
            type="button"
            title="Remove link"
            class="flex items-center justify-center w-6 h-6 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); deleteLink()"
          >
            <mat-icon aria-hidden="true" class="mas-icon-sm">delete</mat-icon>
          </button>
        } @else {
          <input
            type="url"
            class="rte-link-input w-48 text-xs rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
            placeholder="https://"
            [value]="pendingLinkUrl()"
            (input)="setPendingLinkUrl($event)"
            (keydown.enter)="confirmLink()"
            (keydown.escape)="cancelLink()"
          />
          <button
            type="button"
            title="Confirm"
            class="flex items-center justify-center w-6 h-6 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); confirmLink()"
          >
            <mat-icon aria-hidden="true" class="mas-icon-sm">check</mat-icon>
          </button>
          <button
            type="button"
            title="Cancel"
            class="flex items-center justify-center w-6 h-6 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
            (mousedown)="$event.preventDefault(); cancelLink()"
          >
            <mat-icon aria-hidden="true" class="mas-icon-sm">close</mat-icon>
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
