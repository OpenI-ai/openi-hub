// registerParts/ - barrel for the Register.jsx split (Phase 168, W5-5).
//
// Register.jsx was 1,252 lines. Lines 18-484 were entirely module-level
// declarations sitting above `export default function Register()`, so this split
// needed no JSX surgery at all: the page's own render tree is untouched.
//
// LAYOUT
//   file             original lines                 slice ln   file ln
//   inputStyle.js    18-25                                 8        22
//   fields.jsx       27-59, 61-86, 87-147, 148-296       269       305
//   FormField.jsx    298-476, 477-484                    187       218
//   index.js         (this barrel)                         -        50
//                                                  ---------
//   total sliced                                        464
//
// INVARIANTS
//   1. Every region between the BODY sentinel comments is a VERBATIM slice of the
//      pre-split Register.jsx. Sentinels carry the original line range. Never
//      reformat a slice; edit the surrounding module instead.
//   2. Slice line counts total 464. That is NOT the same as the 468 contiguous
//      lines removed from the page: lines 26, 60, 297 and 485 are blank
//      separators between module-level blocks and are deliberately not carried
//      into any slice. A total assert must use 464.
//   3. fields.jsx keeps its four primitives in one module, in original order,
//      because each block's leading comment banner lives at the tail of the
//      previous block's slice. Same reason FormField.jsx also holds
//      coerceForField. Adjacency is load-bearing - do not re-split.
//   4. The dependency graph is a tree and points one way only:
//        inputStyle <- fields <- FormField
//      Nothing in registerParts/ imports Register.jsx.
//   5. Relative specifiers reaching src/ need THREE dots
//      (registerParts/ -> auth/ -> pages/ -> src/), e.g.
//      '../../../config/locations'. Two dots resolves to pages/ and rollup
//      fails; eslint does not catch it.
//   6. The page imports this barrel as './registerParts/index.js' - the explicit
//      '/index.js' form. macOS APFS is case-insensitive and extension resolution
//      beats directory-index resolution, so a bare './registerParts' next to a
//      sibling Register.jsx is the class of specifier that silently resolves to
//      the wrong file. Keep the explicit form.
//   7. Only the three names the page actually uses are re-exported. The four
//      field primitives stay internal to FormField.
//
// VERIFY a slice is still verbatim:
//   git show <pre-split-sha>:src/pages/auth/Register.jsx | sed -n '298,476p' \
//     > /tmp/a && sed -n '/BODY START (original lines 298-476)/,/BODY END/p' \
//     src/pages/auth/registerParts/FormField.jsx | sed '1d;$d' > /tmp/b \
//     && diff /tmp/a /tmp/b && echo VERBATIM

export { inputStyle } from './inputStyle.js';
export { FormField, coerceForField } from './FormField.jsx';
