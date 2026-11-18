import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { safeImageSrc } from '../src/domain/safeUrl';

describe('safeImageSrc', () => {
  it('keeps web images, same-origin paths, blob previews and image data URLs', () => {
    assert.equal(safeImageSrc('https://example.com/a.png'), 'https://example.com/a.png');
    assert.equal(safeImageSrc('/api/v1/media/photo/abc?e=1&s=2'), '/api/v1/media/photo/abc?e=1&s=2');
    assert.equal(safeImageSrc('blob:https://x/uuid'), 'blob:https://x/uuid');
    assert.equal(safeImageSrc('data:image/png;base64,iVBORw0KGgo='), 'data:image/png;base64,iVBORw0KGgo=');
  });
  it('drops scripts, odd protocols, protocol-relative links and non-strings', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html;base64,PHNjcmlwdD4=', '//evil.example/x.png', 'file:///etc/passwd', '', '   ']) assert.equal(safeImageSrc(bad), '');
    for (const bad of [null, undefined, 5, ['https://x'], { a: 1 }]) assert.equal(safeImageSrc(bad), '');
  });
});
