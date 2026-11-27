/**
 * Resolves a media URL (player photo or payment screenshot) to a valid absolute URL.
 * If already absolute (e.g. Supabase signed URL https://...), returns it directly.
 * If relative (/api/v1/...), prepends the backend base URL (https://kpl-3wty.onrender.com).
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Remove trailing /api/v1 if present in VITE_API_BASE_URL to get host origin
  const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const backendHost = rawBase.startsWith('http')
    ? rawBase.replace(/\/api\/v1\/?$/, '')
    : 'https://kpl-3wty.onrender.com';

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendHost}${cleanPath}`;
}
