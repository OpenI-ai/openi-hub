/**
 * ChallengeForm — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 1393-1664 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { corporateAPI } from '../../../services/api';
import UpgradeCTA from '../../../components/UpgradeCTA';
import { Loader2, FileText, HelpCircle, Trash2, X, Sparkles, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { G, card } from './constants';
import TagDropdown from './TagDropdown';

export default function ChallengeForm({
  aiAdvisorLoading, aiSuggestions, create, editMode, form, runAiAdvisor, saving,
  setAiSuggestions, setEditMode, setForm, setShowCreate, taxonomy, updateChallenge,
  upgradeError,
}) {
  return (
    // ---- BODY START (original lines 1393-1664) ----
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>{editMode ? 'Edit Challenge' : 'Create Innovation Challenge'}</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Challenge Type + Visibility */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Challenge Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'partner', label: 'Partner', color: '#16a34a' }, { key: 'source', label: 'Source', color: '#2563eb' }, { key: 'invest', label: 'Invest', color: '#f59e0b' }].map(t => (
                    <button key={t.key} type="button" onClick={() => setForm(f => ({ ...f, challenge_type: t.key }))}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${form.challenge_type === t.key ? t.color : '#eee'}`, background: form.challenge_type === t.key ? `${t.color}10` : '#fff', color: form.challenge_type === t.key ? t.color : '#888', cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {/* T32-99c: 3-way visibility toggle (public / invite_only / draft) — values match backend CHECK constraint */}
                <label style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Visibility</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ key: 'public', label: 'Public' }, { key: 'invite_only', label: 'Invite-only' }, { key: 'draft', label: 'Draft' }].map(v => (
                    <button key={v.key} type="button" onClick={() => setForm(f => ({ ...f, visibility: v.key }))}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1.5px solid ${form.visibility === v.key ? G : '#eee'}`, background: form.visibility === v.key ? `${G}10` : '#fff', color: form.visibility === v.key ? G : '#888', cursor: 'pointer' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Basic info */}
            <input placeholder="Challenge title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            <textarea placeholder="Short description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />
            <textarea placeholder="Detailed problem statement — describe what you need solved, constraints, and expectations..." rows={4} value={form.problem_statement} onChange={e => setForm(p => ({ ...p, problem_statement: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Phase 35: AI Advisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={runAiAdvisor} disabled={aiAdvisorLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', cursor: aiAdvisorLoading ? 'wait' : 'pointer', opacity: aiAdvisorLoading ? 0.7 : 1 }}>
                {aiAdvisorLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI Advisor
              </button>
              <span style={{ fontSize: 10, color: '#666' }}>Get AI suggestions for sectors, technologies, budget, and more</span>
            </div>

            {aiSuggestions && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brain size={14} /> AI Suggestions
                  <button onClick={() => setAiSuggestions(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={12} /></button>
                </div>
                {aiSuggestions.refined_problem_statement && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Refined Problem Statement</div>
                    <div style={{ fontSize: 11, color: '#333', lineHeight: 1.5, marginBottom: 4 }}>{aiSuggestions.refined_problem_statement}</div>
                    <button onClick={() => setForm(f => ({ ...f, problem_statement: aiSuggestions.refined_problem_statement }))}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
                  {aiSuggestions.sectors?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Sectors</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {aiSuggestions.sectors.map(s => <span key={s} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#eff6ff', color: '#2563eb' }}>{s}</span>)}
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, sectors: [...new Set([...f.sectors, ...(aiSuggestions.sectors || [])])] }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.technologies?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Technologies</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {aiSuggestions.technologies.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a' }}>{t}</span>)}
                      </div>
                      <button onClick={() => setForm(f => ({ ...f, technologies: [...new Set([...f.technologies, ...(aiSuggestions.technologies || [])])] }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.budget_range && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Budget</div>
                      <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{aiSuggestions.budget_range}</div>
                      <button onClick={() => setForm(f => ({ ...f, budget_range: aiSuggestions.budget_range }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {aiSuggestions.timeline && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Timeline</div>
                      <div style={{ fontSize: 11, color: '#333', marginBottom: 4 }}>{aiSuggestions.timeline}</div>
                      <button onClick={() => setForm(f => ({ ...f, timeline: aiSuggestions.timeline }))}
                        style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                </div>
                {aiSuggestions.evaluation_criteria?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Evaluation Criteria</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {aiSuggestions.evaluation_criteria.map((c, i) => <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef3c7', color: '#92400e' }}>{c}</span>)}
                    </div>
                  </div>
                )}
                {aiSuggestions.suggestions?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#555', marginBottom: 3 }}>Tips</div>
                    {aiSuggestions.suggestions.map((s, i) => <div key={i} style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>- {s}</div>)}
                  </div>
                )}
              </div>
            )}

            {/* Timeline & logistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <input placeholder="Budget range" value={form.budget_range} onChange={e => setForm(p => ({ ...p, budget_range: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Timeline" value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input type="date" placeholder="Deadline" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
              <input placeholder="Location / region" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb' }} />
            </div>
            <textarea placeholder="Detailed requirements" rows={2} value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              style={{ padding: '10px 14px', fontSize: 16, border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', background: '#f9fafb', resize: 'vertical' }} />

            {/* Settings row */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Min profile %:</span>
                <input type="number" min={0} max={100} value={form.min_profile_pct} onChange={e => setForm(p => ({ ...p, min_profile_pct: parseInt(e.target.value) || 25 }))}
                  style={{ width: 50, padding: '5px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', textAlign: 'center' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.data_room_required} onChange={e => setForm(p => ({ ...p, data_room_required: e.target.checked }))} />
                <span style={{ fontWeight: 600 }}>Require data room uploads</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555' }}>
                <span style={{ fontWeight: 600 }}>Status:</span>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ padding: '5px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  {editMode && <option value="reviewing">Reviewing</option>}
                  {editMode && <option value="closed">Closed</option>}
                  {editMode && <option value="awarded">Awarded</option>}
                </select>
              </label>
            </div>

            {/* Taxonomy selectors — searchable dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <TagDropdown label="Sectors" options={taxonomy.sectors} selected={form.sectors}
                onChange={val => setForm(p => ({ ...p, sectors: val }))}
                colorScheme={{ bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }} />
              <TagDropdown label="Technologies" options={taxonomy.technologies} selected={form.technologies}
                onChange={val => setForm(p => ({ ...p, technologies: val }))}
                colorScheme={{ bg: '#fefce8', color: '#ca8a04', border: '#fde68a' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <TagDropdown label="Use Cases" options={taxonomy.usecases} selected={form.usecases}
                onChange={val => setForm(p => ({ ...p, usecases: val }))}
                colorScheme={{ bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }} />
              <TagDropdown label="Functions" options={taxonomy.functions || []} selected={form.functions}
                onChange={val => setForm(p => ({ ...p, functions: val }))}
                colorScheme={{ bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' }} />
            </div>

            {/* RFI Question Builder */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} />RFI Questions ({form.rfi_questions.length})
              </label>
              {form.rfi_questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <select value={q.type} onChange={e => {
                    const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], type: e.target.value };
                    setForm(p => ({ ...p, rfi_questions: upd }));
                  }} style={{ padding: '6px 8px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 80 }}>
                    <option value="text">Text</option>
                    <option value="mcq">MCQ</option>
                  </select>
                  <input placeholder="Question" value={q.question} onChange={e => {
                    const upd = [...form.rfi_questions]; upd[i] = { ...upd[i], question: e.target.value };
                    setForm(p => ({ ...p, rfi_questions: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  {q.type === 'mcq' && (
                    // Ship #6 (21 May 2026) — per-option RFI input
                    // Previously this was a comma-separated text input. If the
                    // cohort typed "Yes" then "NO" without a comma it stored as
                    // ["YesNO"] (single concatenated string). Replaced with
                    // per-option Add/Remove rows so each option is unambiguous.
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input placeholder={`Option ${oi + 1}`} value={opt} onChange={e => {
                            const upd = [...form.rfi_questions];
                            const newOpts = [...(upd[i].options || [])];
                            newOpts[oi] = e.target.value;
                            upd[i] = { ...upd[i], options: newOpts };
                            setForm(p => ({ ...p, rfi_questions: upd }));
                          }} style={{ flex: 1, padding: '5px 8px', fontSize: 16, borderRadius: 5, border: '1px solid #e5e7eb', outline: 'none' }} />
                          <button type="button" onClick={() => {
                            const upd = [...form.rfi_questions];
                            upd[i] = { ...upd[i], options: (upd[i].options || []).filter((_, oj) => oj !== oi) };
                            setForm(p => ({ ...p, rfi_questions: upd }));
                          }} style={{ padding: '3px 6px', fontSize: 11, borderRadius: 5, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        const upd = [...form.rfi_questions];
                        upd[i] = { ...upd[i], options: [...(upd[i].options || []), ''] };
                        setForm(p => ({ ...p, rfi_questions: upd }));
                      }} style={{ alignSelf: 'flex-start', padding: '3px 8px', fontSize: 11, color: G, background: 'none', border: '1px dashed #e5e7eb', borderRadius: 5, cursor: 'pointer', fontWeight: 600 }}>+ Add Option</button>
                    </div>
                  )}
                  <button onClick={() => setForm(p => ({ ...p, rfi_questions: p.rfi_questions.filter((_, j) => j !== i) }))}
                    style={{ padding: '5px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, rfi_questions: [...p.rfi_questions, { id: `rfi_${Date.now()}`, type: 'text', question: '', options: [] }] }))}
                style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Question</button>
            </div>

            {/* FAQ Builder */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HelpCircle size={13} />FAQs ({form.faqs.length})
              </label>
              {form.faqs.map((faq, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input placeholder="Question" value={faq.question} onChange={e => {
                    const upd = [...form.faqs]; upd[i] = { ...upd[i], question: e.target.value };
                    setForm(p => ({ ...p, faqs: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  <input placeholder="Answer" value={faq.answer} onChange={e => {
                    const upd = [...form.faqs]; upd[i] = { ...upd[i], answer: e.target.value };
                    setForm(p => ({ ...p, faqs: upd }));
                  }} style={{ flex: 1, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', outline: 'none' }} />
                  <button onClick={() => setForm(p => ({ ...p, faqs: p.faqs.filter((_, j) => j !== i) }))}
                    style={{ padding: '5px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => setForm(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))}
                style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add FAQ</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setShowCreate(false); setEditMode(false); }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, background: '#f3f4f6', color: '#555', border: 'none', cursor: 'pointer' }}>Cancel</button>
              {!editMode && (
                <button onClick={async () => {
                  const name = prompt('Template name:');
                  if (!name) return;
                  try { await corporateAPI.createTemplate({ name, template_data: form }); toast.success('Template saved!'); } catch { toast.error('Failed to save template'); }
                }} style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, background: '#f3f4f6', color: '#8b5cf6', border: '1px solid #8b5cf620', cursor: 'pointer' }}>
                  Save as Template
                </button>
              )}
              <button onClick={editMode ? updateChallenge : create} disabled={saving} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: G, color: '#fff', border: 'none', cursor: 'pointer' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : (editMode ? 'Update Challenge' : 'Create Challenge')}
              </button>
            </div>
            {!editMode && upgradeError && (
              <div style={{ marginTop: 12 }}>
                <UpgradeCTA compact feature={upgradeError.feature} plan={upgradeError.plan} message={upgradeError.message} />
              </div>
            )}
          </div>
        </div>
    // ---- BODY END ----
  );
}
