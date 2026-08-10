import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PERSONAS, PROFILE_FIELDS } from '../../config/personas';
import { resolveCountryCode } from '../../config/locations';
import { profileAPI, startupProfileAPI } from '../../services/api';
import safeStorage from '../../utils/safeStorage';
import { User, Save, Loader2 } from 'lucide-react';
import AutoFillMyProfile from '../../components/AutoFillMyProfile';
import toast from 'react-hot-toast';
import { V2_MAP, SUBSECTION_WEIGHTS, FormField, ProfileSection } from './profileParts/index.js';

export default function MyProfile() {
  const { user, updateUser } = useAuth();
  const persona = PERSONAS[user?.role];
  const fields = PROFILE_FIELDS[user?.role] || [];

  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Phase 86 - JSON-stringified snapshot of profileData taken at load
  // and again after a successful save. Render compares current data to
  // this baseline to know whether the sticky Save bar should appear.
  const [baseline, setBaseline] = useState(null);
  // Auto-trigger auto-fill when arriving from registration: /dashboard/profile?autofill=1
  const autoStart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autofill') === '1';
  // Phase 65d (8 May): VerifyEmail.jsx redirects post-verify to
  // /dashboard/profile?fresh=1 so we know the row was just-now written by
  // flushPendingProfile. If the first GET returns an emptier-looking row
  // than the stash had, retry once with a short delay so the post-PUT
  // search-vector / profile-score recompute has settled.
  const isPostVerifyFresh = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fresh') === '1';

  useEffect(() => {
    loadProfile();
    // After first load on a post-verify fresh redirect, strip the query so
    // a hard refresh by the user does NOT re-trigger the retry behaviour.
    if (isPostVerifyFresh && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('fresh');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 60.10 (s50) — retry path for the Step 2 stash. If VerifyEmail.jsx's
  // flushPendingProfile failed (e.g. token race, transient 500), the stash
  // stays in localStorage. On every MyProfile mount we retry the PUT and
  // remove the stash on success. Empty stash + clean clear on parse error.
  async function retryPendingStash() {
    try {
      const raw = safeStorage.getItem('openi_pending_profile')
               || sessionStorage.getItem('openi_pending_profile');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const hasData = Object.values(data || {}).some(v =>
        Array.isArray(v) ? v.length > 0 : (v !== '' && v !== null && v !== undefined)
      );
      if (!hasData) {
        safeStorage.removeItem('openi_pending_profile');
        sessionStorage.removeItem('openi_pending_profile');
        return false;
      }
      await profileAPI.updateMyProfile(data);
      safeStorage.removeItem('openi_pending_profile');
      sessionStorage.removeItem('openi_pending_profile');
      toast.success('Welcome! We finished saving your registration details.');
      return true;
    } catch (err) {
      console.warn('[my-profile] pending-stash retry failed:', err?.message || err);
      return false;
    }
  }

  // Phase 65d helper — on a post-verify fresh mount, the first GET may race
  // with the search_vector rebuild / profile_score recompute that fires
  // after PUT /profile/me. We treat any plain-text-only row with most
  // persona fields blank as "looks empty" and retry once.
  function looksEmpty(profile) {
    if (!profile) return true;
    // Count persona-relevant non-empty fields beyond the registration defaults.
    const skip = new Set(['id','user_id','created_at','updated_at','search_vector','embedding']);
    let populated = 0;
    for (const [k, v] of Object.entries(profile)) {
      if (skip.has(k)) continue;
      if (v === null || v === undefined || v === '') continue;
      if (Array.isArray(v) && v.length === 0) continue;
      populated++;
    }
    return populated < 3;
  }

  const loadProfile = async () => {
    try {
      // Try to flush any leftover registration stash first so the GET below
      // returns the fully-populated profile instead of a half-empty one.
      const flushed = await retryPendingStash();

      let data = await profileAPI.getMyProfile();

      // Phase 65d: post-verify fresh-load retry. If we're arriving via
      // /dashboard/profile?fresh=1, the row was just written by
      // flushPendingProfile() in VerifyEmail.jsx — but the GET can race
      // with the post-PUT cleanup. Retry once after 500ms if the first
      // response looks empty.
      if ((isPostVerifyFresh || flushed) && looksEmpty(data?.profile)) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const retry = await profileAPI.getMyProfile();
          if (retry?.profile && !looksEmpty(retry.profile)) data = retry;
        } catch { /* fall through with original data */ }
      }

      if (data.profile) {
        // Phase 87c-5 — overlay JSONB _v2 chip columns onto their text[]
        // counterparts so the org_typeahead branch sees objects. The
        // FormField org_typeahead branch flattens objects -> string[] for
        // the component.
        const p = { ...data.profile };
        for (const [textCol, v2Col] of Object.entries(V2_MAP)) {
          const v2 = p[v2Col];
          if (Array.isArray(v2) && v2.length > 0) p[textCol] = v2;
        }
        setProfileData(p);
        // Phase 86 - snapshot the just-loaded profile as our dirty baseline.
        setBaseline(JSON.stringify(p));
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse the baseline snapshot so we can distinguish a deliberate
      // clear (field had a value when loaded, now emptied) from a field
      // that was simply never filled in.
      let prev = {};
      try { prev = baseline ? JSON.parse(baseline) : {}; } catch { prev = {}; }
      const isEmpty = (v) =>
        v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

      const payload = {};
      for (const field of fields) {
        const val = profileData[field.name];
        // Phase 132b — org_typeahead fields (see V2_MAP) are sent under
        // their BARE legacy key (e.g. investor_names), not the _v2 name.
        // The backend's Phase 87c-6 hook expects the bare key + plain
        // string[], resolves each chip via orgResolver, and writes the
        // enriched JSONB to the _v2 column itself. Do NOT translate here —
        // sending the _v2 key directly bypasses orgResolver enrichment
        // and fails with "invalid input syntax for type json".
        if (!isEmpty(val)) {
          // Field has a value — send it as-is.
          payload[field.name] = val;
        } else if (!isEmpty(prev[field.name])) {
          // Field was non-empty at load but is now empty — the user
          // deliberately cleared it. Send explicit null so the backend
          // sets the column to NULL (coerceUpdates honours null as a clear).
          payload[field.name] = null;
        }
        // else: empty at baseline and still empty — omit, so we don't
        // disturb COALESCE-based crawler auto-fill protection.
      }
      const data = await profileAPI.updateMyProfile(payload);
      setProfileData(data.profile);
      // Phase 86 - profile is now persisted; refresh baseline so the
      // sticky Save bar hides until the user touches another field.
      setBaseline(JSON.stringify(data.profile));
      updateUser({ profile_completed: true });
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (fieldName, value) => {
    setProfileData(prev => ({ ...prev, [fieldName]: value }));
  };

  // Phase 79 — sub-section presence tracking. For the startup persona, the
  // 8 child-table repeaters (Team / Products / Funding / Clients / Patents /
  // Competitors / News / Acquisitions) contribute up to 20pts to the
  // completeness bar; top-level fields contribute up to 80pts. Backend
  // profileScoreService.js uses the same weights so the bar matches
  // directory_profiles.profile_score.
  const [sectionPresence, setSectionPresence] = useState({});
  // Phase 88 — loading guard: true once the 8 sub-section probes have
  // resolved. Until then the Completeness bar renders "—" instead of an
  // inaccurate top-level-only %. Non-startup personas flip immediately.
  const [subProbed, setSubProbed] = useState(false);

  useEffect(() => {
    if (user?.role !== 'startup') { setSubProbed(true); return; }
    let cancelled = false;
    (async () => {
      const sections = Object.keys(SUBSECTION_WEIGHTS);
      const results = await Promise.all(
        sections.map(s => startupProfileAPI.list(s).then(r => Array.isArray(r) && r.length > 0).catch(() => false))
      );
      if (cancelled) return;
      const presence = {};
      sections.forEach((s, i) => { presence[s] = results[i]; });
      setSectionPresence(presence);
      setSubProbed(true);
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  // Phase 12-bug — single source of truth for the completeness bar.
  // The Dashboard reads directory_profiles.profile_score (computed by the
  // backend profileScoreService: 20 weighted top-level fields + 8 sub-section
  // presence weights, with isMeaningful() length/numeric thresholds). The old
  // client-side calc below counted ~45 fields EQUALLY with a loose presence
  // check, so the two surfaces never agreed (Dashboard 98% vs here 100%).
  // getMyProfile now LEFT JOINs profile_score; prefer it. Fall back to the
  // client calc only when it's null (brand-new, never-scored profile).
  let completeness;
  const backendScore = profileData?.profile_score;
  if (backendScore !== undefined && backendScore !== null) {
    completeness = Math.min(100, Math.max(0, Math.round(Number(backendScore))));
  } else if (user?.role === 'startup') {
    // top-level out of 80
    const filledTopLevel = fields.filter(f => {
      const v = profileData[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    const topLevelMax = fields.length || 1;
    const topLevelPts = Math.round((filledTopLevel / topLevelMax) * 80);
    let subPts = 0;
    for (const [section, weight] of Object.entries(SUBSECTION_WEIGHTS)) {
      if (sectionPresence[section]) subPts += weight;
    }
    completeness = Math.min(100, topLevelPts + subPts);
  } else {
    const filledCount = fields.filter(f => {
      const v = profileData[f.name];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    }).length;
    completeness = fields.length ? Math.round((filledCount / fields.length) * 100) : 0;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: '#D0A848' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', paddingBottom: '96px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: persona?.color ? `${persona.color}15` : '#D0A84815' }}>
            <User size={20} style={{ color: persona?.color || '#D0A848' }} />
          </div>
          <div>
            <h1 id="tour-page-profile-header" className="text-lg font-bold" style={{ color: '#1a1a1a' }}>My Profile</h1>
            <p className="text-xs" style={{ color: '#6b7280' }}>
              {persona?.label || user?.role} Profile
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: '#D0A848', color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.background = '#c49a4a'}
          onMouseLeave={e => e.currentTarget.style.background = '#D0A848'}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Completeness bar */}
      <div className="rounded-xl p-4 mb-6" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: '#374151' }}><span id="tour-page-profile-completeness" style={{ position: "absolute", pointerEvents: "none" }} />Profile Completeness</span>
          <span className="text-xs font-bold" style={{ color: !subProbed ? '#9ca3af' : (completeness === 100 ? '#16a34a' : '#D0A848') }}>
            {subProbed ? `${completeness}%` : '—'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: '#f3f4f6' }}>
          <div className="h-2 rounded-full transition-all" style={{
            width: subProbed ? `${completeness}%` : '0%',
            background: completeness === 100 ? '#16a34a' : '#D0A848',
          }} />
        </div>
        {completeness < 100 && (
          <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
            Complete your profile to get discovered by the ecosystem.
          </p>
        )}
      </div>

      {/* Phase 38: Self-service auto-fill — startups only. autoStart triggered after registration. */}
      {user?.role === 'startup' && !loading && (
        <AutoFillMyProfile currentProfile={profileData} onApplied={loadProfile} autoStart={autoStart} />
      )}

      {/* Profile form */}
      <div className="rounded-xl p-6" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => {
            // Phase 60.10e (s50): inject form-level country into state field, and
            // both country + state into city field, so the autocomplete components
            // can scope their fetches correctly.
            let dependentField = field;
            if (field.type === 'state') {
              // Phase 83 — legacy rows may store the long-form country name
              // ('India'). Normalise to ISO code so StateField shows the dropdown.
              dependentField = { ...field, country: resolveCountryCode(profileData.country) || 'IN' };
            } else if (field.type === 'city') {
              dependentField = { ...field, country: resolveCountryCode(profileData.country) || 'IN', state: profileData.state || '' };
            } else if (field.type === 'select_dependent') {
              // Phase 92.3 hotfix — inject parent field's current value so the
              // dependent dropdown can look up valid options. Mirrors the
              // ProfileSection inline pattern from Phase 92.1.4.
              dependentField = { ...field, __parentValue: profileData[field.dependsOn] };
            }
            return (
              <div key={field.name} className={field.type === 'textarea' || field.type === 'tags' || field.type === 'multiselect' || field.type === 'taxonomy_tags' ? 'md:col-span-2' : ''}>
                <FormField field={dependentField} value={profileData[field.name]}
                  onChange={val => updateField(field.name, val)} />
              </div>
            );
          })}
        </div>

        {/* Phase 87b — students manage their portfolio (projects, certifications)
            and its public share link on the dedicated My Portfolio page, not via
            a file upload here. Surface that path so "Show my Portfolio in Public"
            is discoverable from the profile. */}
        {user?.role === 'student' && (
          <Link to="/dashboard/student/portfolio"
            className="flex items-center justify-between mt-4 rounded-lg p-3 no-underline"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-xs m-0" style={{ color: '#92400e' }}>
              <strong>My Portfolio:</strong> Add projects &amp; certifications and create a
              public share link to <em>show your portfolio in public</em> — all on your My Portfolio page.
            </p>
            <span className="text-xs font-semibold whitespace-nowrap ml-3" style={{ color: '#D0A848' }}>
              Open My Portfolio →
            </span>
          </Link>
        )}

        {/* Bottom save */}
        <div className="flex justify-end mt-6 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#D0A848', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#c49a4a'}
            onMouseLeave={e => e.currentTarget.style.background = '#D0A848'}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Phase 86b - sticky Save bar is always visible once page has loaded.
          Phase 86 originally gated on dirty state, which hid the bar when
          users scrolled down to ProfileSection repeaters - they had no Save
          button on screen at all. Now we always render and switch label +
          disabled state based on dirty. */}
      {baseline !== null && (() => {
        const isDirty = JSON.stringify(profileData) !== baseline;
        const disabled = saving || !isDirty;
        return (
          <div id="tour-page-profile-save" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, #fff 70%, rgba(255,255,255,0.9))',
            borderTop: '1px solid #e5e7eb',
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            zIndex: 40,
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
          }}>
            <span style={{ fontSize: 12, color: isDirty ? '#b45309' : '#6b7280' }}>
              {isDirty ? 'You have unsaved changes' : 'All changes saved'}
            </span>
            <button onClick={handleSave} disabled={disabled}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{
                background: disabled ? '#e5e7eb' : '#D0A848',
                color: disabled ? '#9ca3af' : '#fff',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        );
      })()}

      {/* ── Startup Profile Sections (child tables) ─────────────── */}
      {user?.role === 'startup' && (
        <div className="mt-6 space-y-4">
          {/* PROF7 (mobile audit) — quick-jump section index. The 8 child-table
              accordions stack vertically and are slow to discover on a phone, so
              expose a horizontally-scrollable chip strip (mobile-only, md:hidden)
              that scrollIntoView()s each section header. Hidden on desktop where
              the full list is already visible above the fold. */}
          <div className="md:hidden -mx-1 px-1 flex gap-2 overflow-x-auto pb-1"
            style={{ WebkitOverflowScrolling: 'touch' }}>
            {[
              { section: 'team', label: 'Team' },
              { section: 'products', label: 'Products' },
              { section: 'funding', label: 'Funding' },
              { section: 'clients', label: 'Clients' },
              { section: 'patents', label: 'Patents' },
              { section: 'competitors', label: 'Competitors' },
              { section: 'news', label: 'News' },
              { section: 'acquisitions', label: 'Acquisitions' },
            ].map(({ section, label }) => (
              <button
                key={section}
                type="button"
                onClick={() => document.getElementById(`profsec-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                style={{ background: '#F5F3EF', border: '1px solid #e5e7eb', color: '#152838', cursor: 'pointer' }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Phase 87i — sub-sections are saved per-entry (their own Add/Save buttons),
              independent of the top Save Profile button. Hint for first-time users. */}
          <div className="rounded-lg p-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <p className="text-xs" style={{ color: '#92400e' }}>
              <strong>Tip:</strong> The sections below (Team, Products, Funding, etc.)
              are saved <em>per entry</em>. Each row has its own Save button.
              The top <em>Save Profile</em> button only covers the fields above.
            </p>
          </div>
          <ProfileSection section="team" title="Team & Management" fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'designation', label: 'Designation' },
            { name: 'role', label: 'Role (CEO, CTO, etc.)' },
            { name: 'bio', label: 'Bio', type: 'textarea' },
            { name: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
            { name: 'twitter_url', label: 'X (Twitter) URL', type: 'url' },
            { name: 'is_founder', label: 'Founder?', type: 'checkbox' },
            { name: 'is_advisory', label: 'Advisory Board?', type: 'checkbox' },
          ]} displayCols={['name','designation','role','is_founder']} />

          <ProfileSection section="products" title="Products & Services" fields={[
            { name: 'name', label: 'Product Name', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'launch_date', label: 'Launch Date', type: 'date' },
            { name: 'pricing_model', label: 'Pricing Model' },
            { name: 'url', label: 'Product URL', type: 'url' },
          ]} displayCols={['name','pricing_model','launch_date']} />

          {/* Phase 92.1 (T17a) - amount_unit added between amount/currency and round_date.
              Currency + unit cluster together. Static union options across all currencies for
              now (Lakh/Cr/Rupees for INR; K/M/Base for USD/EUR/GBP). Per-currency conditional
              dropdown deferred to Phase 92.2 if cohort flags need. */}
          <ProfileSection section="funding" title="Funding Rounds" fields={[
            { name: 'round_type', label: 'Round Type', required: true, type: 'select', options: ['Pre-seed','Seed','Angel','Series A','Series B','Series C','Series D','Debt','Grant','Bridge'] },
            { name: 'amount', label: 'Amount', type: 'number', min: 0 },
            // Phase 92.1.4 (T18) — conditional Unit dropdown driven by Currency. INR shows Lakh/Cr, USD shows K/M. Prevents nonsense pairings like Cr+USD.
            { name: 'amount_unit', label: 'Unit', type: 'select_dependent', dependsOn: 'currency', optionsBy: { INR: ['Lakh','Cr'], USD: ['K','M'] } },
            // Phase 92.1.1 — simplified to INR + USD only across the platform.
            { name: 'currency', label: 'Currency', type: 'select', options: ['INR','USD'] },
            { name: 'round_date', label: 'Date', type: 'date' },
            // Phase 92.1.4 (T19) — OrgTypeahead with curated investors lookup (Phase 87b). Same UX as top-level Key Investors.
            { name: 'lead_investor', label: 'Lead Investor', type: 'org_typeahead', lookup: 'investors', placeholder: 'Start typing… e.g., Sequoia, Accel' },
            { name: 'valuation_at_round', label: 'Valuation at Round', type: 'number', min: 0 },
            // Phase 92.1.3 — valuation_at_round_unit + _currency dropdowns mirror the
            // amount triplet so corporates can see whether '500' means ₹500 Cr or $500 M.
            // Phase 92.1.4 (T18) — Valuation Unit is also conditional on Valuation Currency.
            { name: 'valuation_at_round_unit', label: 'Valuation Unit', type: 'select_dependent', dependsOn: 'valuation_at_round_currency', optionsBy: { INR: ['Lakh','Cr'], USD: ['K','M'] } },
            { name: 'valuation_at_round_currency', label: 'Valuation Currency', type: 'select', options: ['INR','USD'] },
          ]} displayCols={['round_type','amount','amount_unit','currency','lead_investor','round_date']} />

          <ProfileSection section="clients" title="Clients / Customers" fields={[
            { name: 'client_name', label: 'Client Name', required: true },
            { name: 'industry', label: 'Industry' },
            { name: 'logo_url', label: 'Logo', type: 'logo' },
          ]} displayCols={['client_name','industry']} />

          <ProfileSection section="patents" title="Patents / IP" fields={[
            { name: 'title', label: 'Patent Title', required: true },
            { name: 'status', label: 'Status', type: 'select', options: [{label:'Applied',value:'applied'},{label:'Granted',value:'granted'},{label:'Pending',value:'pending'}] },
            { name: 'patent_number', label: 'Patent Number' },
            { name: 'filing_date', label: 'Filing Date', type: 'date' },
            { name: 'abstract', label: 'Abstract', type: 'textarea' },
            { name: 'url', label: 'URL', type: 'url' },
          ]} displayCols={['title','status','patent_number','filing_date']} />

          <ProfileSection section="competitors" title="Competitors" fields={[
            { name: 'competitor_name', label: 'Competitor Name', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            /* Phase 88 (T7) — country is the canonical ISO dropdown so legacy
               free-text values like "India" still load via resolveCountryCode. */
            { name: 'country', label: 'Country', type: 'country' },
            /* Phase 88 (T7) — sector aligns with the top-level Sector enum.
               Reusing a short curated list rather than wiring the full
               taxonomy_select component into ProfileSection. */
            { name: 'sector', label: 'Sector', type: 'select', options: ['DeepTech','SaaS','FinTech','HealthTech','EdTech','AI/ML','CleanTech','Hardware','Biotech','SpaceTech','Defence','AgriTech','RetailTech','Logistics','Other'] },
            /* Phase 88 (T8) — explicit URL input. */
            { name: 'website', label: 'Website', type: 'url' },
          ]} displayCols={['competitor_name','country','sector']} />

          <ProfileSection section="news" title="Latest News" fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'url', label: 'URL', type: 'url' },
            { name: 'published_date', label: 'Date', type: 'date' },
            { name: 'source', label: 'Source' },
          ]} displayCols={['title','source','published_date']} />

          {/* Phase 92.1 (T17a) - amount_unit added; same convention as funding. */}
          <ProfileSection section="acquisitions" title="Acquisitions" fields={[
            { name: 'acquired_company', label: 'Acquired Company', required: true },
            { name: 'acquisition_date', label: 'Date', type: 'date' },
            { name: 'amount', label: 'Amount', type: 'number', min: 0 },
            // Phase 92.1.1 — same currency + unit trim as funding.
            // Phase 92.1.4 (T18) — conditional Unit dropdown driven by Currency.
            { name: 'amount_unit', label: 'Unit', type: 'select_dependent', dependsOn: 'currency', optionsBy: { INR: ['Lakh','Cr'], USD: ['K','M'] } },
            { name: 'currency', label: 'Currency', type: 'select', options: ['INR','USD'] },
          ]} displayCols={['acquired_company','acquisition_date','amount']} />
        </div>
      )}
    </div>
  );
}
