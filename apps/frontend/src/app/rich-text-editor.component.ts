import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Editor } from '@tiptap/core';
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
import { Placeholder, UndoRedo } from '@tiptap/extensions';

@Component({
  selector: 'mas-rich-text-editor',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      mas-rich-text-editor .rte-editor-host .ProseMirror {
        outline: none;
        padding: 10px 12px;
        font-size: 14px;
        line-height: 1.65;
        color: #111827;
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
        color: #9ca3af;
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
        color: #2563eb;
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
        color: #111827;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror h2 {
        font-size: 1.25em;
        font-weight: 700;
        line-height: 1.35;
        margin: 0.5em 0 0.2em;
        color: #111827;
      }
      mas-rich-text-editor .rte-editor-host .ProseMirror h3 {
        font-size: 1.1em;
        font-weight: 600;
        line-height: 1.4;
        margin: 0.4em 0 0.15em;
        color: #111827;
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
      mas-rich-text-editor .rte-uploading-spinner {
        pointer-events: none;
      }
    `,
  ],
  template: `
    <div
      class="bg-white overflow-hidden"
      [class.rounded-lg]="!noBorder"
      [class.border]="!noBorder"
      [class.border-gray-200]="!noBorder"
      [class.opacity-50]="disabled"
      [class.pointer-events-none]="disabled"
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
      <div #editorHost class="rte-editor-host" [style.minHeight]="minHeight"></div>
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
export class RichTextEditorComponent implements OnChanges, OnDestroy {
  private readonly http = inject(HttpClient);

  @ViewChild('editorHost') editorHostRef!: ElementRef<HTMLElement>;

  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() minHeight = '80px';
  @Input() noBorder = false;

  readonly isBold = signal(false);
  readonly isItalic = signal(false);
  readonly isUnderline = signal(false);
  readonly isLink = signal(false);
  readonly isBulletList = signal(false);
  readonly isOrderedList = signal(false);
  readonly currentHeadingLevel = signal<0 | 1 | 2 | 3>(0);
  readonly uploadingImage = signal(false);
  readonly linkMode = signal<'none' | 'preview' | 'editing'>('none');
  readonly linkPopoverPos = signal({ x: 0, y: 0 });
  readonly existingLinkHref = signal('');
  readonly pendingLinkUrl = signal('');

  private editor: Editor | null = null;

  constructor() {
    afterNextRender(() => this.initEditor());
  }

  private initEditor(): void {
    this.editor = new Editor({
      element: this.editorHostRef.nativeElement,
      extensions: [
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Underline,
        Heading.configure({ levels: [1, 2, 3] }),
        Image.configure({ inline: false, allowBase64: false }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        }),
        BulletList,
        OrderedList,
        ListItem,
        UndoRedo,
        Placeholder.configure({ placeholder: this.placeholder }),
      ],
      content: this.value || '',
      editable: !this.disabled,
      onTransaction: () => {
        if (!this.editor) return;
        this.isBold.set(this.editor.isActive('bold'));
        this.isItalic.set(this.editor.isActive('italic'));
        this.isUnderline.set(this.editor.isActive('underline'));
        this.isLink.set(this.editor.isActive('link'));
        this.isBulletList.set(this.editor.isActive('bulletList'));
        this.isOrderedList.set(this.editor.isActive('orderedList'));
        if (this.editor.isActive('heading', { level: 1 })) this.currentHeadingLevel.set(1);
        else if (this.editor.isActive('heading', { level: 2 })) this.currentHeadingLevel.set(2);
        else if (this.editor.isActive('heading', { level: 3 })) this.currentHeadingLevel.set(3);
        else this.currentHeadingLevel.set(0);
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
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.valueChange.emit(html === '<p></p>' ? '' : html);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.editor) {
      const newVal = changes['value'].currentValue || '';
      const current = this.editor.getHTML();
      const normalizedCurrent = current === '<p></p>' ? '' : current;
      if (normalizedCurrent !== newVal) {
        this.editor.commands.setContent(newVal, { emitUpdate: false });
      }
    }
    if (changes['disabled'] && this.editor) {
      this.editor.setEditable(!this.disabled);
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
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

    this.uploadingImage.set(true);
    const formData = new FormData();
    formData.append('image', file);
    this.http.post<{ url: string }>('/api/discussion-posts/upload-image', formData).subscribe({
      next: ({ url }) => {
        this.editor?.chain().focus().setImage({ src: url }).run();
        this.uploadingImage.set(false);
      },
      error: () => {
        this.uploadingImage.set(false);
      },
    });
  }
}
