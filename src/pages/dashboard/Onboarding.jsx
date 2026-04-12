/**
 * OpenI Hub — Onboarding Wizard (Phase 20)
 * First-run experience: persona-specific steps with progress bar.
 * Shown to new users who haven't completed onboarding.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { onboardingAPI } from '../../services/api';
import { PERSONAS } from '../../config/personas';
import {
  CheckCircle, Circle, ChevronRight, Rocket, User, Target,
  Users, Briefcase, FileText, FlaskConical, Loader2, SkipForward,
  ArrowRight, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const G = '#D5AA5B';
const DARK = '#0D2137';

// Map step keys to nav targets (clicking a step takes user to the right page)
const STEP_ROUTES = {
  profile_basics:     '/dashboard/profile',
  sector_tags:        '/dashboard/profile',
  pitch_deck:         '/dashboard/profile',
  browse_challenges:  '/dashboard/marketplace',
  first_connection:   '/dashboard/network',
  investment_thesis:  '/dashboard/profile',
  ticket_size:        '/dashboard/profile',
  browse_startups:    '/dashboard/directory',
  industry_tags:      '/dashboard/profile',
  first_challenge:    '/dashboard/corporate/challenges',
  first_program:      '/dashboard/incubator/programs',
  mentor_pool:        '/dashboard/incubator/mentors',
  first_batch:        '/dashboard/accelerator/batches',
  partners_network:   '/dashboard/accelerator/partners',
  expertise_tags:     '/dashboard/profile',
  availability:       '/dashboard/mentor/availability',
  equipment_catalog:  '/dashboard/lab/equipment',
  publications:       '/dashboard/lab/publications',
  focus_areas:        '/dashboard/profile',
  skills_tags:        '/dashboard/profile',
  research_areas:     '/dashboard/profile',
  service_catalog:    '/dashboard/sp/services',
};

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [skipping, setSkipping] = useState(false);

  const persona = PERSONAS[user?.role] || PERSONAS.startup;

  useEffect(() => {
    onboardingAPI.getStatus().then(data => {
      if (data.onboarding_completed) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setSteps(data.steps || []);
      setTotal(data.total || 0);
      setCompleted(data.completed || 0);
      setProgressPct(data.progress_pct || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const handleStepClick = async (step) => {
    if (!step.completed) {
      // Mark step as started (we'll mark complete when they return)
      // For now, navigate to the target page
    }
    const route = STEP_ROUTES[step.key];
    if (route) navigate(route);
  };

  const handleMarkComplete = async (stepKey) => {
    try {
      const data = await onboardingAPI.completeStep(stepKey);
      setSteps(prev => prev.map(s => s.key === stepKey ? { ...s, completed: true } : s));
      setCompleted(prev => prev + 1);
      setProgressPct(total > 0 ? Math.round(((completed + 1) / total) * 100) : 100);
      if (data.all_done) {
        toast.success('Onboarding complete! Welcome to OpenI Hub.');
        updateUser({ onboarding_completed: true });
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      } else {
        toast.success('Step completed!');
      }
    } catch (err) { toast.error(err.message); }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await onboardingAPI.skip();
      updateUser({ onboarding_completed: true });
      toast.success('Onboarding skipped. You can always come back from Settings.');
      navigate('/dashboard', { replace: true });
    } catch (err) { toast.error(err.message); }
    finally { setSkipping(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={28} className="spin" style={{ color: '#aaa' }} />
      </div>
    );
  }

  const nextIncomplete = steps.find(s => !s.completed);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: `${G}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Sparkles size={28} color={G} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, marginBottom: 4 }}>
          Welcome to OpenI Hub{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
          Let's get your {persona.label} profile set up in a few quick steps.
        </p>
        <p style={{ fontSize: 12, color: '#999' }}>
          {completed} of {total} steps complete
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ height: 8, borderRadius: 4, background: '#f3f4f6' }}>
          <div style={{
            height: '100%', borderRadius: 4, background: progressPct >= 100 ? '#16a34a' : G,
            width: `${progressPct}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#999' }}>
          <span>Getting started</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gap: 10 }}>
        {steps.map((step, i) => {
          const isNext = nextIncomplete?.key === step.key;
          return (
            <div key={step.key} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: step.completed ? '#f0fdf4' : isNext ? '#fffbeb' : '#fff',
              border: `1px solid ${step.completed ? '#bbf7d0' : isNext ? '#fde68a' : '#eee'}`,
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onClick={() => handleStepClick(step)}
              onMouseEnter={e => { if (!step.completed) e.currentTarget.style.borderColor = G; }}
              onMouseLeave={e => { if (!step.completed) e.currentTarget.style.borderColor = isNext ? '#fde68a' : '#eee'; }}
            >
              {/* Step indicator */}
              {step.completed ? (
                <CheckCircle size={20} color="#16a34a" />
              ) : (
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isNext ? G : '#ddd'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: isNext ? G : '#bbb',
                }}>
                  {i + 1}
                </div>
              )}

              {/* Label */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: step.completed ? 500 : isNext ? 700 : 500,
                  color: step.completed ? '#16a34a' : '#1a1a1a',
                  textDecoration: step.completed ? 'line-through' : 'none',
                }}>
                  {step.label}
                </div>
              </div>

              {/* Action */}
              {step.completed ? (
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Done</span>
              ) : isNext ? (
                <button
                  onClick={e => { e.stopPropagation(); handleMarkComplete(step.key); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px',
                    background: G, color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Mark Done <CheckCircle size={12} />
                </button>
              ) : (
                <ChevronRight size={16} color="#ccc" />
              )}
            </div>
          );
        })}
      </div>

      {/* Skip button */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={handleSkip} disabled={skipping}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: '#999', background: 'none', border: 'none',
            cursor: skipping ? 'wait' : 'pointer', textDecoration: 'underline',
          }}>
          <SkipForward size={14} /> {skipping ? 'Skipping...' : 'Skip onboarding for now'}
        </button>
        <p style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>You can always access this from Settings</p>
      </div>
    </div>
  );
}
