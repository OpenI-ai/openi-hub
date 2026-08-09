/**
 * OpenI Hub — API Service Layer (SHIM)
 *
 * Phase 164 (W5-1). The 1,208-line implementation moved to ./apiDomains/ — see
 * that directory's index.js for the layout, the invariants, and the recipe that
 * proves the slices are still verbatim.
 *
 * This file stays because 124 modules import from '../services/api'. Rewriting
 * all of them would be a large diff with no benefit; re-exporting is a one-liner
 * with none of the risk.
 *
 * Add nothing here. New endpoints belong in the matching ./apiDomains/ module.
 */
export * from './apiDomains';
