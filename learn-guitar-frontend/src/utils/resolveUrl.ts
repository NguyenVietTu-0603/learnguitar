/**
 * Resolve a URL that may be either a full URL (http://...) or a relative path (/static/...).
 * Relative paths are resolved against the backend base URL.
 */
const BACKEND_BASE = (import.meta.env.VITE_API_URL as string || 'http://localhost:5000/api/v1')
  .replace(/\/api\/v1\/?$/, '');

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already an absolute URL
  if (/^https?:\/\//i.test(url)) return url;

  // Relative path – prepend backend origin
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_BASE}${path}`;
}
