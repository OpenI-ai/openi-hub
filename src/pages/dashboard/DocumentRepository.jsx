// Phase 104b — added useMemo for dynamic folder derivation, uploadAPI for Cloudinary uploads, ExternalLink + Loader2 for preview/upload UI
import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { documentAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';  // Phase 112 — Edit modal permission gate
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  FolderOpen, Folder, FileText, File, FileImage, Upload,
  Download, Search, Eye, ChevronRight, Lock, Globe,
  Users, Star, Grid, List, Share2, CheckCircle2,
  ExternalLink, Loader2, X, Edit2, Save
} from 'lucide-react';

const G = '#D5AA5B';
const GH = '#C9983F';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

// File type configs
const FILE_TYPES = {
  pdf:  { color: '#dc2626', bg: '#fef2f2', icon: FileText, label: 'PDF' },
  docx: { color: '#2563eb', bg: '#eff6ff', icon: FileText, label: 'DOC' },
  xlsx: { color: '#16a34a', bg: '#f0fdf4', icon: File,     label: 'XLS' },
  pptx: { color: '#ea580c', bg: '#fff7ed', icon: File,     label: 'PPT' },
  png:  { color: '#7c3aed', bg: '#f5f3ff', icon: FileImage,label: 'IMG' },
  jpg:  { color: '#7c3aed', bg: '#f5f3ff', icon: FileImage,label: 'IMG' },
  zip:  { color: '#64748b', bg: '#f8fafc', icon: File,     label: 'ZIP' },
  default: { color: '#64748b', bg: '#f8fafc', icon: File,  label: 'FILE' },
};

const getFileType = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  return FILE_TYPES[ext] || FILE_TYPES.default;
};

// Phase 104b — folder seed (suggested categories in the Upload modal dropdown).
// Actual folder list in the sidebar is derived dynamically from real files state.
// Pre-Phase-104b hardcoded fictional demo sub-folders were dropped.
const CATEGORY_SUGGESTIONS = [
  'Program Documents',
  'Evaluation Reports',
  'Contracts & Legal',
  'Technical Specs',
  'Financial Records',
  'IPR Documents',
  'Other',
];

const FOLDER_COLOR_ROTATION = [G, '#2563eb', '#dc2626', '#7c3aed', '#16a34a', '#ea580c', '#0891b2', '#db2777'];

// FILES are loaded from API

const ACCESS_STYLE = {
  public:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: Globe,   label: 'Public' },
  internal:   { bg: '#fff8ec', color: G,          border: 'rgba(213,170,91,0.4)', icon: Users, label: 'Internal' },
  restricted: { bg: '#fef2f2', color: '#dc2626',  border: '#fecaca', icon: Lock,   label: 'Restricted' },
};

export default function DocumentRepository() {
  const [view, setView]           = useState('list');   // 'list' | 'grid'
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [search, setSearch]       = useState('');
  const [accessFilter, setAccessFilter] = useState('All');
  const [showStarred, setShowStarred] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);

  // Phase 104b — Upload Document modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', category: 'Program Documents', access: 'internal', tags: '' });
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploadedMeta, setUploadedMeta] = useState(null); // {filename, size, type}
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const uploadInputRef = useRef(null);

  // Phase 104b — Eye preview modal state
  const [previewDoc, setPreviewDoc] = useState(null);

  // Phase 112 — Edit modal state + auth context for permission gate
  const { user } = useAuth();
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: 'Program Documents', access: 'internal', tags: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Phase 104c — hook order fix: dynamicFolders useMemo moved above early return
  // (was after `if (loading) return ...` which violated rules-of-hooks because
  // the useMemo was skipped on first render but reached on second render).
  const dynamicFolders = useMemo(() => {
    const counts = files.reduce((acc, f) => {
      const key = f.folder || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).sort().map((name, idx) => ({
      id: `folder-${idx}`,
      name,
      count: counts[name],
      color: FOLDER_COLOR_ROTATION[idx % FOLDER_COLOR_ROTATION.length],
    }));
  }, [files]);

  const loadDocuments = () => {
    documentAPI.list()
      .then(data => {
        const docs = data.documents || data || [];
        const normalized = docs.map(d => ({
          id: d.id,
          name: d.name || d.title || '',
          folder: d.folder || d.category || 'Other',
          size: d.size || (d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(2)} MB` : '—'),
          file_size: d.file_size || 0,
          type: d.type || d.file_type || (d.name ? d.name.split('.').pop() : 'pdf'),
          file_path: d.file_path || '',
          uploaded: d.uploaded_at || d.created_at ? new Date(d.uploaded_at || d.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          by: d.uploaded_by_name || d.author || '',
          access: d.access || 'internal',
          starred: d.is_starred || d.starred || false,
          tags: d.tags || [],
        }));
        setFiles(normalized);
      })
      .catch(err => {
        console.error('[documents.list] failed:', err);
        toast.error(err?.response?.data?.message || err.message || 'Failed to load documents');
        setFiles([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocuments(); }, []);

  const toggleFolder = (id) => setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));

  // Phase 104b — Upload modal handlers
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const result = await uploadAPI.upload(file, 'documents');
      setUploadedUrl(result.url);
      setUploadedMeta({
        filename: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop().toLowerCase(),
      });
      // Auto-fill the name field if empty
      setUploadForm(prev => ({ ...prev, name: prev.name || file.name }));
    } catch (err) {
      console.error('[upload] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveUpload = async () => {
    if (!uploadForm.name.trim()) return toast.error('Document name is required');
    if (!uploadedUrl) return toast.error('Please upload a file first');
    setSaving(true);
    try {
      await documentAPI.create({
        name: uploadForm.name.trim(),
        file_path: uploadedUrl,
        file_type: uploadedMeta?.type || '',
        file_size: uploadedMeta?.size || 0,
        category: uploadForm.category,
        access: uploadForm.access,
        tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Document uploaded');
      setShowUpload(false);
      setUploadForm({ name: '', category: 'Program Documents', access: 'internal', tags: '' });
      setUploadedUrl('');
      setUploadedMeta(null);
      loadDocuments();
    } catch (err) {
      console.error('[documents.create] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const closeUploadModal = () => {
    setShowUpload(false);
    setUploadForm({ name: '', category: 'Program Documents', access: 'internal', tags: '' });
    setUploadedUrl('');
    setUploadedMeta(null);
  };

  // Phase 104b — Eye / Download / Share handlers
  const handlePreview = (f) => setPreviewDoc(f);
  const handleDownload = (f) => {
    if (!f.file_path) return toast.error('No file attached to this document');
    window.open(f.file_path, '_blank', 'noopener,noreferrer');
  };
  const handleShare = async (f) => {
    if (!f.file_path) return toast.error('No file attached to this document');
    try {
      await navigator.clipboard.writeText(f.file_path);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  // Phase 112 — Edit modal handlers + client-side permission check.
  // Backend gate (Phase 112 Ship 1) is the source of truth for same-org membership;
  // here we only do the cheap client-side check (admin/evaluator always; everyone else
  // sees the button and backend rejects with 404 if they're not eligible).
  const canEdit = (_f) => {
    if (!user) return false;
    return true;
  };
  const handleEdit = (f) => {
    setEditingDoc(f);
    setEditForm({
      name: f.name || '',
      category: f.folder || 'Other',
      access: f.access || 'internal',
      tags: Array.isArray(f.tags) ? f.tags.join(', ') : '',
    });
  };
  const closeEditModal = () => {
    setEditingDoc(null);
    setEditForm({ name: '', category: 'Program Documents', access: 'internal', tags: '' });
  };
  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    if (!editForm.name.trim()) return toast.error('Document name is required');
    if (editForm.name.length > 500) return toast.error('Name too long (max 500 chars)');
    setEditSaving(true);
    try {
      await documentAPI.update(editingDoc.id, {
        name: editForm.name.trim(),
        category: editForm.category,
        access: editForm.access,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Document updated');
      closeEditModal();
      loadDocuments();
    } catch (err) {
      console.error('[documents.update] failed:', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton type="table" />;

  const filteredFiles = files.filter(f => {
    const matchFolder = !selectedFolder || f.folder === selectedFolder;
    const matchSearch = (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (f.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchAccess = accessFilter === 'All' || f.access === accessFilter;
    const matchStar = !showStarred || f.starred;
    return matchFolder && matchSearch && matchAccess && matchStar;
  });

  const totalSize = (files.reduce((s, f) => s + (f.file_size || 0), 0) / 1024 / 1024).toFixed(1) + ' MB';
  const totalFiles = files.length;

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>Document Repository</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Centralised storage for all OpenI program documents</p>
        </div>
        {/* Phase 104b — wire Upload Document button (was Phase 66/T9 pattern stub) */}
        <button
          onClick={() => setShowUpload(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: G, color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = GH}
          onMouseLeave={e => e.currentTarget.style.background = G}
        >
          <Upload size={14} /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div id="tour-page-documents-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Documents',  value: totalFiles, icon: FileText,    bg: '#fff8ec', fg: G },
          { label: 'Total Size',       value: totalSize,  icon: FolderOpen,  bg: '#f0fdf4', fg: '#16a34a' },
          { label: 'Restricted Files', value: files.filter(f => f.access === 'restricted').length, icon: Lock, bg: '#fef2f2', fg: '#dc2626' },
          { label: 'Starred',          value: files.filter(f => f.starred).length, icon: Star, bg: '#fdf4ff', fg: '#9333ea' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} style={{ ...card, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} color={fg} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

        {/* Sidebar: Folder tree */}
        <div style={{ ...card, padding: 16, alignSelf: 'start' }}>
          <h3 style={{ margin: '0 0 14px', color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>Folders</h3>
          {/* All files */}
          <div
            onClick={() => setSelectedFolder(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
              background: !selectedFolder ? 'rgba(213,170,91,0.1)' : 'transparent',
              border: !selectedFolder ? '1px solid rgba(213,170,91,0.25)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <FolderOpen size={14} color={G} />
            <span style={{ fontSize: 12, fontWeight: !selectedFolder ? 700 : 500, color: !selectedFolder ? G : '#555', flex: 1 }}>All Documents</span>
            <span style={{ fontSize: 10, color: '#aaa' }}>{files.length}</span>
          </div>
          {/* Phase 104b — dynamic folder list (replaces hardcoded FOLDERS) */}
          {dynamicFolders.length === 0 && (
            <div style={{ fontSize: 11, color: '#aaa', padding: '8px 10px', fontStyle: 'italic' }}>
              No documents yet
            </div>
          )}
          {dynamicFolders.map(folder => (
            <div key={folder.id}>
              <div
                onClick={() => setSelectedFolder(folder.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  background: selectedFolder === folder.name ? 'rgba(213,170,91,0.1)' : 'transparent',
                  border: selectedFolder === folder.name ? '1px solid rgba(213,170,91,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (selectedFolder !== folder.name) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { if (selectedFolder !== folder.name) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 10 }} />
                <Folder size={13} color={folder.color} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#555', flex: 1 }}>{folder.name}</span>
                <span style={{ fontSize: 10, color: '#aaa' }}>{folder.count}</span>
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 14, paddingTop: 12 }}>
            <button
              onClick={() => setShowStarred(!showStarred)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', width: '100%',
                background: showStarred ? 'rgba(213,170,91,0.1)' : 'transparent',
                border: showStarred ? '1px solid rgba(213,170,91,0.25)' : '1px solid transparent',
              }}
            >
              <Star size={13} color={showStarred ? G : '#aaa'} style={{ fill: showStarred ? G : 'none' }} />
              <span style={{ fontSize: 12, color: showStarred ? G : '#555', fontWeight: showStarred ? 700 : 500 }}>Starred</span>
            </button>
          </div>
        </div>

        {/* Main: file list */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                placeholder="Search documents, tags…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                  background: '#fff', border: '1.5px solid #eee', borderRadius: 9,
                  fontSize: 16, outline: 'none', color: '#1a1a1a',
                }}
              />
            </div>
            {/* Access filter */}
            <div style={{ display: 'flex', gap: 5 }}>
              {['All', 'public', 'internal', 'restricted'].map(f => (
                <button key={f} onClick={() => setAccessFilter(f)} style={{
                  padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                  border: '1.5px solid', cursor: 'pointer',
                  background: accessFilter === f ? G : '#fff',
                  color: accessFilter === f ? '#fff' : '#666',
                  borderColor: accessFilter === f ? G : '#eee',
                }}>{f}</button>
              ))}
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 3, gap: 2 }}>
              {[{ v: 'list', Icon: List }, { v: 'grid', Icon: Grid }].map(({ v, Icon }) => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: view === v ? G : 'transparent',
                  color: view === v ? '#fff' : '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>

          {/* Breadcrumb */}
          {selectedFolder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: '#888' }}>
              <button onClick={() => setSelectedFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: G, fontWeight: 600, fontSize: 12, padding: 0 }}>All Documents</button>
              <ChevronRight size={12} />
              <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{selectedFolder}</span>
            </div>
          )}

          {/* Grid view */}
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {filteredFiles.map(f => {
                const ft = getFileType(f.name);
                const FIcon = ft.icon;
                const as = ACCESS_STYLE[f.access];
                const AIcon = as.icon;
                return (
                  <div key={f.id}
                    style={{ ...card, padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s', position: 'relative' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
                  >
                    {f.starred && <Star size={10} style={{ position: 'absolute', top: 10, right: 10, fill: G, color: G }} />}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: ft.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <FIcon size={20} color={ft.color} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ft.color, marginBottom: 4 }}>{ft.label}</div>
                    <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500, marginBottom: 6, wordBreak: 'break-word', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.name}</div>
                    <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>{f.size} · {f.uploaded}</div>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: as.bg, color: as.color, border: `1px solid ${as.border}`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <AIcon size={8} />{as.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List view */
            <div style={{ ...card, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 100px 80px 80px', gap: 12, padding: '10px 18px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                {['Name', 'Folder', 'Size', 'Uploaded', 'Access', 'Actions'].map(h => (
                  <span key={h} style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{h}</span>
                ))}
              </div>
              {filteredFiles.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 13 }}>No documents found</div>
              )}
              {filteredFiles.map((f, i) => {
                const ft = getFileType(f.name);
                const FIcon = ft.icon;
                const as = ACCESS_STYLE[f.access];
                const AIcon = as.icon;
                return (
                  <div key={f.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 90px 100px 80px 80px', gap: 12,
                    padding: '12px 18px',
                    borderBottom: i < filteredFiles.length - 1 ? '1px solid #f5f5f5' : 'none',
                    alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: ft.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FIcon size={14} color={ft.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.starred && <Star size={9} style={{ fill: G, color: G, marginRight: 4, verticalAlign: 'middle' }} />}
                          {f.name}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                          {f.tags.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 20, background: '#f5f5f5', color: '#888', border: '1px solid #eee' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Folder */}
                    <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.folder}</span>
                    {/* Size */}
                    <span style={{ fontSize: 11, color: '#888' }}>{f.size}</span>
                    {/* Date */}
                    <div>
                      <div style={{ fontSize: 11, color: '#555' }}>{f.uploaded}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{f.by}</div>
                    </div>
                    {/* Access */}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: as.bg, color: as.color, border: `1px solid ${as.border}`, display: 'inline-flex', alignItems: 'center', gap: 3, width: 'fit-content' }}>
                      <AIcon size={8} />{as.label}
                    </span>
                    {/* Phase 104b — wire Eye / Download / Share buttons (were Phase 66/T9 pattern stubs) */}
                    {/* Phase 112 — Edit button added as first action (left-most after Access pill) */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {canEdit(f) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(f); }}
                          title="Edit"
                          style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 6 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#555'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreview(f); }}
                        title="Preview"
                        style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#555'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(f); }}
                        title="Download"
                        style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#555'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShare(f); }}
                        title="Copy link"
                        style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 6 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#555'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredFiles.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#aaa', textAlign: 'right' }}>
              Showing {filteredFiles.length} of {files.length} documents
            </div>
          )}
        </div>
      </div>

      {/* Phase 104b — Upload Document modal */}
      {showUpload && (
        <div role="dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Upload Document</h3>
              <button onClick={closeUploadModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#666" />
              </button>
            </div>

            {/* File picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>File <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="file" ref={uploadInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv" />
              {!uploadedUrl ? (
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    width: '100%', padding: 16, background: '#fafafa', border: '2px dashed #ddd', borderRadius: 9, cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: 13, color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} color={G} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} color={G} />
                      <span>Click to select a file (max 10MB)</span>
                    </>
                  )}
                </button>
              ) : (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedMeta?.filename || 'File uploaded'}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>{uploadedMeta?.size ? `${(uploadedMeta.size / 1024 / 1024).toFixed(2)} MB` : ''}</div>
                  </div>
                  <button onClick={() => { setUploadedUrl(''); setUploadedMeta(null); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Document Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Q1 Financial Report"
                maxLength={500}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Folder / Category</label>
              <select
                value={uploadForm.category}
                onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a', background: '#fff' }}
              >
                {CATEGORY_SUGGESTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Access */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Access</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'public',     label: 'Public',     hint: 'Anyone on OpenI can see this' },
                  { value: 'internal',   label: 'Internal',   hint: 'Only you can see this' },
                  { value: 'restricted', label: 'Restricted', hint: 'Only you can see this (locked)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUploadForm(prev => ({ ...prev, access: opt.value }))}
                    title={opt.hint}
                    style={{
                      flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: uploadForm.access === opt.value ? G : '#fff',
                      color: uploadForm.access === opt.value ? '#fff' : '#666',
                      border: `1.5px solid ${uploadForm.access === opt.value ? G : '#eee'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Tags <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated, optional)</span></label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g. quarterly, finance"
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={closeUploadModal}
                disabled={saving}
                style={{ padding: '9px 18px', background: '#fff', color: '#666', border: '1.5px solid #eee', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpload}
                disabled={saving || !uploadedUrl || !uploadForm.name.trim()}
                style={{
                  padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: (saving || !uploadedUrl || !uploadForm.name.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !uploadedUrl || !uploadForm.name.trim()) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                {saving ? 'Saving…' : 'Save Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 104b — Preview modal */}
      {previewDoc && (
        <div role="dialog" onClick={() => setPreviewDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 540, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a1a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#666" />
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
              <div><strong style={{ color: '#333' }}>Folder:</strong> {previewDoc.folder}</div>
              <div><strong style={{ color: '#333' }}>Size:</strong> {previewDoc.size}</div>
              <div><strong style={{ color: '#333' }}>Type:</strong> {previewDoc.type}</div>
              <div><strong style={{ color: '#333' }}>Uploaded:</strong> {previewDoc.uploaded}</div>
              {previewDoc.by && <div><strong style={{ color: '#333' }}>By:</strong> {previewDoc.by}</div>}
              <div><strong style={{ color: '#333' }}>Access:</strong> {previewDoc.access}</div>
              {previewDoc.tags?.length > 0 && (
                <div><strong style={{ color: '#333' }}>Tags:</strong> {previewDoc.tags.join(', ')}</div>
              )}
            </div>
            {previewDoc.file_path && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <a
                  href={previewDoc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: 'center', padding: '10px 14px', background: G, color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> Open in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 112 — Edit modal (name + folder + access + tags) */}
      {editingDoc && (
        <div role="dialog" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 540, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Edit Document</h3>
              <button onClick={closeEditModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#666" />
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Document Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Q1 Financial Report"
                maxLength={500}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Folder / Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a', background: '#fff' }}
              >
                {Array.from(new Set([...CATEGORY_SUGGESTIONS, ...dynamicFolders.map(f => f.name), editForm.category].filter(Boolean))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Access</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'public',     label: 'Public',     hint: 'Anyone on OpenI can see this' },
                  { value: 'internal',   label: 'Internal',   hint: 'You + your org members can see this' },
                  { value: 'restricted', label: 'Restricted', hint: 'Only you + admins can see this' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, access: opt.value }))}
                    title={opt.hint}
                    style={{
                      flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: editForm.access === opt.value ? G : '#fff',
                      color: editForm.access === opt.value ? '#fff' : '#666',
                      border: `1.5px solid ${editForm.access === opt.value ? G : '#eee'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Tags <span style={{ color: '#888', fontWeight: 400 }}>(comma-separated, optional)</span></label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g. quarterly, finance"
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1.5px solid #eee', borderRadius: 9, fontSize: 16, outline: 'none', color: '#1a1a1a' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={closeEditModal}
                disabled={editSaving}
                style={{ padding: '9px 18px', background: '#fff', color: '#666', border: '1.5px solid #eee', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: editSaving ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || !editForm.name.trim()}
                style={{
                  padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: (editSaving || !editForm.name.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (editSaving || !editForm.name.trim()) ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {editSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
