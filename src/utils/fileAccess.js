import { getToken } from '../services/api';

/**
 * Fetches a proxied file (adding the Authorization header a plain <a> navigation
 * can't send) and either opens it inline in a new tab or triggers a download.
 */
export async function openProxyFile(proxyUrl, { download = false, filename } = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('Please log in to view this file.');
  }

  const url = download
    ? `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}download=1`
    : proxyUrl;

  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    throw new Error(resp.status === 401
      ? 'Please log in to view this file.'
      : 'Failed to load file');
  }

  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);

  if (download) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  // Revoke after a delay so the new tab / download has time to start reading the blob.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
