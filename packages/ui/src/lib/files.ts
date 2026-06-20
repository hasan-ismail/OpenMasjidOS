/** Helpers for the file explorer's streaming endpoints (download/upload). */

export function filesDownloadUrl(p: string): string {
  return `/api/files/download?path=${encodeURIComponent(p)}`;
}

export async function uploadFile(dir: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/files/upload?path=${encodeURIComponent(dir)}`, {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: 'Upload failed' }))) as { error?: string };
    throw new Error(body.error ?? 'Upload failed');
  }
}

/** Join a directory path with a child name. */
export function joinPath(base: string, name: string): string {
  return base === '/' ? `/${name}` : `${base}/${name}`;
}

/** Parent directory of a path ("/a/b" → "/a", "/a" → "/"). */
export function parentPath(p: string): string {
  if (p === '/' || !p.includes('/')) return '/';
  const trimmed = p.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  return idx <= 0 ? '/' : trimmed.slice(0, idx);
}
