// profileParts — barrel for the MyProfile page split (Phase 169).
//
// MyProfile.jsx was 1213 lines. The module-level region above the page
// component (original 18-405) and a second component BELOW it (original
// 935-1213) were moved here as VERBATIM slices; the page kept only its
// import block and the page component itself.
//
// LAYOUT
//   file                 original lines            slice ln   file ln
//   constants.js         18-24,26-32,34-43,45-57         37        62
//   fields.jsx           59-83,85-105,107-172           112        134
//   FormField.jsx        174-404                        231        252
//   ProfileSection.jsx   935-1213                       279        299
//   index.js             (this barrel)                    -        39
//                                             slice total = 659
//
// INVARIANTS
//   1. Slice bodies are byte-for-byte copies. Never reformat them; edit the
//      original range semantics only, and keep the stated line ranges.
//   2. Dependency graph is a one-way tree, no cycles:
//        constants.js  <-  fields.jsx  <-  FormField.jsx
//        constants.js  <-  ProfileSection.jsx
//   3. Only four names cross back into the page: V2_MAP, SUBSECTION_WEIGHTS,
//      FormField, ProfileSection. normalizeOption / inputStyle / TagInput /
//      MultiSelect / MoneyRange are internal to this directory - the page
//      referenced none of them (verified by raw grep, not by regex).
//   4. Relative specifiers here need THREE dots to reach src/ because this
//      directory sits one level deeper than the page.
//
// VERIFY (re-concatenate a slice and diff against the pre-split file):
//   sed -n '174,404p' <(git show <pre-split-sha>:src/pages/dashboard/MyProfile.jsx) \
//     | diff - <(sed -n '/BODY START (original lines 174-404)/,/BODY END/p' \
//                    src/pages/dashboard/profileParts/FormField.jsx \
//                | sed '1d;$d')

export { V2_MAP, SUBSECTION_WEIGHTS } from './constants.js';
export { default as FormField } from './FormField.jsx';
export { default as ProfileSection } from './ProfileSection.jsx';

