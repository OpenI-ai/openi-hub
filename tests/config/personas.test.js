/**
 * personas — the role vocabulary the whole frontend keys off.
 *
 * These are consistency assertions, not behaviour tests. Every persona-aware
 * surface (nav, register, profile fields, dashboards) indexes into these
 * objects by role name, so a role added to one export and missed in another
 * produces an undefined lookup deep inside a render rather than an error here.
 *
 * The backend carries the same two lists in authController.js
 * (PROVIDER_ROLES / SEEKER_ROLES). They must agree: registration validates
 * against the backend copy, so a role this file offers and the backend does
 * not reject at signup. That cross-repo check cannot run from this repo — it
 * is called out here so the next person knows to look.
 */
import { describe, it, expect } from 'vitest';
import {
  PERSONA_CATEGORIES,
  PROVIDER_ROLES,
  SEEKER_ROLES,
  ALL_PERSONA_ROLES,
  SELF_REGISTER_ROLES,
  getPersonaCategory,
  PERSONAS,
  PERSONA_NAV,
} from '../../src/config/personas.js';

describe('role lists', () => {
  it('splits every persona role into exactly one category', () => {
    const overlap = PROVIDER_ROLES.filter((r) => SEEKER_ROLES.includes(r));
    expect(overlap).toEqual([]);
  });

  it('builds ALL_PERSONA_ROLES from both halves with no duplicates', () => {
    expect(ALL_PERSONA_ROLES).toEqual([...PROVIDER_ROLES, ...SEEKER_ROLES]);
    expect(new Set(ALL_PERSONA_ROLES).size).toBe(ALL_PERSONA_ROLES.length);
  });

  it('never offers admin or evaluator for self-registration', () => {
    // Privilege escalation at signup if this ever regresses.
    expect(SELF_REGISTER_ROLES).not.toContain('admin');
    expect(SELF_REGISTER_ROLES).not.toContain('evaluator');
  });
});

describe('getPersonaCategory', () => {
  it('maps every provider role to provider', () => {
    for (const role of PROVIDER_ROLES) expect(getPersonaCategory(role)).toBe('provider');
  });

  it('maps every seeker role to seeker', () => {
    for (const role of SEEKER_ROLES) expect(getPersonaCategory(role)).toBe('seeker');
  });

  it('returns null for non-persona and unknown roles', () => {
    for (const role of ['admin', 'evaluator', 'nonsense', '', null, undefined]) {
      expect(getPersonaCategory(role)).toBeNull();
    }
  });

  it('returns a category that exists in PERSONA_CATEGORIES', () => {
    for (const role of ALL_PERSONA_ROLES) {
      expect(Object.keys(PERSONA_CATEGORIES)).toContain(getPersonaCategory(role));
    }
  });
});

describe('PERSONAS metadata', () => {
  it('defines an entry for every persona role and no extras', () => {
    expect(Object.keys(PERSONAS).sort()).toEqual([...ALL_PERSONA_ROLES].sort());
  });

  it('gives every persona a label, icon, colour and description', () => {
    const incomplete = Object.entries(PERSONAS)
      .filter(([, p]) => !p.label || !p.icon || !p.color || !p.description)
      .map(([role]) => role);
    expect(incomplete).toEqual([]);
  });

  it('agrees with getPersonaCategory on every role', () => {
    // Two sources for the same fact. They have to match, or a persona shows
    // seeker navigation while being scored as a provider.
    for (const [role, meta] of Object.entries(PERSONAS)) {
      expect(meta.category).toBe(getPersonaCategory(role));
    }
  });

  it('gives every persona a distinct colour, so badges stay distinguishable', () => {
    const colors = Object.values(PERSONAS).map((p) => p.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('PERSONA_NAV', () => {
  it('defines navigation for every persona role', () => {
    const missing = ALL_PERSONA_ROLES.filter((r) => !PERSONA_NAV[r]);
    expect(missing).toEqual([]);
  });

  it('gives every persona a non-empty nav', () => {
    const empty = Object.entries(PERSONA_NAV)
      .filter(([, nav]) => !nav || Object.keys(nav).length === 0)
      .map(([role]) => role);
    expect(empty).toEqual([]);
  });
});
