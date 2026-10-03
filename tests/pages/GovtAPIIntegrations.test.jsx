/**
 * @vitest-environment jsdom
 *
 * s127 (3 Oct 2026, Rajeev: "Show them honestly as Planned"). The government "Govt APIs" page showed Startup India,
 * MCA, GST and DigiLocker as connected, from a hardcoded backend list; OpenI exchanges data with none of them yet.
 * Pinned: a planned integration reads "Planned", the page says plainly that nothing is connected, and it offers no
 * sync, no "Add Integration", no call counts or last-sync times for something that never ran.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const list = vi.fn();
vi.mock('../../src/services/api', () => ({ govtIntegrationAPI: { list: (...a) => list(...a), sync: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const { default: GovtAPIIntegrations, statusLabel } = await import('../../src/pages/dashboard/GovtAPIIntegrations.jsx');

const row = (id, name, status) => ({ id, name, status, category: 'Startup Verification', endpoint: 'x', auth: 'API Key', dataPoints: ['A', 'B'], callsToday: 0 });

describe('Govt APIs page tells the truth about what is connected (s127)', () => {
  it('maps the backend statuses to readable labels; anything unknown is Planned, never Connected', () => {
    expect(statusLabel('planned')).toBe('Planned');
    expect(statusLabel('connected')).toBe('Connected');
    expect(statusLabel('pending_setup')).toBe('Pending Setup');
    expect(statusLabel(undefined)).toBe('Planned');
  });

  it('with nothing connected: a plain notice, every card Planned, no sync / add / call counts', async () => {
    list.mockResolvedValue([row(1, 'Startup India (DPIIT)', 'planned'), row(2, 'MCA (Ministry of Corporate Affairs)', 'planned')]);
    render(<GovtAPIIntegrations />);
    expect(await screen.findByTestId('govt-apis-planned-notice')).toHaveTextContent('OpenI does not exchange data with these portals yet');
    expect(screen.getAllByText('Planned').length).toBeGreaterThanOrEqual(2);
    for (const gone of ['Sync All', 'Add Integration', 'calls today', "Today's Calls"]) expect(screen.queryByText(gone)).toBeNull();
  });
});
