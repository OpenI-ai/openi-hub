/**
 * s127 (persona agent, 3 Oct) — below 1024 px the sidebar is a drawer slid off-screen, so the role tour's sidebar
 * steps (#tour-nav-*) put the beacon over the content, pointing at nothing (38 pages at 390/768 px). On those screens
 * the role tour skips them; on desktop it is unchanged.
 */
import { describe, it, expect } from 'vitest';
import { roleStepsFor } from '../../src/components/TourWrapper';
import { TOURS } from '../../src/config/tours';

describe('roleStepsFor', () => {
  const steps = [{ target: 'body', title: 'Welcome' }, { target: '#tour-nav-brief', title: 'Agent' }, { target: '#tour-page-x', title: 'Page' }];
  it('desktop: every step', () => expect(roleStepsFor(steps, true)).toEqual(steps));
  it('phone / tablet: no sidebar steps', () => expect(roleStepsFor(steps, false).map(s => s.title)).toEqual(['Welcome', 'Page']));
  it('every persona keeps at least one step on a phone (the tour still welcomes them)', () => {
    for (const [role, t] of Object.entries(TOURS)) {
      if (!t?.steps?.length) continue;
      expect(roleStepsFor(t.steps, false).length, role).toBeGreaterThan(0);
    }
  });
});
