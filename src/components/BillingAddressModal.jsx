/**
 * BillingAddressModal — Phase 60.11
 *
 * Collects the GST-mandatory billing fields before allowing checkout. Hard-gate
 * for Razorpay payment: createOrder will return BILLING_ADDRESS_REQUIRED until
 * a row exists for the user's active role.
 *
 * Fields:
 *   - legal_name (mandatory)
 *   - line1 (mandatory), line2 (optional)
 *   - city (mandatory), state (mandatory), country (default India)
 *   - postal_code (mandatory; Indian pincode validated client-side)
 *   - gstin (optional, India-only; validated against the 15-char regex)
 *
 * For non-India countries we hide GSTIN, drop the pincode regex, and show an
 * inline notice that the invoice will use the LUT export declaration.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Building2 } from 'lucide-react';
import StateField from './StateField';
import CityField from './CityField';
import { COUNTRIES } from '../config/locations';
import { billingAddressAPI } from '../services/api';

const G = '#D0A848';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const INDIAN_PIN_REGEX = /^[1-9][0-9]{5}$/;

const inputStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  color: '#1a1a1a',
  width: '100%',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
};
const labelCls = 'block text-sm font-medium mb-1.5';

export default function BillingAddressModal({ open, onClose, onSaved, initial = null, defaults = {} }) {
  // Form state — initialised from `initial` (existing row from GET) when open.
  const [legalName, setLegalName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [postalCode, setPostalCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form whenever the modal is (re)opened with new initial data.
  useEffect(() => {
    if (!open) return;
    const src = initial || {};
    // Look up country code from name (server stores name; UI keeps code).
    const c = COUNTRIES.find(x => x.name.toLowerCase() === String(src.country || defaults.country || 'India').toLowerCase());
    setLegalName(src.legal_name || defaults.legal_name || '');
    setLine1(src.line1 || '');
    setLine2(src.line2 || '');
    setCity(src.city || '');
    setState(src.state || '');
    setCountryCode(c ? c.code : 'IN');
    setPostalCode(src.postal_code || '');
    setGstin(src.gstin || '');
  }, [open, initial, defaults.country, defaults.legal_name]);

  if (!open) return null;

  const isIndia = countryCode === 'IN';

  const validate = () => {
    if (!legalName.trim()) return 'Legal name is required';
    if (!line1.trim()) return 'Address line 1 is required';
    if (!city.trim()) return 'City is required';
    if (!state.trim()) return 'State is required';
    if (!postalCode.trim()) return 'Postal code is required';
    if (isIndia) {
      if (!INDIAN_PIN_REGEX.test(postalCode.trim())) return 'Postal code must be a 6-digit Indian pincode';
      if (gstin.trim() && !GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
        return 'GSTIN must be a valid 15-character GSTIN';
      }
    }
    return null;
  };

  const save = async (e) => {
    e?.preventDefault?.();
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const countryName = COUNTRIES.find(c => c.code === countryCode)?.name || 'India';
      const payload = {
        legal_name: legalName.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        country: countryName,
        postal_code: postalCode.trim(),
        gstin: isIndia && gstin.trim() ? gstin.trim().toUpperCase() : null,
      };
      const res = await billingAddressAPI.upsert(payload);
      toast.success('Billing details saved');
      if (onSaved) onSaved(res.billing_address || payload);
    } catch (err) {
      const msg = err?.errors?.length ? err.errors.join(', ') : (err?.message || 'Failed to save billing details');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose?.(); }}
    >
      <form
        onSubmit={save}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)', padding: 24,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={20} color={G} />
            <h2 id="billing-modal-title" style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
              Billing Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: saving ? 'wait' : 'pointer', color: '#6b7280' }}
          >
            <X size={20} />
          </button>
        </div>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0, marginBottom: 18 }}>
          Required for GST-compliant tax invoices. We'll save these and reuse for future payments.
        </p>

        {/* Legal name */}
        <div style={{ marginBottom: 14 }}>
          <label className={labelCls} style={{ color: '#374151' }}>
            Billed-to Legal Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            style={inputStyle}
            maxLength={300}
            placeholder="e.g. Acme Innovations Pvt Ltd or your full name"
            required
          />
        </div>

        {/* Address line 1 + 2 */}
        <div style={{ marginBottom: 14 }}>
          <label className={labelCls} style={{ color: '#374151' }}>
            Address Line 1 <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            style={inputStyle}
            maxLength={300}
            placeholder="Street, building, unit"
            required
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className={labelCls} style={{ color: '#374151' }}>Address Line 2</label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            style={inputStyle}
            maxLength={300}
            placeholder="Area, landmark (optional)"
          />
        </div>

        {/* Country + State */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div>
            <label className={labelCls} style={{ color: '#374151' }}>
              Country <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={countryCode}
              onChange={(e) => { setCountryCode(e.target.value); setState(''); }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <StateField
            value={state}
            onChange={setState}
            country={countryCode}
            label="State / Region"
            required
          />
        </div>

        {/* City + postal code — city is a searchable dropdown via CityField
            (opens on focus, shows top cities for selected state, debounced
            search as the user types, allows free-text for villages). */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
          <CityField
            value={city}
            onChange={setCity}
            country={countryCode}
            state={state}
            label="City"
            required
            placeholder="Select your city…"
          />
          <div>
            <label className={labelCls} style={{ color: '#374151' }}>
              {isIndia ? 'Pincode' : 'Postal / ZIP code'} <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              style={inputStyle}
              maxLength={20}
              placeholder={isIndia ? '6 digits' : ''}
              required
            />
          </div>
        </div>

        {/* GSTIN (India only) */}
        {isIndia && (
          <div style={{ marginBottom: 14 }}>
            <label className={labelCls} style={{ color: '#374151' }}>
              GSTIN <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional, for input tax credit)</span>
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
              maxLength={15}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
        )}

        {/* Export-under-LUT notice (non-India) */}
        {!isIndia && (
          <div
            style={{
              background: '#fef9c3',
              border: '1px solid #fde68a',
              color: '#854d0e',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            International orders are billed without GST under our Letter of Undertaking (LUT).
            Your invoice will reflect the export declaration:
            <br />
            <em>"Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax."</em>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '10px 18px', borderRadius: 12, border: '1px solid #e5e7eb',
              background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500,
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 22px', borderRadius: 12, border: 'none',
              background: G, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Billing Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
