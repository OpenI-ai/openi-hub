/**
 * ClusterHubAndSpoke.jsx — Phase 67: hub-and-spoke radial diagram of a
 * cluster's most representative startups.
 *
 * Two-tier radial layout, modelled after the Agentic-AI-Ecosystem reference:
 *   Level 0 (centre): the cluster itself (label + total members).
 *   Level 1: the top 6 sectors among cluster members (from cluster.top_sectors).
 *   Level 2: up to 20 highest-scoring startups, attached to the matching
 *            Level-1 sector. Startups whose sector is not in the top 6 are
 *            silently dropped from the diagram (they remain in the table view).
 *
 * Renders with @xyflow/react. We compute node positions manually so the layout
 * is deterministic and matches the reference image; react-flow only gives us
 * the canvas, edges, and pan/zoom plumbing. No physics simulation.
 *
 * Read-only. Click a startup leaf → /dashboard/startup/:user_id.
 *
 * Props:
 *   - cluster:  { cluster_id, cluster_label, member_count, top_sectors: [{sector, n}] }
 *   - startups: array of { id, user_id, company_name, tagline, sector, logo_url, profile_score, ... }
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
const CANVAS_W = 1100;
const CANVAS_H = 720;
const HUB_X = CANVAS_W / 2;
const HUB_Y = CANVAS_H / 2;

const SECTOR_RADIUS = 220;        // distance from hub to sector node centre
const LEAF_RADIUS_BASE = 360;     // base distance from hub to leaf node centre
const LEAF_FAN_DEG = 38;          // half-angle (degrees) the leaves fan around their sector

const HUB_W = 180;
const HUB_H = 180;
const SECTOR_W = 200;
const SECTOR_H = 56;
const LEAF_W = 240;
const LEAF_H = 64;

// Top-N caps
const MAX_SECTORS = 6;
const MAX_LEAVES = 20;

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
        padding: 16,
      }}
    >
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div style={{ fontSize: 11, color: '#D4A843', fontFamily: 'monospace', marginBottom: 4 }}>
        Cluster #{data.cluster_id}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>
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
  return (
    <div
      style={{
        width: LEAF_W,
        height: LEAF_H,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 10px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'border-color 120ms, box-shadow 120ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#D4A843';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 168, 67, 0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E2E8F0';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#F1F5F9',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {data.logo_url ? (
          <img
            src={data.logo_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
            {(data.company_name || '?').charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#0D2137',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.company_name || 'Unnamed'}
        </div>
        {data.tagline && (
          <div
            style={{
              fontSize: 10,
              color: '#64748B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.tagline}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { hub: HubNode, sector: SectorNode, leaf: LeafNode };

// ── Geometry helpers ──────────────────────────────────────────────────
const deg = (rad) => (rad * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

/**
 * Build nodes + edges array for react-flow.
 * Returns { nodes, edges } with absolute pixel positions.
 */
function buildGraph(cluster, startups) {
  const nodes = [];
  const edges = [];

  // Hub (centre)
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

  const sectors = (cluster.top_sectors || []).slice(0, MAX_SECTORS);
  if (sectors.length === 0) return { nodes, edges };

  // Determine the "weight" (member count) for each sector to allocate leaves proportionally.
  const totalSectorWeight = sectors.reduce((sum, s) => sum + (s.n || 1), 0);

  // Filter startups to those whose sector is in the top-6 list.
  const sectorSet = new Set(sectors.map((s) => s.sector));
  const eligible = (startups || []).filter((s) => s.sector && sectorSet.has(s.sector)).slice(0, MAX_LEAVES);

  // Group eligible startups by sector.
  const leavesBySector = {};
  for (const s of eligible) {
    (leavesBySector[s.sector] = leavesBySector[s.sector] || []).push(s);
  }

  // Layout: distribute sectors evenly around the hub.
  const sectorAngleStep = 360 / sectors.length;
  // Start at top-12-o'clock so the diagram reads left-to-right symmetrically.
  const sectorAngleStart = -90;

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
      style: { stroke: '#94A3B8', strokeWidth: 1.5 },
    });

    const leaves = leavesBySector[sec.sector] || [];
    if (leaves.length === 0) return;

    // Fan leaves around the sector's outward direction within ±LEAF_FAN_DEG.
    const fanStart = sectorAngleDeg - LEAF_FAN_DEG;
    const fanEnd = sectorAngleDeg + LEAF_FAN_DEG;
    const fanStep = leaves.length > 1 ? (fanEnd - fanStart) / (leaves.length - 1) : 0;

    leaves.forEach((leaf, j) => {
      const leafAngleDeg = leaves.length > 1 ? fanStart + j * fanStep : sectorAngleDeg;
      const leafAngleRad = rad(leafAngleDeg);
      // Stagger leaf radius slightly so adjacent leaves don't overlap.
      const leafRadius = LEAF_RADIUS_BASE + (j % 2 === 0 ? 0 : 30);
      const lx = HUB_X + leafRadius * Math.cos(leafAngleRad);
      const ly = HUB_Y + leafRadius * Math.sin(leafAngleRad);

      const leafId = `leaf-${i}-${j}`;
      nodes.push({
        id: leafId,
        type: 'leaf',
        position: { x: lx - LEAF_W / 2, y: ly - LEAF_H / 2 },
        data: {
          user_id: leaf.user_id || leaf.id,
          company_name: leaf.company_name,
          tagline: leaf.tagline,
          logo_url: leaf.logo_url,
        },
        draggable: false,
      });

      edges.push({
        id: `e-${sectorId}-${leafId}`,
        source: sectorId,
        target: leafId,
        type: 'straight',
        style: { stroke: '#CBD5E1', strokeWidth: 1 },
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
      navigate(`/dashboard/startup/${userId}`);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: CANVAS_H,
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
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.6}
      >
        <Background color="#E2E8F0" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
