/**
 * Detects gate-hit errors from api.js that should trigger the upgrade
 * journey (toast + inline UpgradeCTA) instead of a bare toast.error dead-end.
 *
 * - 402 Payment Required: explicit "you need to upgrade" response.
 * - 403 with a `feature` field: a plan-gated feature check failed (as
 *   opposed to a generic auth/permission 403, which has no `feature`).
 */
export function isUpgradeError(err) {
  return err?.status === 402 || (err?.status === 403 && !!err?.feature);
}
