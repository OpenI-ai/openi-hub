/**
 * ClusterHubAndSpoke.jsx — Phase 67: hub-and-spoke radial diagram of a
 * cluster's most representative startups.
 *
 * Layout faithful to the reference (Agentic-AI-Ecosystem) image:
 *   - Hub at the GEOMETRIC CENTRE of the canvas.
 *   - Up to 6 sector nodes evenly distributed in a full 360° ring around
 *     the hub. Empty sectors stay in the ring as anchors so the diagram
 *     reads as a balanced wheel, not a one-sided pile.
 *   - Leaves attach OUTSIDE their parent sector (further from the hub),
 *     fanning radially outward in a wedge that does not overlap
 *     neighbouring sector wedges. Compact cards: logo + name only.
 *
 * Read-only. Click a leaf → /dashboard/startups/:user_id?by=user_id.
 *
 * Props:
 *   - cluster:  { cluster_id, cluster_label, member_count, top_sectors: [{sector, n}] }
 *   - startups: array of { id, user_id, company_name, sector, logo_url, profile_score, ... }
 *   - onLeafClick: (userId) => void (optional; defaults to in-app navigate)
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Layout constants ──────────────────────────────────────────────────
const CANVAS_W = 1400;
const CANVAS_H = 1100;
const HUB_X = CANVAS_W / 2;
const HUB_Y = CANVAS_H / 2;

const SECTOR_RADIUS = 240;        // distance from hub centre to sector centre
const LEAF_RING_INNER = 420;      // single ring (per-sector triangle handles fan)

const HUB_W = 180;
const HUB_H = 180;
const SECTOR_W = 200;
const SECTOR_H = 60;
// Phase 68 — leaf is now a circle + label-below pair. The bounding box is
// the circle width × (circle + label) so react-flow centres correctly.
const LEAF_DISC = 64;             // diameter of the circular logo well
const LEAF_W = 130;               // wider than disc so the label can wrap
const LEAF_H = 100;               // disc + gap + 2-line label

// Top-N caps
const MAX_SECTORS = 6;
const MAX_LEAVES = 20;

// Edge styling — thin grey lines like the reference image
const HUB_TO_SECTOR_EDGE = { stroke: '#94A3B8', strokeWidth: 1.25 };
const SECTOR_TO_LEAF_EDGE = { stroke: '#CBD5E1', strokeWidth: 1 };

// ── Custom node renderers ─────────────────────────────────────────────
function HubNode({ data }) {
  return (
    <div
      style={{
        width: HUB_W,
        height: HUB_H,
        borderRadius: '50%',
        background: '#0D2137',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(13, 33, 55, 0.18)',
        textAlign: 'center',
        padding: 18,
      }}
    >
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div style={{ fontSize: 11, color: '#D4A843', fontFamily: 'monospace', marginBottom: 4 }}>
        Cluster #{data.cluster_id}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>
        {data.label}
      </div>
      <div style={{ fontSize: 11, color: '#94A3B8' }}>
        {data.member_count.toLocaleString()} startups
      </div>
    </div>
  );
}

function SectorNode({ data }) {
  return (
    <div
      style={{
        width: SECTOR_W,
        height: SECTOR_H,
        background: '#FFFFFF',
        border: '2px solid #D4A843',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(212, 168, 67, 0.15)',
        padding: '8px 12px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D2137', textAlign: 'center' }}>
        {data.sector}
      </div>
      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
        {data.n.toLocaleString()} in cluster
      </div>
    </div>
  );
}

function LeafNode({ data }) {
  // Org-chart style leaf: white circular logo well + 2-line name label below.
  // The circle echoes the hub and the inner logo plate inside the leaf,
  // visually unifying the diagram. No card border around the whole leaf —
  // only the disc has a border so the geometry feels lighter.
  return (
    <div
      style={{
        width: LEAF_W,
        height: LEAF_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        const disc = e.currentTarget.querySelector('[data-disc]');
        if (disc) {
          disc.style.borderColor = '#D4A843';
          disc.style.boxShadow = '0 6px 16px rgba(212, 168, 67, 0.25)';
          disc.style.transform = 'scale(1.06)';
        }
      }}
      onMouseLeave={(e) => {
        const disc = e.currentTarget.querySelector('[data-disc]');
        if (disc) {
          disc.style.borderColor = '#E2E8F0';
          disc.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
          disc.style.transform = 'scale(1)';
        }
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div
        data-disc
        style={{
          width: LEAF_DISC,
          height: LEAF_DISC,
          borderRadius: '50%',
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'border-color 140ms, box-shadow 140ms, transform 140ms',
          flexShrink: 0,
        }}
      >
        {data.logo_url ? (
          <img
            src={data.logo_url}
            alt=""
            style={{ width: '78%', height: '78%', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize: 22, fontWeight: 700, color: '#94A3B8' }}>
            {(data.company_name || '?').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          color: '#0D2137',
          textAlign: 'center',
          lineHeight: 1.25,
          // 2-line clamp so long names do not break the radial layout.
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          width: '100%',
          padding: '0 2px',
          // Soft white plate behind text so it stays readable when the
          // leaf overlaps the dotted background or an edge.
          background: 'rgba(250, 251, 252, 0.85)',
          borderRadius: 6,
        }}
      >
        {data.company_name || 'Unnamed'}
      </div>
    </div>
  );
}

const nodeTypes = { hub: HubNode, sector: SectorNode, leaf: LeafNode };

// ── Geometry helpers ──────────────────────────────────────────────────
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * Build nodes + edges array for react-flow.
 * Returns { nodes, edges } with absolute pixel positions.
 */
function buildGraph(cluster, startups) {
  const nodes = [];
  const edges = [];

  // Hub at the centre.
  nodes.push({
    id: 'hub',
    type: 'hub',
    position: { x: HUB_X - HUB_W / 2, y: HUB_Y - HUB_H / 2 },
    data: {
      cluster_id: cluster.cluster_id,
      label: cluster.cluster_label || `Cluster ${cluster.cluster_id}`,
      member_count: cluster.member_count,
    },
    draggable: false,
  });

  // Take the top-N sectors as the ring anchors (always render all of them,
  // even if some end up with zero attached leaves — that is what gives the
  // diagram its balanced wheel shape, like the reference image).
  const sectors = (cluster.top_sectors || []).slice(0, MAX_SECTORS);
  if (sectors.length === 0) return { nodes, edges };

  // Filter the top-20 leaves to those whose sector is in the ring.
  const sectorSet = new Set(sectors.map((s) => s.sector));
  const eligible = (startups || [])
    .filter((s) => s.sector && sectorSet.has(s.sector))
    .slice(0, MAX_LEAVES);

  // Group leaves by sector.
  const leavesBySector = {};
  for (const s of eligible) {
    (leavesBySector[s.sector] = leavesBySector[s.sector] || []).push(s);
  }

  // Distribute sector anchors evenly around the hub, full 360°.
  const sectorAngleStep = 360 / sectors.length;
  // Start at -90° (12 o'clock) so the ring reads symmetrically.
  const sectorAngleStart = -90;

  // Half-wedge each sector "owns" — leaves cannot stray past this without
  // overlapping the neighbouring sector's leaves. Leave a 6° gap on each
  // side as breathing room.
  const halfWedge = sectorAngleStep / 2 - 6;

  sectors.forEach((sec, i) => {
    const sectorAngleDeg = sectorAngleStart + i * sectorAngleStep;
    const sectorAngleRad = rad(sectorAngleDeg);
    const sx = HUB_X + SECTOR_RADIUS * Math.cos(sectorAngleRad);
    const sy = HUB_Y + SECTOR_RADIUS * Math.sin(sectorAngleRad);

    const sectorId = `sector-${i}`;
    nodes.push({
      id: sectorId,
      type: 'sector',
      position: { x: sx - SECTOR_W / 2, y: sy - SECTOR_H / 2 },
      data: { sector: sec.sector, n: sec.n },
      draggable: false,
    });

    edges.push({
      id: `e-hub-${sectorId}`,
      source: 'hub',
      target: sectorId,
      type: 'straight',
      style: HUB_TO_SECTOR_EDGE,
    });

    const leaves = leavesBySector[sec.sector] || [];
    if (leaves.length === 0) return;

    // With Phase 68's representatives endpoint each sector has at most 3
    // leaves. Fan them in a tight outward triangle: 1 leaf goes straight
    // out, 2 leaves split ±LEAF_FAN_DEG, 3 leaves use centre + ±LEAF_FAN_DEG.
    // Single ring radius per sector — no inner/outer alternation needed.
    const fanOffsets = (() => {
      if (leaves.length === 1) return [0];
      if (leaves.length === 2) return [-15, 15];
      // 3+: centre + ± half-wedge (capped so leaves never bleed past the
      // owned wedge, which prevents collisions with neighbouring sectors).
      const span = Math.min(20, halfWedge - 4);
      return leaves.map((_, j, arr) => {
        if (arr.length === 1) return 0;
        return -span + (j * (span * 2)) / (arr.length - 1);
      });
    })();

    leaves.forEach((leaf, j) => {
      const leafAngleDeg = sectorAngleDeg + fanOffsets[j];
      const leafAngleRad = rad(leafAngleDeg);
      const lx = HUB_X + LEAF_RING_INNER * Math.cos(leafAngleRad);
      const ly = HUB_Y + LEAF_RING_INNER * Math.sin(leafAngleRad);

      const leafId = `leaf-${i}-${j}`;
      nodes.push({
        id: leafId,
        type: 'leaf',
        position: { x: lx - LEAF_W / 2, y: ly - LEAF_H / 2 },
        data: {
          user_id: leaf.user_id || leaf.id,
          company_name: leaf.company_name,
          logo_url: leaf.logo_url,
        },
        draggable: false,
      });

      edges.push({
        id: `e-${sectorId}-${leafId}`,
        source: sectorId,
        target: leafId,
        type: 'straight',
        style: SECTOR_TO_LEAF_EDGE,
      });
    });
  });

  return { nodes, edges };
}

// ── Component ─────────────────────────────────────────────────────────
export default function ClusterHubAndSpoke({ cluster, startups, onLeafClick }) {
  const navigate = useNavigate();

  const { nodes, edges } = useMemo(
    () => buildGraph(cluster, startups),
    [cluster, startups]
  );

  // Empty/unusable input → render nothing rather than an awkward empty canvas.
  if (!cluster || nodes.length <= 1) return null;

  const handleClick = (_evt, node) => {
    if (node.type !== 'leaf') return;
    const userId = node.data.user_id;
    if (!userId) return;
    if (onLeafClick) {
      onLeafClick(userId);
    } else {
      // Use the s50 alias `/dashboard/startups/:id?by=user_id` so the
      // route resolves to <StartupProfile /> with explicit user_id lookup
      // (the singular `/dashboard/startup/:id` path is NOT registered and
      // falls through to a blank page).
      navigate(`/dashboard/startups/${userId}?by=user_id`);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        // The diagram needs a square-ish aspect to read as a circle.
        // Use viewport-relative height capped at the design canvas size,
        // with a generous floor so the ring does not get cramped on
        // smaller laptops.
        height: `min(${CANVAS_H}px, 80vh)`,
        minHeight: 640,
        background: '#FAFBFC',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={1.6}
      >
        <Background color="#E2E8F0" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
