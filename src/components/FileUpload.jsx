/**
 * OpenI Hub — Reusable File Upload Component
 * Uploads files to Cloudinary via /api/upload, shows preview + progress.
 * Falls back to URL text input if upload fails.
 */
import { useState, useRef } from 'react';
import { uploadAPI } from '../services/api';
import { Upload, X, FileText, Loader2, ExternalLink } from 'lucide-react';

const G = '#D5AA5B';

const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('/image/upload/');
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * @param {object} props
 * @param {string} props.value - Current URL string
 * @param {function} props.onChange - Callback with new URL when upload completes or URL cleared
 * @param {string} [props.folder='general'] - Cloudinary folder
 * @param {string} [props.accept='image/*,.pdf,.doc,.docx,.ppt,.pptx'] - File type filter
 * @param {string} [props.label] - Field label
 * @param {boolean} [props.compact=false] - Compact mode for inline use
 */
export default function FileUpload({
  value = '',
  onChange,
  folder = 'general',
  accept = 'image/*,.pdf,.doc,.docx,.ppt,.pptx',
  label,
  compact = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [lastFilename, setLastFilename] = useState(null);
  const [lastBytes, setLastBytes] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadAPI.upload(file, folder);
      onChange(result.url);
      setLastFilename(file.name || result.original_filename);
      setLastBytes(result.bytes);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const clear = () => {
    onChange('');
    setLastFilename(null);
    setLastBytes(null);
    setError(null);
  };

  const isImage = isImageUrl(value);

  // ── Compact mode (for inline data room rows) ──────────────
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <input type="file" ref={inputRef} accept={accept} onChange={handleInputChange} style={{ display: 'none' }} />
        {value ? (
          <>
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {lastFilename || 'Uploaded file'} <ExternalLink size={10} style={{ verticalAlign: -1 }} />
            </a>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}>
              {uploading ? <Loader2 size={10} className="animate-spin" /> : 'Change'}
            </button>
            <button onClick={clear} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#dc2626' }}>
              <X size={10} />
            </button>
          </>
        ) : (
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
            {uploading ? <Loader2 size={12} className="animate-spin" style={{ color: G }} /> : <Upload size={12} />}
            {uploading ? 'Uploading...' : 'Upload file'}
          </button>
        )}
        {error && <span style={{ fontSize: 10, color: '#dc2626' }}>{error}</span>}
      </div>
    );
  }

  // ── Standard mode ─────────────────────────────────────────
  return (
    <div>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{label}</label>}
      <input type="file" ref={inputRef} accept={accept} onChange={handleInputChange} style={{ display: 'none' }} />

      {value ? (
        /* File uploaded — show preview */
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fafafa', display: 'flex', alignItems: 'center', gap: 12 }}>
          {isImage ? (
            <img src={value} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid #eee' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={22} style={{ color: '#2563eb' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lastFilename || (isImage ? 'Image' : 'Document')}
            </div>
            {lastBytes && <div style={{ fontSize: 10, color: '#999' }}>{formatBytes(lastBytes)}</div>}
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#2563eb', textDecoration: 'none' }}>
              View file <ExternalLink size={9} style={{ verticalAlign: -1 }} />
            </a>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#555' }}>
              {uploading ? <Loader2 size={12} className="animate-spin" style={{ color: G }} /> : 'Change'}
            </button>
            <button onClick={clear}
              style={{ fontSize: 11, padding: '5px 8px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', color: '#dc2626' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* No file — show upload zone */
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? G : '#d1d5db'}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            background: dragOver ? '#fffbeb' : '#fafafa',
            transition: 'all 0.15s',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: G }} />
              <span style={{ fontSize: 12, color: '#888' }}>Uploading...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff8ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={18} style={{ color: G }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Click or drag to upload</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Max 10MB · {accept.replace(/\./g, '').replace(/,/g, ', ')}</div>
            </div>
          )}
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>{error}</div>}

      {/* Fallback: manual URL input */}
      {!value && !uploading && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#bbb' }}>or paste URL:</span>
          <input
            type="url"
            placeholder="https://..."
            onBlur={e => { if (e.target.value.trim()) { onChange(e.target.value.trim()); } }}
            onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { onChange(e.target.value.trim()); } }}
            style={{ flex: 1, padding: '4px 8px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', color: '#666' }}
          />
        </div>
      )}
    </div>
  );
}
