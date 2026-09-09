/**
 * s116k — layer 3 setup: jest-dom matchers + React Testing Library cleanup.
 *
 * WHY THIS FILE IS DEFENSIVE. `setupFiles` runs before EVERY spec, including
 * the layer-2 pure-JS ones that deliberately stay on `environment: 'node'`
 * (vitest.config.js explains why at length). So this file must not assume a
 * DOM exists. It checks, and does nothing when there isn't one — a node spec
 * pays one `typeof` and no import cost.
 *
 * WHY CLEANUP IS EXPLICIT. The suite runs with `globals: false`, so React
 * Testing Library's automatic teardown never registers: it hooks a GLOBAL
 * `afterEach`, and there isn't one. Without this, every render would stay
 * mounted in the same jsdom document and the second spec in a file would
 * match elements left behind by the first — `getByText` would then throw
 * "found multiple elements" on a component that is perfectly fine. Importing
 * afterEach from 'vitest' explicitly is the supported way to do it under
 * globals: false.
 *
 * The dynamic imports are what keep the node specs honest: a static
 * `import '@testing-library/react'` would pull react-dom into a process with
 * no document at all.
 */
import { afterEach, expect } from 'vitest';

if (typeof globalThis.document !== 'undefined') {
  const [{ cleanup }, matchers] = await Promise.all([
    import('@testing-library/react'),
    import('@testing-library/jest-dom/matchers'),
  ]);

  expect.extend(matchers.default ?? matchers);
  afterEach(() => cleanup());

  // jsdom implements neither of these, and both are called during ordinary
  // render paths in this app — matchMedia by responsive components, and
  // scrollTo by the register stepper when it advances. An unstubbed call
  // throws "not a function" and fails a spec for a reason that has nothing
  // to do with what it was testing.
  if (!globalThis.matchMedia) {
    globalThis.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!globalThis.scrollTo) globalThis.scrollTo = () => {};
}
