// MyProfile — shared constants and pure helpers.
//
// Extracted from src/pages/dashboard/MyProfile.jsx (Phase 169). Every line
// between the BODY sentinel comments is a VERBATIM slice of the pre-split
// file at the stated original line range — do not reformat or re-order.
//
// NOTE (verified 9 Aug 2026): normalizeOption's own banner below claims both
// FormField and ProfileSection reference it. Only ProfileSection does
// (original lines 1043 and 1070). The banner is stale but is carried
// verbatim because these slices are byte-for-byte copies.

// ---- BODY START (original lines 18-24) ----
// Phase 82 / 82c - normalise select options (string OR {label,value} object).
// Both MyProfile.FormField and ProfileSection.inline-add reference this.
function normalizeOption(o) {
  if (typeof o === 'string') return { label: o, value: o };
  if (o && typeof o === 'object') return { label: o.label ?? String(o.value ?? ''), value: o.value ?? '' };
  return { label: String(o ?? ''), value: String(o ?? '') };
}
// ---- BODY END ----

// ---- BODY START (original lines 26-32) ----
// Mobile Ship 0 (27 May 2026) — fontSize bumped 13 -> 16 to suppress iOS
// Safari auto-zoom on focus. Inputs below 16px trigger Safari's input zoom
// which doesn't auto-unzoom after blur — leaves users stuck at ~1.3x.
const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 16, outline: 'none',
};
// ---- BODY END ----

// ---- BODY START (original lines 34-43) ----
// Phase 132 — org_typeahead fields whose DB column carries a `_v2` JSONB
// suffix (module-scope so both the profile-load overlay and handleSave's
// reverse-translation reference the same mapping). Loading overlays the
// _v2 column onto the bare name for the org_typeahead component; saving
// must translate back to the _v2 name or ALLOWED_COLUMNS silently drops it.
const V2_MAP = {
  investor_names: 'investor_names_v2',
  accelerator_programs: 'accelerator_programs_v2',
  corporate_partners: 'corporate_partners_v2',
};
// ---- BODY END ----

// ---- BODY START (original lines 45-57) ----
// Phase 88 — startup sub-section completeness weights (module-scope so the
// reference is stable across renders; used by the presence probe effect and
// the client-side completeness fallback calc).
const SUBSECTION_WEIGHTS = {
  team:          3,
  products:      3,
  funding:       3,
  clients:       2,
  patents:       3,
  competitors:   2,
  news:          2,
  acquisitions:  2,
};
// ---- BODY END ----

export { normalizeOption, inputStyle, V2_MAP, SUBSECTION_WEIGHTS };

