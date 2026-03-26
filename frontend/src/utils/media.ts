export function resolveMediaUrl(url: string): string {
  if (!url) return url;

  const isAbsolute = /^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:');
  if (isAbsolute) return url;

  if (url.startsWith('/uploads/')) {
    return `/api${url}`;
  }

  return url;
}
