/**
 * OpenI Hub - subsectionRows.jsx
 *
 * the eight per-subsection row renderers + the SubSectionRow switch
 *
 * VERBATIM slice of src/pages/dashboard/StartupProfile.jsx lines 713-930 as it
 * stood before the Phase 163 split (9 Aug 2026). Do NOT reformat the body -
 * see ./index.js for the re-concat verification recipe and the invariants.
 */

import { Calendar, ExternalLink, FileText, Globe, X } from 'lucide-react';
import {
  Badge, FallbackFields, LogoImg, MoneyPill, RowCard, RowHeader,
  StatusBadge, UrlChip, fmtDate,
} from './fieldPrimitives.jsx';
import { amountToDisplay, valuationToDisplay } from './fundingChart.jsx';

// --- BODY START (verbatim, do not reformat) ---
// --- lines 713-930 ---
// ── Per-section row components (Phase 90) ─────────────────────────────

function TeamRow({ row }) {
  const meta = [];
  if (row.designation) meta.push(row.designation);
  if (row.role && row.role !== row.designation) meta.push(row.role);
  if (row.is_founder)  meta.push(<Badge tone="green">Founder</Badge>);
  if (row.is_advisory) meta.push(<Badge tone="amber">Advisory</Badge>);

  return (
    <RowCard>
      <RowHeader primary={row.name || 'Team member'} meta={meta} />
      {row.bio && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.bio}</p>
      )}
      {(row.linkedin_url || row.twitter_url) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <UrlChip href={row.linkedin_url} icon={ExternalLink} label="LinkedIn" />
          <UrlChip href={row.twitter_url}  icon={ExternalLink} label="X (Twitter)" />
        </div>
      )}
      <FallbackFields row={row} slotted={['name','designation','role','is_founder','is_advisory','bio','linkedin_url','twitter_url']} />
    </RowCard>
  );
}

function ProductRow({ row }) {
  const meta = [];
  if (row.pricing_model) meta.push(<Badge tone="primary">{row.pricing_model}</Badge>);
  if (row.launch_date)   meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.launch_date)}</span>);
  const productUrl = row.url || row.product_url;

  return (
    <RowCard>
      <RowHeader primary={row.name || row.product_name || 'Product'} meta={meta} />
      {row.tagline && (
        <p className="text-xs text-primary-700 font-medium mt-1">{row.tagline}</p>
      )}
      {row.description && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.description}</p>
      )}
      {productUrl && (
        <div className="mt-2">
          <UrlChip href={productUrl} icon={ExternalLink} label="Visit Product" />
        </div>
      )}
      <FallbackFields row={row} slotted={['name','product_name','tagline','description','launch_date','pricing_model','url','product_url']} />
    </RowCard>
  );
}

function FundingRow({ row }) {
  const meta = [];
  if (row.round_date)    meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.round_date)}</span>);
  if (row.lead_investor) meta.push(`Led by ${row.lead_investor}`);
  // Phase 92.1.3 (T17c) - valuation as secondary meta line under round info.
  // Falls back to row.currency when valuation_at_round_currency is null (some
  // legacy rows may have currency on the round but not the valuation).
  const valDisplay = valuationToDisplay(row);
  if (valDisplay) meta.push(<span className="text-gray-600">Valued at <span className="font-semibold">{valDisplay}</span></span>);

  // Phase 92.1 - render money via amountToDisplay so list view shows the
  // same currency + unit format as the chart (e.g. "Rs10 Cr" or "$5 M").
  let moneyEl = null;
  const amt = amountToDisplay(row);
  if (amt) {
    moneyEl = <MoneyPill value={amt.displayLabel} />;
  }

  return (
    <RowCard>
      <RowHeader
        primary={row.round_name || row.round_type || 'Funding round'}
        meta={meta}
        right={moneyEl}
      />
      <FallbackFields row={row} slotted={['round_name','round_type','round_date','lead_investor','amount','amount_unit','amount_range','currency','valuation_at_round','valuation_at_round_unit','valuation_at_round_currency']} />
    </RowCard>
  );
}

function ClientsRow({ row }) {
  const meta = [];
  if (row.industry) meta.push(<Badge tone="blue">{row.industry}</Badge>);

  return (
    <RowCard>
      <div className="flex items-center gap-3">
        <LogoImg src={row.logo_url} size={40} />
        <div className="flex-1 min-w-0">
          <RowHeader primary={row.client_name || row.name || 'Client'} meta={meta} />
        </div>
      </div>
      <FallbackFields row={row} slotted={['client_name','name','industry','logo_url']} />
    </RowCard>
  );
}

function PatentsRow({ row }) {
  const meta = [];
  if (row.status)         meta.push(<StatusBadge status={row.status} />);
  if (row.patent_number)  meta.push(<span className="font-mono">{row.patent_number}</span>);
  if (row.filing_date)    meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />Filed {fmtDate(row.filing_date)}</span>);

  return (
    <RowCard>
      <RowHeader primary={row.title || 'Patent'} meta={meta} />
      {row.abstract && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.abstract}</p>
      )}
      {row.url && (
        <div className="mt-2">
          <UrlChip href={row.url} icon={FileText} label="View Patent" />
        </div>
      )}
      <FallbackFields row={row} slotted={['title','status','patent_number','filing_date','abstract','url']} />
    </RowCard>
  );
}

function CompetitorsRow({ row }) {
  const meta = [];
  if (row.sector)   meta.push(<Badge tone="primary">{row.sector}</Badge>);
  if (row.country)  meta.push(<span className="inline-flex items-center gap-1"><Globe size={11} />{row.country}</span>);

  return (
    <RowCard>
      <RowHeader primary={row.competitor_name || row.name || 'Competitor'} meta={meta} />
      {(row.description || row.differentiation) && (
        <p className="text-xs text-gray-600 mt-1.5 line-clamp-3">{row.description || row.differentiation}</p>
      )}
      {row.website && (
        <div className="mt-2">
          <UrlChip href={row.website} icon={Globe} label="Visit Site" />
        </div>
      )}
      <FallbackFields row={row} slotted={['competitor_name','name','sector','country','description','differentiation','website']} />
    </RowCard>
  );
}

function NewsRow({ row }) {
  const meta = [];
  if (row.source)         meta.push(row.source);
  if (row.published_date) meta.push(fmtDate(row.published_date));
  const href = row.url || row.link;

  // News title is the primary action — make whole header clickable when href exists.
  const titleEl = href ? (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-primary-600 transition-colors"
    >
      {row.title || row.headline || 'Article'}
    </a>
  ) : (row.title || row.headline || 'Article');

  return (
    <RowCard>
      <RowHeader primary={titleEl} meta={meta} />
      {href && (
        <div className="mt-2">
          <UrlChip href={href} icon={ExternalLink} label="Read Article" />
        </div>
      )}
      <FallbackFields row={row} slotted={['title','headline','source','published_date','url','link']} />
    </RowCard>
  );
}

function AcquisitionsRow({ row }) {
  const meta = [];
  if (row.acquisition_date) meta.push(<span className="inline-flex items-center gap-1"><Calendar size={11} />{fmtDate(row.acquisition_date)}</span>);

  // Phase 92.1 - same display fix as FundingRow
  let moneyEl = null;
  const amt = amountToDisplay(row);
  if (amt) {
    moneyEl = <MoneyPill value={amt.displayLabel} />;
  }

  return (
    <RowCard>
      <RowHeader
        primary={row.acquired_company || row.acquirer || row.target || 'Acquisition'}
        meta={meta}
        right={moneyEl}
      />
      <FallbackFields row={row} slotted={['acquired_company','acquirer','target','acquisition_date','amount','amount_unit','amount_range','currency']} />
    </RowCard>
  );
}

// Dispatcher — picks the right row component for each section type.
function SubSectionRow({ sectionKey, row }) {
  switch (sectionKey) {
    case 'team':         return <TeamRow row={row} />;
    case 'products':     return <ProductRow row={row} />;
    case 'funding':      return <FundingRow row={row} />;
    case 'clients':      return <ClientsRow row={row} />;
    case 'patents':      return <PatentsRow row={row} />;
    case 'competitors':  return <CompetitorsRow row={row} />;
    case 'news':         return <NewsRow row={row} />;
    case 'acquisitions': return <AcquisitionsRow row={row} />;
    default:
      // Defensive fallback — shouldn't fire, but keeps render-everything intact
      // for any hypothetical new sub-section type added later.
      return (
        <RowCard>
          <RowHeader primary={row.name || row.title || 'Entry'} meta={[]} />
          <FallbackFields row={row} slotted={[]} />
        </RowCard>
      );
  }
}

// --- BODY END ---

export {
  SubSectionRow,
};
