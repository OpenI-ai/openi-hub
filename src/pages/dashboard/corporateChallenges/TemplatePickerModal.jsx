/**
 * TemplatePickerModal — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1302-1357 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { corporateAPI } from '../../../services/api';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { G, card } from './constants';

export default function TemplatePickerModal({ form, loadTemplates, setEditMode, setForm, setShowCreate, setShowTemplatePicker, templates }) {
  return (
    // ---- BODY START (original lines 1302-1357) ----
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Start from a Template</h3>
            <button onClick={() => setShowTemplatePicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><X size={16} /></button>
          </div>
          {/* Challenge Type Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { key: 'partner', label: 'Partner', desc: 'PoC, Pilot, Scale with startups', color: '#16a34a' },
              { key: 'source', label: 'Source', desc: 'Find & procure startup solutions', color: '#2563eb' },
              { key: 'invest', label: 'Invest', desc: 'Evaluate startups for investment', color: '#f59e0b' },
            ].map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, challenge_type: t.key }))}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.challenge_type === t.key ? t.color : '#eee'}`, background: form.challenge_type === t.key ? `${t.color}08` : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.challenge_type === t.key ? t.color : '#333' }}>{t.label}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
          {/* Template Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
            {/* Blank */}
            <div onClick={() => { setForm(f => ({ ...f, title: '', description: '', problem_statement: '', sectors: [], technologies: [], usecases: [], budget_range: '', timeline: '' })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
              style={{ ...card, padding: 14, cursor: 'pointer', textAlign: 'center', border: `2px dashed #ddd` }}
              onMouseEnter={e => e.currentTarget.style.borderColor = G} onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}>
              <Plus size={20} style={{ color: '#ccc', margin: '8px auto' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Blank Challenge</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Start from scratch</div>
            </div>
            {/* Built-in */}
            {(templates.builtin || []).map(t => (
              <div key={t.id} onClick={() => { setForm(f => ({ ...f, ...t.template_data })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
                style={{ ...card, padding: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G} onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(t.template_data?.sectors || []).slice(0, 2).map(s => <span key={s} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>{s}</span>)}
                </div>
              </div>
            ))}
            {/* Saved */}
            {(templates.saved || []).map(t => {
              const td = typeof t.template_data === 'string' ? JSON.parse(t.template_data) : (t.template_data || {});
              return (
                <div key={t.id} style={{ ...card, padding: 14, cursor: 'pointer', position: 'relative' }}
                  onClick={() => { setForm(f => ({ ...f, ...td })); setShowTemplatePicker(false); setShowCreate(true); setEditMode(false); }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'} onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 500 }}>Custom Template</div>
                  <button onClick={async (e) => { e.stopPropagation(); await corporateAPI.deleteTemplate(t.id); loadTemplates(); toast.success('Template deleted'); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        </div>
    // ---- BODY END ----
  );
}
