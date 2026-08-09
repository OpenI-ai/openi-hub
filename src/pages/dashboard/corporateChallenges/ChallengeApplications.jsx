/**
 * ChallengeApplications — extracted from CorporateChallenges.jsx (Phase 165 / W5-2).
 *
 * The body between the sentinels is a VERBATIM slice of the pre-split file,
 * original lines 637-949 of 1721. Nothing inside was reformatted or reindented.
 * Props are the exact set of parent-scope names the slice referenced — they are
 * computed from the slice, never hand-listed, so the signature cannot drift from
 * the call site. Long prop lists are deliberate: grouping them into state/actions
 * objects would force rewriting the body and destroy the verbatim property.
 */

import { Link } from 'react-router-dom';
import { getStatusLabel, getActionLabel } from '../../../config/applicationStatusLabels';
import { corporateAPI, messageAPI } from '../../../services/api';
import ReviewPanel from '../../../components/ReviewPanel';
import UpgradeCTA from '../../../components/UpgradeCTA';
import {
  CheckCircle, Users, Loader2, Star, ChevronDown, ChevronUp, Sparkles, Brain, BarChart3, Zap,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { G, card } from './constants';

export default function ChallengeApplications({
  analysisData, analysisLoading, detail, evaluatingAppId, evaluations, expandedReviewApp,
  loadDetail, navigate, persona, rfiQuestions, runAiAnalysis, runAiEvaluate,
  setExpandedReviewApp, setShowAnalysis, showAnalysis, updateAppStatus, user,
}) {
  return (
    // ---- BODY START (original lines 637-949) ----
    <>
        {/* Applications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            <Users size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Applications ({(detail.applications || []).length})
          </h3>
          {(detail.applications || []).length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {showAnalysis && analysisData && (
                <button onClick={() => setShowAnalysis(false)}
                  style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#f3f4f6', color: '#333', border: '1px solid #ddd', cursor: 'pointer' }}>
                  Show Applications
                </button>
              )}
              <button onClick={runAiAnalysis} disabled={analysisLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', cursor: analysisLoading ? 'wait' : 'pointer', opacity: analysisLoading ? 0.7 : 1 }}>
                {analysisLoading ? <Loader2 size={11} className="animate-spin" /> : <BarChart3 size={11} />} AI Analysis
              </button>
            </div>
          )}
        </div>
        {/* Phase 35: AI Analysis Panel */}
        {showAnalysis && analysisData && (
          <div style={{ marginBottom: 16 }}>
            {analysisData.top_pick && (
              <div style={{ ...card, padding: 16, marginBottom: 10, border: '2px solid #7c3aed', background: '#faf5ff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} /> Top Pick
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  {(detail.applications || []).find(a => a.id === analysisData.top_pick.application_id)?.startup_name || 'Startup'}
                </div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4, lineHeight: 1.5 }}>{analysisData.top_pick.rationale}</div>
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {(analysisData.analyses || []).sort((a, b) => (a.ranking || 99) - (b.ranking || 99)).map(analysis => {
                const app = (detail.applications || []).find(a => a.id === analysis.application_id) || {};
                return (
                  <div key={analysis.application_id} style={{ ...card, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                        #{analysis.ranking} {app.startup_name || `Application #${analysis.application_id}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                          <div style={{ width: `${analysis.fit_score || 0}%`, height: '100%', borderRadius: 3, background: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: analysis.fit_score >= 70 ? '#16a34a' : analysis.fit_score >= 40 ? '#f59e0b' : '#dc2626' }}>{analysis.fit_score}/100</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6, lineHeight: 1.5 }}>{analysis.summary}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(analysis.strengths || []).length > 0 && (
                        <div style={{ flex: 1 }}>
                          {analysis.strengths.map((s, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', margin: '0 3px 3px 0' }}>{s}</span>)}
                        </div>
                      )}
                      {(analysis.weaknesses || []).length > 0 && (
                        <div style={{ flex: 1 }}>
                          {analysis.weaknesses.map((w, i) => <span key={i} style={{ display: 'inline-block', fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', margin: '0 3px 3px 0' }}>{w}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(detail.applications || []).length === 0 ? (
          <div style={{ ...card, padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>No applications yet</div>
        ) : (!showAnalysis) && (
          <div style={{ display: 'grid', gap: 10 }}>
            {(detail.applications || []).map(app => {
              /* Phase 100: badge uses persona label */
              const personaLabel = getStatusLabel(persona, app.status);
              const as = { label: personaLabel.label, color: personaLabel.color, bg: personaLabel.bg };
              const appRfiAnswers = (() => { try { return typeof app.rfi_answers === 'string' ? JSON.parse(app.rfi_answers) : (app.rfi_answers || {}); } catch { return {}; } })();
              const appDataRoom = (() => { try { return typeof app.data_room === 'string' ? JSON.parse(app.data_room) : (app.data_room || []); } catch { return []; } })();

              return (
                <div key={app.id} style={{ ...card, padding: 16 }}>
                  {/* Phase 100: clickable name + investor financials + empty-stub hint */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      {/* Phase 101: Invited chip on application card — gold pill next to name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {app.applicant_id ? (
                          <Link to={`/dashboard/startup-profile/${app.applicant_id}?by=user_id`}
                            style={{ fontSize: 14, fontWeight: 600, color: G, textDecoration: 'none', borderBottom: `1px dashed ${G}` }}>
                            {app.startup_name || app.applicant_name}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{app.startup_name || app.applicant_name}</span>
                        )}
                        {/* M2 (27 May 2026) — Message button opens a direct conversation with the applicant */}
                        {app.applicant_id && (
                          <button
                            onClick={async () => {
                              try {
                                const conv = await messageAPI.createConversation({ type: 'direct', member_ids: [app.applicant_id] });
                                navigate('/dashboard/messaging?conversation=' + conv.id);
                              } catch (err) {
                                toast.error(err?.response?.data?.message || err?.message || 'Failed to open conversation');
                              }
                            }}
                            title={`Message ${app.applicant_name || 'applicant'}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', fontSize: 11, fontWeight: 600,
                              background: '#fff', color: G, border: `1px solid ${G}`,
                              borderRadius: 14, cursor: 'pointer',
                            }}
                          >
                            <MessageCircle size={12} /> Message
                          </button>
                        )}
                        {app.is_invited && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                            background: `${G}20`, color: '#5a4715', border: `1px solid ${G}`,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                          }} title={app.invite_status ? `Invite status: ${app.invite_status}` : 'Invited by your team'}>
                            ★ Invited
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {app.applicant_email} {app.sector ? `| ${app.sector}` : ''} {app.stage ? `| ${app.stage}` : ''}
                        {app.profile_pct != null && <span style={{ marginLeft: 8, color: '#16a34a' }}>Profile: {app.profile_pct}%</span>}
                      </div>
                      {/* Phase 100: investor-only financial chips */}
                      {persona === 'investor' && (app.funding_raised || app.traction_score || app.revenue_range || app.employee_range) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {app.funding_raised > 0 && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#fefce8', color: '#854d0e' }}>
                              Raised: {app.funding_raised_currency || ''} {app.funding_raised} {app.funding_raised_unit || ''}
                            </span>
                          )}
                          {app.traction_score > 0 && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f0fdf4', color: '#15803d' }}>
                              Traction: {app.traction_score}/100
                            </span>
                          )}
                          {app.revenue_range && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#1e40af' }}>
                              Revenue: {app.revenue_range}
                            </span>
                          )}
                          {app.employee_range && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#f3f4f6', color: '#4b5563' }}>
                              Team: {app.employee_range}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: as.bg, color: as.color }}>{as.label}</span>
                      {/* Star Rating */}
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= (app.rating || 0) ? '#f59e0b' : 'none'} style={{ color: s <= (app.rating || 0) ? '#f59e0b' : '#ddd', cursor: 'pointer' }}
                            onClick={() => corporateAPI.updateApplication(detail.id, app.id, { rating: s }).then(() => { loadDetail(detail.id); toast.success('Rating saved'); })} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Phase 100: empty-stub hint when invitee accepted but hasn't filled in application */}
                  {!app.pitch && !app.proposal_url && Object.keys(appRfiAnswers).length === 0 && appDataRoom.length === 0 && (
                    <div style={{ padding: 10, marginBottom: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
                      {/* Phase 101 Sub-C: action guidance under empty-stub hint */}
                      <strong>Application empty</strong> — the invitee has accepted but hasn't filled in their pitch, RFI answers, or uploaded documents yet.
                      <div style={{ marginTop: 4, fontSize: 11, color: '#92400e' }}>
                        You may still evaluate them based on their startup profile (click the name above), or send them a reminder using the button below.
                      </div>
                    </div>
                  )}
                  {app.details_locked && (
                    <UpgradeCTA compact feature="application_review" message="Upgrade to review this applicant's full details" plan={user?.current_plan} />
                  )}
                  {!app.details_locked && (
                    <>
                      {app.pitch && <p style={{ fontSize: 12, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>{app.pitch}</p>}
                      {app.proposal_url && (
                        <div style={{ fontSize: 11, marginBottom: 8 }}>
                          <span style={{ color: '#888' }}>Proposal: </span>
                          <a href={app.proposal_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{app.proposal_url}</a>
                        </div>
                      )}

                      {/* RFI Answers */}
                      {Object.keys(appRfiAnswers).length > 0 && rfiQuestions.length > 0 && (
                        <div style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 6 }}>RFI Answers</div>
                          {rfiQuestions.map(q => (
                            appRfiAnswers[q.id] ? (
                              <div key={q.id} style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600 }}>{q.question}:</span> {appRfiAnswers[q.id]}
                              </div>
                            ) : null
                          ))}
                        </div>
                      )}

                      {/* Data Room */}
                      {appDataRoom.length > 0 && (
                        <div style={{ marginBottom: 8, border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 6 }}>Data Room</div>
                          {appDataRoom.map((doc, di) => (
                            <div key={di} style={{ fontSize: 11, marginBottom: 2 }}>
                              <span style={{ color: '#888', textTransform: 'capitalize' }}>{(doc.type || 'file').replace(/_/g, ' ')}:</span>{' '}
                              <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{doc.url}</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Phase 100: per-persona action labels */}
                    {app.status === 'applied' && (
                      <>
                        <button onClick={() => updateAppStatus(app.id, 'shortlisted')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#fefce815', color: '#ca8a04', border: '1px solid #fde68a', cursor: 'pointer' }}>
                          <Star size={11} style={{ verticalAlign: -2 }} /> {getActionLabel(persona, 'shortlist')}
                        </button>
                        <button onClick={() => updateAppStatus(app.id, 'rejected')} style={{ padding: '5px 12px', fontSize: 11, borderRadius: 7, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer' }}>
                          {getActionLabel(persona, 'reject')}
                        </button>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <button onClick={() => updateAppStatus(app.id, 'selected')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                        <CheckCircle size={11} style={{ verticalAlign: -2 }} /> {getActionLabel(persona, 'select')}
                      </button>
                    )}
                    {/* Phase 101 Sub-C: Remind button when application is empty AND has invite_id */}
                    {app.is_invited && app.invite_id && !app.pitch && !app.proposal_url && Object.keys(appRfiAnswers).length === 0 && appDataRoom.length === 0 && (
                      <button onClick={async () => {
                        try {
                          await corporateAPI.remindInvitee(detail.id, app.invite_id);
                          toast.success(`Reminder sent to ${app.applicant_name || 'invitee'}`);
                        } catch (e) {
                          toast.error(e?.message || 'Reminder failed');
                        }
                      }} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✉ Remind
                      </button>
                    )}
                    {/* Phase 35: AI Evaluate */}
                    {!app.details_locked && (
                      <button onClick={() => runAiEvaluate(app.id)} disabled={evaluatingAppId === app.id}
                        style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, background: evaluations[app.id] ? '#f0fdf4' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: evaluations[app.id] ? '#16a34a' : '#fff', border: evaluations[app.id] ? '1px solid #bbf7d0' : 'none', cursor: evaluatingAppId === app.id ? 'wait' : 'pointer', opacity: evaluatingAppId === app.id ? 0.7 : 1 }}>
                        {evaluatingAppId === app.id ? <Loader2 size={11} className="animate-spin" style={{ verticalAlign: -2 }} /> : <Sparkles size={11} style={{ verticalAlign: -2 }} />} {evaluations[app.id] ? 'Re-evaluate' : 'AI Evaluate'}
                      </button>
                    )}
                  </div>

                  {/* Phase 35: AI Evaluation Results */}
                  {!app.details_locked && evaluations[app.id] && (
                    <div style={{ marginTop: 10, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span><Brain size={12} style={{ verticalAlign: -2 }} /> AI Evaluation</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: evaluations[app.id].overall_score >= 3.5 ? '#16a34a' : evaluations[app.id].overall_score >= 2.5 ? '#f59e0b' : '#dc2626' }}>{evaluations[app.id].overall_score}/5</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 4, marginBottom: 8 }}>
                        {[
                          { k: 'solution_fit', l: 'Solution Fit' }, { k: 'tech_maturity', l: 'Tech Maturity' },
                          { k: 'scalability', l: 'Scalability' }, { k: 'integration_feasibility', l: 'Integration' },
                          { k: 'team_capability', l: 'Team' }, { k: 'cost_effectiveness', l: 'Cost' },
                          { k: 'innovation_score', l: 'Innovation' }, { k: 'strategic_alignment', l: 'Strategy' },
                        ].map(v => (
                          <div key={v.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#666', width: 65, flexShrink: 0 }}>{v.l}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                              <div style={{ width: `${((evaluations[app.id][v.k] || 0) / 5) * 100}%`, height: '100%', borderRadius: 3, background: '#7c3aed' }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', width: 14 }}>{evaluations[app.id][v.k] || '-'}</span>
                          </div>
                        ))}
                      </div>
                      {evaluations[app.id].explanation && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{evaluations[app.id].explanation}</div>}
                      {(evaluations[app.id].red_flags || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                          {evaluations[app.id].red_flags.map((f, i) => <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, background: '#fef2f2', color: '#dc2626' }}>{f}</span>)}
                        </div>
                      )}
                      {evaluations[app.id].recommended_action && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: evaluations[app.id].recommended_action === 'shortlist' ? '#f0fdf4' : evaluations[app.id].recommended_action === 'reject' ? '#fef2f2' : '#eff6ff', color: evaluations[app.id].recommended_action === 'shortlist' ? '#16a34a' : evaluations[app.id].recommended_action === 'reject' ? '#dc2626' : '#2563eb' }}>
                          AI: {evaluations[app.id].recommended_action}
                        </span>
                      )}
                    </div>
                  )}
                  {!app.details_locked && (
                    <>
                      <button onClick={() => setExpandedReviewApp(expandedReviewApp === app.id ? null : app.id)}
                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fafafa', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10, marginTop: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Review & Feedback</span>
                        {expandedReviewApp === app.id ? <ChevronUp size={14} color="#999" /> : <ChevronDown size={14} color="#999" />}
                      </button>
                      {expandedReviewApp === app.id && (
                        <ReviewPanel entityType="challenge_application" entityId={app.id} title={`Review: ${app.startup_name || app.applicant_name}`} subtitle="Feedback specific to this applicant's submission" />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </>
    // ---- BODY END ----
  );
}
