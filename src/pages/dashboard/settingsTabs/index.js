/**
 * settingsTabs/ - barrel for the Settings page split (Phase 166 / W5-3).
 *
 * Settings.jsx was 1,507 lines. Only 47 of them were module level, so this is a
 * prop-threading split (the W5-2 shape), not the module-hoist shape used by W4-4.
 *
 * LAYOUT (ranges are original line numbers in the pre-split Settings.jsx)
 *   constants.js         18-64     G, card, FEATURE_LABELS, BOOLEAN_FEATURES, USAGE_FEATURES
 *   ProfileTab.jsx       602-678   77 lines, 7 props
 *   SecurityTab.jsx      683-828   146 lines, 25 props
 *   BillingTab.jsx       833-1320  488 lines, 24 props
 *   NotificationsTab.jsx 1325-1355 31 lines, 4 props
 *   ApiKeysTab.jsx       1360-1385 26 lines, 4 props
 *   SsoTab.jsx           1390-1415 26 lines, 4 props
 *   AuditLogsTab.jsx     1420-1445 26 lines, 4 props
 *   DataExportTab.jsx    1450-1475 26 lines, 4 props
 *   AccountInfoCard.jsx  1479-1494 16 lines, 1 props
 *
 * INVARIANTS
 *   1. Every file's BODY START/BODY END region is a byte-identical slice of the
 *      pre-split file at the stated range. Re-indenting it breaks the audit.
 *   2. Each `{tab === 'x' && ...}` guard and its `)}` / `})()}` closer stay on the
 *      PAGE, not in the component. The slice is the body only.
 *   3. The four thin tabs (ApiKeys/Sso/AuditLogs/DataExport) share an identical
 *      prop signature and first body line. They are NOT collapsed into one generic
 *      component: that would require rewriting the bodies and lose invariant 1.
 *   4. displayCurrency is passed in, never recomputed. On the page it must stay
 *      below the billingAddress useState or it throws a TDZ ReferenceError.
 *   5. The directory is 'settingsTabs', not 'settings': macOS APFS is
 *      case-insensitive and Vite prefers extension resolution over directory-index
 *      resolution, so './settings' next to Settings.jsx resolves to the page
 *      itself. That exact trap broke W5-2's build.
 *
 * VERIFY (verbatim gate) - for each file, the region between the sentinels must
 * equal the same range of the pre-split file:
 *   git show <pre-split-sha>:src/pages/dashboard/Settings.jsx | sed -n 'A,Bp'
 */
export { G, card, FEATURE_LABELS, BOOLEAN_FEATURES, USAGE_FEATURES } from './constants';
export { default as ProfileTab } from './ProfileTab';
export { default as SecurityTab } from './SecurityTab';
export { default as BillingTab } from './BillingTab';
export { default as NotificationsTab } from './NotificationsTab';
export { default as ApiKeysTab } from './ApiKeysTab';
export { default as SsoTab } from './SsoTab';
export { default as AuditLogsTab } from './AuditLogsTab';
export { default as DataExportTab } from './DataExportTab';
export { default as AccountInfoCard } from './AccountInfoCard';
