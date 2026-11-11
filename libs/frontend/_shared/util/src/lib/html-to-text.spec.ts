import { htmlToText } from './html-to-text';

describe('htmlToText', () => {
  it('drops tags and keeps words in separate paragraphs apart', () => {
    expect(htmlToText('<p>This is a test program.</p><p>Second&nbsp;line</p>')).toBe(
      'This is a test program. Second line',
    );
  });

  it('decodes common entities and character codes', () => {
    expect(htmlToText('Savings &amp; credit &lt;3 &#39;now&#39; &#x2014; ok')).toBe("Savings & credit <3 'now' — ok");
  });

  it('handles empty values', () => {
    expect(htmlToText(null)).toBe('');
    expect(htmlToText('<p></p>')).toBe('');
  });
});
