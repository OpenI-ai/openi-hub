// registerParts/inputStyle.js - extracted from Register.jsx (Phase 168, W5-5).
//
// The shared form-input style token. Consumed by the Register page itself and
// by every field primitive in ./fields.jsx, so it lives alone to keep the
// dependency graph a tree (nothing in registerParts/ imports the page).
//
// The region between the BODY sentinel comments is a VERBATIM slice of the
// pre-split Register.jsx at the stated line range. Do not reformat it - Gate 3
// of the split protocol compares it byte-for-byte against git history.

// ---- BODY START (original lines 18-25) ----
// Mobile Ship 6 (27 May 2026, PROF8) — fontSize bumped 14 -> 16 to suppress
// iOS Safari auto-zoom on focus. Inputs below 16px trigger Safari's input
// zoom which doesn't auto-unzoom after blur. Every new user fills this
// form on mobile; the bump fixes signup UX for all personas.
const inputStyle = {
  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#1a1a1a',
  width: '100%', borderRadius: 12, padding: '10px 14px', fontSize: 16,
};
// ---- BODY END ----

export { inputStyle };
