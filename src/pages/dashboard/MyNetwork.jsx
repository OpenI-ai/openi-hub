/**
 * OpenI Hub — MyNetwork (Phase 18)
 * 4-tab hub: My Connections, Incoming Requests, Outgoing Requests, Discover
 */
import { useState, useEffect, useCallback } from 'react';
import { connectionAPI, directoryAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConnectButton from '../../components/ConnectButton';
import MutualConnectionsBadge from '../../components/MutualConnectionsBadge';
import ContextualTip from '../../components/ContextualTip';
import {
  Users, Clock, Search, Loader2, MapPin, Inbox, Send, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PERSONAS } from '../../config/personas';

const G = '#D0A848';
const card = { background: '#fff', border: '1px solid #eee', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 };

function Avatar({ src, name, size = 44 }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  const letter = (name || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#f5f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: G, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

function PersonaBadge({ type }) {
  const p = PERSONAS[type];
  if (!p) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: `${p.color}15`, color: p.color }}>
      {p.label}
    </span>
  );
}

function ConnectionCard({ person, onAction }) {
  const navigate = useNavigate();
  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/profile/${person.user_id || person.id}`)}>
          <Avatar src={person.logo_url || person.avatar} name={person.display_name || person.name} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onClick={() => navigate(`/dashboard/profile/${person.user_id || person.id}`)}
              >
                {person.display_name || person.name}
              </div>
              {person.organization && <div style={{ fontSize: 12, color: '#666' }}>{person.organization}</div>}
            </div>
            <PersonaBadge type={person.role || person.persona_type} />
          </div>
          {person.tagline && <div style={{ fontSize: 12, color: '#5c5c5c', marginTop: 4, lineHeight: 1.4 }}>{person.tagline}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {person.city && <span style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={10} /> {person.city}</span>}
            {person.relationship_type && person.relationship_type !== 'colleague' && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#f5f0e6', color: '#b8860b' }}>{person.relationship_type}</span>
            )}
            <MutualConnectionsBadge userId={person.user_id || person.id} />
          </div>
        </div>
      </div>
      {onAction && <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>{onAction}</div>}
    </div>
  );
}

export default function MyNetwork() {
  const { user } = useAuth();
  const [tab, setTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [stats, setStats] = useState({ total_connections: 0, pending_incoming: 0, pending_outgoing: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData] = await Promise.all([connectionAPI.stats()]);
      setStats(statsData);

      if (tab === 'connections') {
        const data = await connectionAPI.list({ search, page, limit: 20 });
        setConnections(data.connections || []);
        setTotal(data.total || 0);
      } else if (tab === 'incoming') {
        const data = await connectionAPI.incoming();
        setIncoming(data.requests || []);
      } else if (tab === 'outgoing') {
        const data = await connectionAPI.outgoing();
        setOutgoing(data.requests || []);
      } else if (tab === 'discover') {
        const data = await directoryAPI.search({ search, limit: 20, page });
        setDiscover((data.profiles || []).filter(p => p.user_id !== user?.id));
        setTotal(data.total || 0);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [tab, search, page, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [tab, search]);

  const handleRespond = async (connId, action) => {
    try {
      await connectionAPI.respond(connId, action);
      toast.success(action === 'accept' ? 'Connection accepted!' : 'Request declined');
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const handleWithdraw = async (connId) => {
    try {
      await connectionAPI.remove(connId);
      toast.success('Connection removed');
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const tabs = [
    { key: 'connections', label: 'Connections', icon: Users, count: stats.total_connections },
    { key: 'incoming',    label: 'Incoming',    icon: Inbox, count: stats.pending_incoming },
    { key: 'outgoing',    label: 'Sent',        icon: Send,  count: stats.pending_outgoing },
    { key: 'discover',    label: 'Discover',    icon: Globe },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>My Network</h1>
      <p style={{ fontSize: 13, color: '#5c5c5c', marginBottom: 8 }}>
        {stats.total_connections} connection{stats.total_connections !== 1 ? 's' : ''}
        {stats.pending_incoming > 0 && <span style={{ color: G, fontWeight: 600 }}> &middot; {stats.pending_incoming} pending</span>}
      </p>
      <ContextualTip tipKey="network-intro">
        Build your professional network! Use the Discover tab to find people, send connection requests, and grow your ecosystem reach.
      </ContextualTip>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 0 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? G : '#666', background: 'none', border: 'none', borderBottom: active ? `2px solid ${G}` : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <Icon size={14} /> {t.label}
              {t.count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: active ? G : '#eee', color: active ? '#fff' : '#666', padding: '1px 6px', borderRadius: 10 }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar (for connections + discover tabs) */}
      {(tab === 'connections' || tab === 'discover') && (
        <div id="tour-page-network-search" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6e6e6e' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or organization..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', fontSize: 16, border: '1px solid #ddd', borderRadius: 8, outline: 'none' }} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6e6e6e' }}><Loader2 size={24} className="spin" /> Loading...</div>
      ) : (
        <>
          {/* ── CONNECTIONS TAB ─── */}
          {tab === 'connections' && (
            connections.length === 0
              ? <EmptyState icon={Users} title="No connections yet" description="Discover people in the directory and send connection requests." />
              : <div style={{ display: 'grid', gap: 12 }}>
                  {connections.map(c => (
                    <ConnectionCard key={c.id} person={c}
                      onAction={
                        <button onClick={() => handleWithdraw(c.id)}
                          style={{ fontSize: 11, color: '#666', background: 'none', border: '1px solid #eee', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                          Disconnect
                        </button>
                      }
                    />
                  ))}
                  {total > 20 && <Pagination page={page} total={total} limit={20} onChange={setPage} />}
                </div>
          )}

          {/* ── INCOMING TAB ─── */}
          {tab === 'incoming' && (
            incoming.length === 0
              ? <EmptyState icon={Inbox} title="No pending requests" description="When someone sends you a connection request, it will appear here." />
              : <div style={{ display: 'grid', gap: 12 }}>
                  {incoming.map(r => (
                    <ConnectionCard key={r.id} person={{
                      user_id: r.requester_id, display_name: r.requester_display_name, name: r.requester_name,
                      email: r.requester_email, role: r.requester_role, avatar: r.requester_avatar,
                      organization: r.requester_org, logo_url: r.requester_logo, tagline: r.requester_tagline, city: r.requester_city,
                    }} onAction={
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleRespond(r.id, 'accept')}
                          style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#16a34a', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}>
                          Accept
                        </button>
                        <button onClick={() => handleRespond(r.id, 'decline')}
                          style={{ fontSize: 12, fontWeight: 600, color: '#666', background: '#eee', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}>
                          Decline
                        </button>
                        {r.message && <span style={{ fontSize: 11, color: '#5c5c5c', fontStyle: 'italic', alignSelf: 'center' }}>"{r.message}"</span>}
                      </div>
                    } />
                  ))}
                </div>
          )}

          {/* ── OUTGOING TAB ─── */}
          {tab === 'outgoing' && (
            outgoing.length === 0
              ? <EmptyState icon={Send} title="No pending requests" description="Connection requests you've sent will appear here." />
              : <div style={{ display: 'grid', gap: 12 }}>
                  {outgoing.map(r => (
                    <ConnectionCard key={r.id} person={{
                      user_id: r.recipient_id, display_name: r.recipient_display_name, name: r.recipient_name,
                      email: r.recipient_email, role: r.recipient_role, avatar: r.recipient_avatar,
                      organization: r.recipient_org, logo_url: r.recipient_logo, tagline: r.recipient_tagline, city: r.recipient_city,
                    }} onAction={
                      <button onClick={() => handleWithdraw(r.id)}
                        style={{ fontSize: 11, color: '#b8860b', background: '#f5f0e6', border: `1px solid ${G}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                        <Clock size={10} style={{ marginRight: 4 }} /> Withdraw
                      </button>
                    } />
                  ))}
                </div>
          )}

          {/* ── DISCOVER TAB ─── */}
          {tab === 'discover' && (
            discover.length === 0
              ? <EmptyState icon={Globe} title="No users found" description="Try a different search term." />
              : <div style={{ display: 'grid', gap: 12 }}>
                  {discover.map(p => (
                    <ConnectionCard key={p.user_id} person={{ ...p, id: p.user_id }}
                      onAction={<ConnectButton userId={p.user_id} size="sm" onStatusChange={() => loadData()} />}
                    />
                  ))}
                  {total > 20 && <Pagination page={page} total={total} limit={20} onChange={setPage} />}
                </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: 48, color: '#6e6e6e' }}>
      <Icon size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{description}</div>
    </div>
  );
}

function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12 }}>
      {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)}
          style={{
            width: 28, height: 28, borderRadius: 6, border: p === page ? `1px solid ${G}` : '1px solid #eee',
            background: p === page ? '#f5f0e6' : '#fff', color: p === page ? G : '#666',
            fontWeight: p === page ? 700 : 400, fontSize: 12, cursor: 'pointer',
          }}>
          {p}
        </button>
      ))}
    </div>
  );
}
