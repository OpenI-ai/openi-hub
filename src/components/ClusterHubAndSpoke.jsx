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
// Canvas grew from 1400x1100 to 1700x1500 in Phase 71b to give the
// subgroup tier room to breathe. The diagram still pans inside the
// react-flow viewport so smaller windows still see everything.
const CANVAS_W = 1700;
const CANVAS_H = 1500;
const HUB_X = CANVAS_W / 2;
const HUB_Y = CANVAS_H / 2;

// Phase 71 — three concentric rings:
//   SECTOR_RADIUS    → sector pills
//   SUBGROUP_RADIUS  → BASE radius for sub-group pills; grows per-sector
//                       in Phase 71b when the sector has many subgroups so
//                       arc length per pill stays clear of overlap.
//   LEAF_RING_INNER  → leaf cards. Phase 71b derives this per-sector as
//                       (effective subgroup radius) + LEAF_RING_GAP so
//                       leaves never collide with their parent subgroup.
const SECTOR_RADIUS = 280;
const SUBGROUP_RADIUS = 460;
const LEAF_RING_GAP = 200;            // distance from subgroup ring to leaf ring
const LEAF_RING_INNER = SUBGROUP_RADIUS + LEAF_RING_GAP;
const SUBGROUP_PILL_PITCH = 180;       // approx widest pill + label gap

const HUB_W = 180;
const HUB_H = 180;
const SECTOR_W = 200;
const SECTOR_H = 60;
const SUBGROUP_W = 160;
const SUBGROUP_H = 44;
// Phase 68 — leaf is a circle + label-below pair. The bounding box is the
// circle width × (circle + label) so react-flow centres correctly.
const LEAF_DISC = 64;
const LEAF_W = 130;
const LEAF_H = 100;

// Top-N caps
const MAX_SECTORS = 6;
const MAX_LEAVES = 60;  // raised because subgroups multiply the natural leaf count

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
      {/* #94A3B8 is deliberate here and must NOT be darkened with the rest of the
          grey ramp: this node sits on the #0D2137 navy fill set above, where the
          light slate reads at 6.6:1. The AA fix applied elsewhere (-> #6e6e6e)
          would drop it to 1.5:1. */}
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
        {data.n.toLocaleString()} in theme
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
          <span style={{ fontSize: 22, fontWeight: 700, color: '#6e6e6e' }}>
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

function SubgroupNode({ data }) {
  return (
    <div
      style={{
        width: SUBGROUP_W,
        height: SUBGROUP_H,
        background: '#FFFDF6',
        border: '1.5px solid #E5C36A',
        borderRadius: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(212, 168, 67, 0.10)',
        padding: '4px 10px',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <div style={{ fontSize: 12, fontWeight: 600, color: '#0D2137', textAlign: 'center', lineHeight: 1.15 }}>
        {data.label}
      </div>
      <div style={{ fontSize: 9, color: '#6e6e6e' }}>
        {data.member_count?.toLocaleString()} startups
      </div>
    </div>
  );
}

const nodeTypes = {
  hub: HubNode,
  sector: SectorNode,
  subgroup: SubgroupNode,
  leaf: LeafNode,
};

// ── Geometry helpers ──────────────────────────────────────────────────
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * Build nodes + edges array for react-flow.
 * Returns { nodes, edges } with absolute pixel positions.
 */
function buildGraph(cluster, startups, subgroups = []) {
  const nodes = [];
  const edges = [];

  // Hub at the centre.
  nodes.push({
    id: 'hub',
    type: 'hub',
    position: { x: HUB_X - HUB_W / 2, y: HUB_Y - HUB_H / 2 },
    data: {
      cluster_id: cluster.cluster_id,
      label: cluster.cluster_label || `Theme ${cluster.cluster_id}`,
      member_count: cluster.member_count,
    },
    draggable: false,
  });

  const sectors = (cluster.top_sectors || []).slice(0, MAX_SECTORS);
  if (sectors.length === 0) return { nodes, edges };

  const sectorSet = new Set(sectors.map((s) => s.sector));
  const eligible = (startups || [])
    .filter((s) => s.sector && sectorSet.has(s.sector))
    .slice(0, MAX_LEAVES);

  // Phase 71 — group subgroups by sector (only those whose sector is in the ring).
  const subBySector = {};
  for (const sg of subgroups || []) {
    if (!sectorSet.has(sg.sector)) continue;
    (subBySector[sg.sector] = subBySector[sg.sector] || []).push(sg);
  }
  const useSubgroupTier = Object.keys(subBySector).length > 0;

  // Group leaves by (sector) — and by (sector, subgroup_id) when subgroups exist.
  const leavesBySector = {};
  const leavesBySectorAndSub = {};
  for (const s of eligible) {
    (leavesBySector[s.sector] = leavesBySector[s.sector] || []).push(s);
    if (useSubgroupTier && s.subgroup_id != null) {
      const key = `${s.sector}::${s.subgroup_id}`;
      (leavesBySectorAndSub[key] = leavesBySectorAndSub[key] || []).push(s);
    }
  }

  // Distribute sector anchors evenly around the hub, full 360°.
  const sectorAngleStep = 360 / sectors.length;
  const sectorAngleStart = -90;  // -90° = 12 o'clock
  const halfWedge = sectorAngleStep / 2 - 6;  // 6° gap on each side as breathing room

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

    // ── Phase 71 three-tier path ────────────────────────────────────────
    if (useSubgroupTier && subBySector[sec.sector]) {
      const sgList = subBySector[sec.sector].slice(0, 6);  // cap subgroup fan

      // Phase 71b — adaptive subgroup radius. With N subgroups inside
      // this sector's wedge, each pill needs SUBGROUP_PILL_PITCH px of
      // arc to clear its neighbour. Required radius:
      //   r >= (N * pitch) / wedgeRad
      // We use the larger of the base SUBGROUP_RADIUS and the required
      // radius, then push leaves out by LEAF_RING_GAP so leaves never
      // collide with the subgroup pill in front of them.
      const wedgeRad = rad(halfWedge * 2);
      const requiredR =
        sgList.length <= 1
          ? SUBGROUP_RADIUS
          : Math.max(
              SUBGROUP_RADIUS,
              (sgList.length * SUBGROUP_PILL_PITCH) / wedgeRad,
            );
      const sgRadius = requiredR;
      const leafRadius = sgRadius + LEAF_RING_GAP;

      // Now spacing in *degrees* — once radius accommodates the pitch,
      // the angular step is the wedge divided evenly across N pills.
      const sgStep =
        sgList.length === 1 ? 0 : (halfWedge * 2) / sgList.length;
      const sgStart = -((sgList.length - 1) / 2) * sgStep;

      sgList.forEach((sg, sgIdx) => {
        const sgAngleDeg = sectorAngleDeg + (sgStart + sgIdx * sgStep);
        const sgAngleRad = rad(sgAngleDeg);
        const sgx = HUB_X + sgRadius * Math.cos(sgAngleRad);
        const sgy = HUB_Y + sgRadius * Math.sin(sgAngleRad);

        const sgNodeId = `sg-${i}-${sg.subgroup_id}`;
        nodes.push({
          id: sgNodeId,
          type: 'subgroup',
          position: { x: sgx - SUBGROUP_W / 2, y: sgy - SUBGROUP_H / 2 },
          data: { label: sg.label, member_count: sg.member_count },
          draggable: false,
        });
        edges.push({
          id: `e-${sectorId}-${sgNodeId}`,
          source: sectorId,
          target: sgNodeId,
          type: 'straight',
          style: HUB_TO_SECTOR_EDGE,
        });

        const leaves = (leavesBySectorAndSub[`${sec.sector}::${sg.subgroup_id}`] || []).slice(0, 2);
        if (leaves.length === 0) return;
        // Leaves get a wider angular gap so the two cards under one
        // subgroup never overlap. 6° at radius 660 = ~69px arc — clear
        // of the 130px LEAF_W only when paired ±halfStep, so use ±5°.
        const leafStep = leaves.length === 1 ? 0 : 10;
        const leafStart = -((leaves.length - 1) / 2) * leafStep;

        leaves.forEach((leaf, j) => {
          const leafAngleDeg = sgAngleDeg + (leafStart + j * leafStep);
          const leafAngleRad = rad(leafAngleDeg);
          const lx = HUB_X + leafRadius * Math.cos(leafAngleRad);
          const ly = HUB_Y + leafRadius * Math.sin(leafAngleRad);
          const leafId = `leaf-${i}-${sg.subgroup_id}-${j}`;
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
            id: `e-${sgNodeId}-${leafId}`,
            source: sgNodeId,
            target: leafId,
            type: 'straight',
            style: SECTOR_TO_LEAF_EDGE,
          });
        });
      });
      return;
    }

    // ── Phase 68 two-tier fallback (unchanged behaviour) ────────────────
    const leaves = leavesBySector[sec.sector] || [];
    if (leaves.length === 0) return;

    const MIN_LEAF_GAP_DEG = 16;  // ≈ 130px arc gap at radius 520
    const fanOffsets = (() => {
      if (leaves.length === 1) return [0];
      if (leaves.length === 2) return [-18, 18];
      const wedgeMax = halfWedge - 4;
      const requiredHalfSpan = ((leaves.length - 1) / 2) * MIN_LEAF_GAP_DEG;
      const span = Math.min(wedgeMax, Math.max(20, requiredHalfSpan));
      return leaves.map((_, j, arr) => -span + (j * (span * 2)) / (arr.length - 1));
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
export default function ClusterHubAndSpoke({ cluster, startups, subgroups = [], onLeafClick }) {
  const navigate = useNavigate();

  const { nodes, edges } = useMemo(
    () => buildGraph(cluster, startups, subgroups),
    [cluster, startups, subgroups]
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
