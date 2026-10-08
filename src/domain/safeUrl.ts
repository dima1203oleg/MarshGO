/**
 * Image sources come from user input or storage URLs. Only plain web images (https/http), same-origin paths,
 * blob previews and image data URLs may reach an <img src>; anything else (javascript:, other data: types) becomes empty.
 */
export function safeImageSrc(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (url.length === 0 || url.length > 2048000) return '';
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  if (/^blob:/i.test(url)) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
  } catch { return ''; }
}
