import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from '@tiptap/core';
import { ThemeService } from '@mas/frontend-shared-data-access';
import { RichTextEditorComponent } from './rich-text-editor.component';

describe('RichTextEditorComponent', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let component: RichTextEditorComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function editor(): Editor {
    return (component as unknown as { editor: Editor }).editor;
  }

  function eventWithTarget(target: EventTarget): Event {
    return { target } as unknown as Event;
  }

  it('synchronizes user edits with Angular forms and keeps empty content empty', () => {
    const onChange = jest.fn();
    const onTouched = jest.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    editor().commands.setContent('<p>Hello <strong>world</strong></p>');
    expect(onChange).toHaveBeenLastCalledWith('<p>Hello <strong>world</strong></p>');
    expect(component.value()).toBe('<p>Hello <strong>world</strong></p>');
    expect(component.wordCount()).toBe(2);

    editor().commands.clearContent();
    expect(onChange).toHaveBeenLastCalledWith('');

    editor().view.dom.dispatchEvent(new FocusEvent('blur'));
    expect(onTouched).toHaveBeenCalled();
  });

  it('follows the shared user theme preference while the editor is open', () => {
    const themeService = TestBed.inject(ThemeService);

    expect(fixture.nativeElement.classList).toContain('rte-dark-theme');

    themeService.toggleDarkMode(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).not.toContain('rte-dark-theme');

    themeService.toggleDarkMode(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('rte-dark-theme');
  });

  it('responds to signal input changes', () => {
    fixture.componentRef.setInput('value', '<p>From input</p>');
    fixture.detectChanges();
    expect(editor().getHTML()).toBe('<p>From input</p>');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(editor().isEditable).toBe(false);

    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(editor().isEditable).toBe(true);
  });

  it('supports formatting, tables, alignment, indentation, and colors', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    editor().commands.setContent('<p>Content</p>');
    editor().chain().selectAll().toggleBold().setTextAlign('center').setColor('#843fa1').run();
    component.changeIndent(1);

    expect(editor().getHTML()).toContain('<strong>Content</strong>');
    expect(editor().getHTML()).toContain('text-align: center');
    expect(editor().getHTML()).toContain('color: rgb(132, 63, 161)');
    expect(editor().getHTML()).toContain('data-indent="1"');

    editor().chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    expect(editor().getHTML()).toContain('<table');
    expect(onChange).toHaveBeenCalled();
  });

  it('applies valid source HTML and rejects unsupported source elements', () => {
    component.toggleSourceMode();
    const validSource = document.createElement('textarea');
    validSource.value = '<h2>Updated</h2><p><span style="color: #3598db">Text</span></p>';
    component.setSourceHtml(eventWithTarget(validSource));
    component.toggleSourceMode();
    expect(editor().getHTML()).toContain('<h2>Updated</h2>');
    expect(component.sourceError()).toBe('');

    component.toggleSourceMode();
    const invalidSource = document.createElement('textarea');
    invalidSource.value = '<script>alert(1)</script>';
    component.setSourceHtml(eventWithTarget(invalidSource));
    component.toggleSourceMode();
    expect(component.sourceMode()).toBe(true);
    expect(component.sourceError()).toContain('Unsupported HTML element');
  });

  it('preserves representative legacy HTML and supports external value writes', () => {
    const legacy = `<h2>Guide</h2><ul><li><span style="color: #843fa1"><strong>Colored</strong></span><br><img src="/assets/rich-text/photo.png"><ol><li>Nested</li></ol></li></ul>`;
    component.writeValue(legacy);

    expect(editor().getHTML()).toContain('<h2>Guide</h2>');
    expect(editor().getHTML()).toContain('color: rgb(132, 63, 161)');
    expect(editor().getHTML()).toContain('/assets/rich-text/photo.png');
    expect(editor().getHTML()).toContain('<ol>');

    const onChange = jest.fn();
    component.registerOnChange(onChange);
    component.writeValue('<p>Patched</p>');
    expect(editor().getHTML()).toBe('<p>Patched</p>');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uploads valid images and leaves content unchanged on failure', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    component.handleImageUpload(eventWithTarget(input));

    const request = http.expectOne('/api/rich-text-images/upload');
    expect(request.request.method).toBe('POST');
    request.flush({ url: '/assets/rich-text/photo.png' });
    expect(editor().getHTML()).toContain('/assets/rich-text/photo.png');
    expect(component.uploadingImage()).toBe(false);

    component.handleImageUpload(eventWithTarget(input));
    const failedRequest = http.expectOne('/api/rich-text-images/upload');
    failedRequest.flush('failed', { status: 500, statusText: 'Server error' });
    expect(component.uploadError()).toContain('could not be uploaded');
    expect(component.uploadingImage()).toBe(false);
  });
});
