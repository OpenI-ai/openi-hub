/**
 * @vitest-environment jsdom
 *
 * s116k — layer 3, page 1 of 3: Register.jsx (814 lines).
 *
 * WHAT THIS PINS, AND WHY THESE FOUR THINGS. Register is the widest funnel on
 * the site and the one place a silent regression costs a real signup. The specs
 * below cover the branches that decide WHICH SCREEN a visitor sees, plus the
 * client-side gate that decides whether they can proceed. They do not touch the
 * step-2 profile form, the org-domain match card, the claim flow, or submission:
 * those need the network, and layer 2's rule holds — protect the logic that
 * actually breaks, not the line count.
 *
 * THE PERSONA-CHOOSER SPEC IS THE POINT OF THIS FILE. `/register` with no
 * `?type=` opens on a persona picker, NOT an email field. That has surprised
 * people twice (it is written down in NEXT_SESSION_TODOS.md as a standing
 * gotcha), and it is exactly the kind of thing a well-meant refactor "fixes"
 * by defaulting the type — which would silently assign every untyped visitor
 * one persona. The spec asserts BOTH halves: the chooser is present and the
 * account form is absent. Asserting only the first would still pass if someone
 * rendered both.
 *
 * QUERIES GO THROUGH PLACEHOLDERS, NOT LABELS. The labels in this page are
 * plain <label> elements with no htmlFor and the inputs have no id, so
 * getByLabelText cannot associate them. Using placeholder text is honest about
 * what the markup actually offers. (Wiring up htmlFor would be a real
 * accessibility improvement, but it is a change to the page, and this session
 * is adding tests, not editing the page under test.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── mocks ───────────────────────────────────────────────────────────────────
// Everything that reaches the network or the browser's storage is stubbed. The
// page is the unit here; AuthContext, the API layer and analytics each have
// their own reasons to exist and are not what these specs are about.
const registerMock = vi.fn();
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ register: registerMock, user: null }),
}));
vi.mock('../../src/services/api', () => ({
  orgAPI: { lookupByDomain: vi.fn().mockResolvedValue({ match: null }) },
  profileAPI: { updateMyProfile: vi.fn().mockResolvedValue({}) },
  claimAPI: { detect: vi.fn().mockResolvedValue({ candidates: [] }), request: vi.fn() },
  // publicAPI is NOT reached by Register itself — it arrives through
  // TaxonomySelect, which step 2's profile fields render. Advancing the
  // stepper therefore pulls in a dependency step 1 never touches, and vi.mock
  // replaces the WHOLE module, so an omitted export throws rather than falling
  // back to the real one. Empty arrays are the honest fixture: these specs
  // assert nothing about taxonomy contents.
  publicAPI: {
    getTaxonomy: vi.fn().mockResolvedValue({
      sectors: [], industries: [], technologies: [], functions: [],
    }),
  },
}));
vi.mock('../../src/utils/analytics', () => ({
  trackEvent: vi.fn(),
  getUtm: () => ({}),
}));
vi.mock('../../src/utils/safeStorage', () => ({
  default: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() },
}));

// The tour and captcha widgets load third-party scripts. Stubbed to inert
// markers so a spec failure here can only mean the page changed — never that
// Cloudflare or react-joyride did.
vi.mock('../../src/components/PublicTour', () => ({ default: () => null }));
vi.mock('../../src/components/PageTourButton', () => ({ default: () => null }));
vi.mock('../../src/components/TurnstileWidget', () => ({
  default: () => <div data-testid="turnstile-stub" />,
}));

import Register from '../../src/pages/auth/Register';

const renderAt = (search = '') =>
  render(
    <MemoryRouter initialEntries={[`/register${search}`]}>
      <Register />
    </MemoryRouter>,
  );

beforeEach(() => {
  registerMock.mockReset();
});

describe('Register — which screen a visitor lands on', () => {
  it('opens on the PERSONA CHOOSER when ?type= is absent, not on the account form', () => {
    renderAt('');

    expect(screen.getByText(/choose your persona/i)).toBeInTheDocument();
    // The other half of the claim: no account form is rendered underneath.
    // Without this, defaulting the persona and showing both would still pass.
    expect(screen.queryByPlaceholderText('you@example.com')).not.toBeInTheDocument();
  });

  it('offers every configured persona on the chooser', async () => {
    renderAt('');
    // Two representative ends of the config — a provider and a seeker — rather
    // than all eleven. Pinning the full list here would turn every product
    // decision to add a persona into a test failure, which is noise.
    expect(screen.getByText('Startup')).toBeInTheDocument();
    expect(screen.getByText('Investor')).toBeInTheDocument();
  });

  it('rejects an EXPLICIT bad ?type= rather than falling back to a default', () => {
    renderAt('?type=not_a_real_persona');

    expect(screen.getByText(/invalid persona type/i)).toBeInTheDocument();
    expect(screen.queryByText(/choose your persona/i)).not.toBeInTheDocument();
  });

  it('goes straight to the account form when ?type= names a real persona', () => {
    renderAt('?type=startup');

    expect(screen.getByText(/join as startup/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/choose your persona/i)).not.toBeInTheDocument();
  });
});

describe('Register — the step 1 gate', () => {
  // step1Valid (Register.jsx:145) is five conditions ANDed together. Each spec
  // below satisfies four and breaks exactly one, so a failure names the
  // condition that regressed instead of just saying "the button is wrong".
  const fill = async (user, { name = 'Ada Lovelace', email = 'ada@example.com',
    password = 'hunter2', confirm = 'hunter2', terms = true } = {}) => {
    if (name) await user.type(screen.getByPlaceholderText('Your full name'), name);
    if (email) await user.type(screen.getByPlaceholderText('you@example.com'), email);
    if (password) await user.type(screen.getByPlaceholderText('Min 6 characters'), password);
    if (confirm) await user.type(screen.getByPlaceholderText('Re-enter password'), confirm);
    if (terms) await user.click(screen.getByRole('checkbox'));
  };

  const continueBtn = () => screen.getByRole('button', { name: /continue/i });

  it('starts disabled on an empty form', () => {
    renderAt('?type=startup');
    expect(continueBtn()).toBeDisabled();
  });

  it('enables once every condition is met', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user);
    expect(continueBtn()).toBeEnabled();
  });

  it('stays disabled while the password is under 6 characters', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user, { password: 'ab12', confirm: 'ab12' });
    expect(continueBtn()).toBeDisabled();
  });

  it('stays disabled while the confirmation does not match', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user, { confirm: 'hunter3' });
    expect(continueBtn()).toBeDisabled();
  });

  it('stays disabled until the terms checkbox is ticked', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user, { terms: false });
    expect(continueBtn()).toBeDisabled();

    // and flips the moment it is — same render, so this also proves the four
    // other conditions were already satisfied above.
    await user.click(screen.getByRole('checkbox'));
    expect(continueBtn()).toBeEnabled();
  });

  it('stays disabled without an email, even with everything else filled', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user, { email: '' });
    expect(continueBtn()).toBeDisabled();
  });

  it('does not call register() from step 1 — Continue only advances the stepper', async () => {
    const user = userEvent.setup();
    renderAt('?type=startup');
    await fill(user);
    await user.click(continueBtn());
    expect(registerMock).not.toHaveBeenCalled();
  });
});
