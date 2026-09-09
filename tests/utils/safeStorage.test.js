/**
 * safeStorage — must survive a browser that has localStorage and refuses to
 * let you touch it.
 *
 * The real incident (Sentry OPENI-HUB-FRONTEND-F): in-app WebViews opened from
 * WhatsApp, Instagram and Gmail links expose `window.localStorage` but throw a
 * SecurityError the moment any property is accessed. An unguarded read at app
 * boot crashed the React render, so those visitors saw a blank page.
 *
 * These specs install a hostile localStorage rather than a missing one,
 * because "absent" is the easy case and "present but throwing" is the case
 * that actually shipped the bug.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { getItem, setItem, removeItem } from '../../src/utils/safeStorage.js';

const THROWING = {
  get getItem() { throw new DOMException('denied', 'SecurityError'); },
  get setItem() { throw new DOMException('denied', 'SecurityError'); },
  get removeItem() { throw new DOMException('denied', 'SecurityError'); },
};

function installStorage(impl) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: impl,
    configurable: true,
    writable: true,
  });
}

function workingStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

afterEach(() => {
  delete globalThis.localStorage;
});

describe('safeStorage — a working store', () => {
  it('round-trips a value', () => {
    installStorage(workingStorage());
    expect(setItem('token', 'abc')).toBe(true);
    expect(getItem('token')).toBe('abc');
  });

  it('returns null for a key that was never set', () => {
    installStorage(workingStorage());
    expect(getItem('missing')).toBeNull();
  });

  it('removes a value', () => {
    const store = workingStorage();
    installStorage(store);
    setItem('token', 'abc');
    expect(removeItem('token')).toBe(true);
    expect(getItem('token')).toBeNull();
  });
});

describe('safeStorage — a store that throws on every access', () => {
  it('reads null instead of crashing the render', () => {
    installStorage(THROWING);
    expect(() => getItem('token')).not.toThrow();
    expect(getItem('token')).toBeNull();
  });

  it('reports a failed write rather than throwing', () => {
    installStorage(THROWING);
    expect(() => setItem('token', 'abc')).not.toThrow();
    expect(setItem('token', 'abc')).toBe(false);
  });

  it('reports a failed remove rather than throwing', () => {
    installStorage(THROWING);
    expect(() => removeItem('token')).not.toThrow();
    expect(removeItem('token')).toBe(false);
  });
});

describe('safeStorage — no localStorage at all', () => {
  // Server-side rendering and the prerender step both run without one.
  it('degrades to null and false rather than a ReferenceError', () => {
    delete globalThis.localStorage;
    expect(getItem('token')).toBeNull();
    expect(setItem('token', 'abc')).toBe(false);
    expect(removeItem('token')).toBe(false);
  });
});

describe('safeStorage — a quota-exhausted store', () => {
  it('reports the failed write but still reads existing values', () => {
    // Private mode commonly gives a zero quota: reads work, writes throw.
    const store = workingStorage();
    store.setItem('existing', 'value');
    installStorage({
      getItem: store.getItem,
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); },
      removeItem: store.removeItem,
    });
    expect(setItem('new', 'value')).toBe(false);
    expect(getItem('existing')).toBe('value');
  });
});
