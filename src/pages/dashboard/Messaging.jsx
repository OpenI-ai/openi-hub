import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MessageSquare, Search, Send, Paperclip, MoreHorizontal, CheckCheck, Bell, Archive,
  Plus, X, UserPlus, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messageAPI, meetingAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import UpgradeCTA from '../../components/UpgradeCTA';
import { isUpgradeError } from '../../utils/upgradeError';

const G = '#D0A848';

const card = {
  background: '#ffffff',
  border: '1px solid #eeeeee',
  borderRadius: 14,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const fmtTime = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now - dt) / 86400000);
  if (diffDays === 0) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return dt.toLocaleDateString('en-US', { weekday: 'short' });
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export default function Messaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Phase 89.9 (T33) — New Conversation modal state.
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('direct'); // 'direct' | 'group'
  const [selectedMembers, setSelectedMembers] = useState([]); // [{id, name, ...}]
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const memberSeqRef = useRef(0);
  const messagesEndRef = useRef(null);

  // Load conversations from API
  useEffect(() => {
    messageAPI.listConversations()
      .then(data => {
        const list = (data.conversations || data || []).map(c => ({
          ...c,
          name: c.name || `Conversation #${c.id}`,
          avatar: (c.name || 'C')[0],
          lastMsg: c.last_message || '',
          time: fmtTime(c.last_message_at || c.created_at),
          unread: Number(c.unread_count) || 0,
          online: false,
          role: c.type === 'group' ? 'Group' : 'Direct',
        }));
        setConversations(list);
        if (list.length > 0) {
          // M1: deep-link to ?conversation=<id> if provided, else default to first
          const targetId = parseInt(searchParams.get('conversation') || '', 10);
          const targetConv = targetId ? list.find(c => c.id === targetId) : null;
          const selected = targetConv || list[0];
          setActive(selected);
          loadMessages(selected.id);
        }
      })
      .catch(err => toast.error(err.message || 'Failed to load conversations'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only conversation load; loadMessages is an inline closure and searchParams is read once for the deep-link target
  }, []);

  const loadMessages = (convId) => {
    setMsgLoading(true);
    messageAPI.getMessages(convId)
      .then(data => {
        const msgs = (data.messages || data || []).map(m => ({
          id: m.id,
          from: m.sender_name || 'Unknown',
          self: m.sender_id === user?.id,
          text: m.content,
          time: fmtTime(m.created_at),
          read: m.is_read,
        }));
        setActiveMessages(msgs);
      })
      .catch(err => { toast.error(err.message || 'Failed to load messages'); setActiveMessages([]); })
      .finally(() => setMsgLoading(false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Poll for new messages every 5s when a conversation is active
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      messageAPI.getMessages(active.id)
        .then(data => {
          const msgs = (data.messages || data || []).map(m => ({
            id: m.id,
            from: m.sender_name || 'Unknown',
            self: m.sender_id === user?.id,
            text: m.content,
            time: fmtTime(m.created_at),
            read: m.is_read,
          }));
          setActiveMessages(prev => {
            if (msgs.length !== prev.length) return msgs;
            return prev;
          });
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on active?.id (granular) rather than the full active object to avoid re-arming the poll on unrelated field changes
  }, [active?.id, user?.id]);

  // Poll conversation list every 15s for unread counts
  useEffect(() => {
    const interval = setInterval(() => {
      messageAPI.listConversations()
        .then(data => {
          const list = (data.conversations || data || []).map(c => ({
            ...c,
            name: c.name || `Conversation #${c.id}`,
            avatar: (c.name || 'C')[0],
            lastMsg: c.last_message || '',
            time: fmtTime(c.last_message_at || c.created_at),
            unread: Number(c.unread_count) || 0,
            online: false,
            role: c.type === 'group' ? 'Group' : 'Direct',
          }));
          setConversations(list);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredConvs = conversations.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (c.lastMsg || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' ||
                        (filter === 'Unread' && c.unread > 0) ||
                        (filter === 'Groups' && c.type === 'group') ||
                        (filter === 'Direct' && c.type === 'direct');
    return matchSearch && matchFilter;
  });

  const sendMessage = () => {
    if (!input.trim() || !active) return;
    const text = input.trim();
    setInput('');
    // Optimistic update
    const newMsg = {
      id: Date.now(),
      from: user?.name || 'Me',
      self: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setActiveMessages(prev => [...prev, newMsg]);
    setConversations(prev => prev.map(c => c.id === active.id ? { ...c, lastMsg: text, time: newMsg.time } : c));

    messageAPI.sendMessage(active.id, text).catch(err => toast.error(err.message || 'Failed to send message'));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const openConv = (c) => {
    const updated = conversations.map(cv => cv.id === c.id ? { ...cv, unread: 0 } : cv);
    setConversations(updated);
    setActive({ ...c, unread: 0 });
    loadMessages(c.id);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  // Phase 89.9 (T33) — debounced member search (Phase 87b OrgTypeahead pattern)
  useEffect(() => {
    if (!showNew) {
      setMemberSearch('');
      setMemberResults([]);
      setMemberLoading(false);
      return undefined;
    }
    const q = memberSearch.trim();
    if (q.length < 2) {
      setMemberResults([]);
      setMemberLoading(false);
      return undefined;
    }
    setMemberLoading(true);
    const mySeq = ++memberSeqRef.current;
    const tid = setTimeout(() => {
      meetingAPI.searchUsers(q)
        .then(data => {
          if (mySeq !== memberSeqRef.current) return;
          const rows = data.users || data || [];
          setMemberResults(rows.filter(u => u.id !== user?.id)); // exclude self
        })
        .catch(() => {
          if (mySeq !== memberSeqRef.current) return;
          setMemberResults([]);
        })
        .finally(() => {
          if (mySeq !== memberSeqRef.current) return;
          setMemberLoading(false);
        });
    }, 250);
    return () => clearTimeout(tid);
  }, [showNew, memberSearch, user?.id]);

  // Phase 89.9 (T33) — reset modal form when it closes
  const closeNewModal = () => {
    setShowNew(false);
    setNewName('');
    setNewType('direct');
    setSelectedMembers([]);
    setMemberSearch('');
    setMemberResults([]);
  };

  // Phase 89.9 (T33) — create conversation handler
  const handleCreateConversation = () => {
    const trimmedName = newName.trim();
    if (newType === 'direct' && selectedMembers.length !== 1) {
      toast.error('Direct conversation requires exactly 1 other member.');
      return;
    }
    if (newType === 'group') {
      if (!trimmedName) {
        toast.error('Group conversation requires a name.');
        return;
      }
      if (selectedMembers.length < 1) {
        toast.error('Group conversation requires at least 1 other member.');
        return;
      }
    }
    setCreating(true);
    setUpgradeError(null);
    messageAPI.createConversation({
      name: trimmedName || (selectedMembers[0]?.name || 'Conversation'),
      type: newType,
      member_ids: selectedMembers.map(m => m.id),
    })
      .then(conv => {
        toast.success('Conversation created');
        return messageAPI.listConversations().then(data => {
          const list = (data.conversations || data || []).map(c => ({
            ...c,
            name: c.name || `Conversation #${c.id}`,
          }));
          setConversations(list);
          const fresh = list.find(c => c.id === conv.id);
          if (fresh) setActive(fresh);
        });
      })
      .catch(err => {
        toast.error(err.message || 'Failed to create conversation');
        if (isUpgradeError(err)) setUpgradeError(err);
        else setUpgradeError(null);
      })
      .finally(() => {
        setCreating(false);
        closeNewModal();
      });
  };

  if (loading) return <LoadingSkeleton type="list" />;

  return (
    <div style={{ padding: 28, maxWidth: 1200, background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 id="tour-page-messaging-header" style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>
            Messaging
            {totalUnread > 0 && (
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dc2626', color: '#fff' }}>{totalUnread}</span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#5c5c5c', fontSize: 13 }}>Internal comms between OpenI, startups & evaluators</p>
        </div>
        <button
          id="tour-page-messaging-new"
          onClick={() => setShowNew(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: G, color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
          }}
        >
          <Plus size={14} /> New Conversation
        </button>
      </div>

      {upgradeError && (
        <div style={{ marginBottom: 16 }}>
          <UpgradeCTA compact feature={upgradeError.feature} plan={upgradeError.plan} message={upgradeError.message} />
        </div>
      )}

      {/* Mobile Ship 2 (27 May 2026): single-pane on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]" style={{ gap: 16, height: 'calc(100vh - 220px)', minHeight: 500 }}>

        {/* Sidebar: conversation list — Mobile Ship 2: hidden on mobile when active conversation is open */}
        <div className={active ? 'hidden md:flex' : 'flex'} style={{ ...card, flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#6e6e6e' }} />
              <input
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                  background: '#f8f8f8', border: '1.5px solid #eee', borderRadius: 8,
                  fontSize: 16, color: '#1a1a1a',
                }}
              />
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {['All', 'Unread', 'Direct', 'Groups'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer',
                  background: filter === f ? G : '#fff',
                  color: filter === f ? '#fff' : '#888',
                  borderColor: filter === f ? G : '#eee',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConvs.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6e6e6e', fontSize: 12 }}>No conversations</div>
            )}
            {filteredConvs.map(c => (
              <div
                key={c.id}
                onClick={() => openConv(c)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: 'pointer',
                  background: active?.id === c.id ? 'rgba(213,170,91,0.07)' : 'transparent',
                  borderLeft: active?.id === c.id ? `3px solid ${G}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (active?.id !== c.id) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { if (active?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: c.type === 'group' ? 10 : '50%',
                      background: 'rgba(213,170,91,0.12)', color: G,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15, border: '1.5px solid rgba(213,170,91,0.25)',
                    }}>{c.avatar}</div>
                    {c.online && (
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 700 : 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>{c.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#5c5c5c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{c.lastMsg}</span>
                      {c.unread > 0 && (
                        <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: G, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{c.type === 'group' ? '👥 ' : '👤 '}{c.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel — Mobile Ship 2: always show when active set, even on mobile */}
        {active ? (
          <div className="flex md:flex" style={{ ...card, flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mobile Ship 2 (27 May 2026): back-arrow to return to conversation list on mobile */}
              <button
                onClick={() => setActive(null)}
                className="md:hidden"
                aria-label="Back to conversations"
                style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#5c5c5c', borderRadius: 6, marginLeft: -4 }}
              >
                <ChevronLeft size={20} />
              </button>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: active.type === 'group' ? 10 : '50%',
                  background: 'rgba(213,170,91,0.12)', color: G,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, border: '1.5px solid rgba(213,170,91,0.25)',
                }}>{active.avatar}</div>
                {active.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 700 }}>{active.name}</div>
                <div style={{ color: '#5c5c5c', fontSize: 11 }}>{active.online ? 'Online' : active.role}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[Bell, Archive, MoreHorizontal].map((Icon, i) => (
                  <button key={i} style={{ padding: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6e6e6e', borderRadius: 7 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgLoading && <div style={{ textAlign: 'center', padding: 24, color: '#6e6e6e', fontSize: 12 }}>Loading messages…</div>}
              {!msgLoading && activeMessages.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#6e6e6e', fontSize: 12 }}>No messages yet — start the conversation!</div>}
              {activeMessages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: msg.self ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                  {!msg.self && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(213,170,91,0.12)', color: G,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, border: '1.5px solid rgba(213,170,91,0.25)',
                    }}>{msg.from[0]}</div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    {!msg.self && (
                      <div style={{ fontSize: 10, color: '#6e6e6e', marginBottom: 3, paddingLeft: 4 }}>{msg.from}</div>
                    )}
                    <div style={{
                      padding: '9px 13px',
                      borderRadius: msg.self ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.self ? G : '#f5f5f5',
                      color: msg.self ? '#fff' : '#1a1a1a',
                      fontSize: 13, lineHeight: 1.5,
                      boxShadow: msg.self ? '0 2px 8px rgba(213,170,91,0.25)' : 'none',
                    }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 3, textAlign: msg.self ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 3, justifyContent: msg.self ? 'flex-end' : 'flex-start' }}>
                      {msg.time}
                      {msg.self && <CheckCheck size={10} color={msg.read ? '#16a34a' : '#aaa'} />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6e6e6e', borderRadius: 7 }}>
                <Paperclip size={15} />
              </button>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  rows={1}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px', background: '#f8f8f8',
                    border: '1.5px solid #eee', borderRadius: 10,
                    fontSize: 16, resize: 'none',
                    color: '#1a1a1a', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = G}
                  onBlur={e => e.target.style.borderColor = '#eee'}
                />
              </div>
              <button
                id="tour-page-messaging-composer"
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: input.trim() ? G : '#f0f0f0',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (input.trim()) e.currentTarget.style.background = '#C9983F'; }}
                onMouseLeave={e => { if (input.trim()) e.currentTarget.style.background = G; }}
              >
                <Send size={15} color={input.trim() ? '#fff' : '#ccc'} />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex" style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <MessageSquare size={40} color="#ddd" />
            <p style={{ color: '#6e6e6e', fontSize: 13 }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Phase 89.9 (T33) — New Conversation dialog */}
      {showNew && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.35)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) closeNewModal(); }}
        >
          <div style={{
            background: '#fff', borderRadius: 14, width: 'min(540px, 100%)',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>New Conversation</h3>
              <button onClick={closeNewModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5c5c5c', padding: 4, display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['direct', 'group'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: newType === t ? G : '#f5f5f5',
                        color: newType === t ? '#fff' : '#555',
                        border: 'none', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {newType === 'group' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Group name</label>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Q3 Strategy"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 12px', background: '#fff',
                      border: '1.5px solid #e0e0e0', borderRadius: 9,
                      fontSize: 16, color: '#1a1a1a',
                    }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                  {newType === 'direct' ? 'Pick a user' : 'Add members'}
                </label>
                {selectedMembers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {selectedMembers.map(m => (
                      <span key={m.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px 4px 10px', background: 'rgba(213,170,91,0.12)',
                        color: G, borderRadius: 999, fontSize: 12, fontWeight: 600,
                      }}>
                        {m.name}
                        <button
                          type="button"
                          onClick={() => setSelectedMembers(prev => prev.filter(x => x.id !== m.id))}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: G, padding: 0, display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search users by name…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 12px 9px 32px', background: '#fff',
                      border: '1.5px solid #e0e0e0', borderRadius: 9,
                      fontSize: 16, color: '#1a1a1a',
                    }}
                  />
                </div>
              </div>
              {memberSearch.trim().length >= 2 && (
                <div style={{ marginTop: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 9 }}>
                  {memberLoading ? (
                    <p style={{ padding: '12px', color: '#5c5c5c', fontSize: 12, textAlign: 'center', margin: 0 }}>Searching…</p>
                  ) : memberResults.length === 0 ? (
                    <p style={{ padding: '12px', color: '#5c5c5c', fontSize: 12, textAlign: 'center', margin: 0 }}>No matches.</p>
                  ) : (
                    memberResults
                      .filter(u => !selectedMembers.some(m => m.id === u.id))
                      .map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (newType === 'direct') {
                              setSelectedMembers([{ id: u.id, name: u.name, role: u.role }]);
                            } else {
                              setSelectedMembers(prev => [...prev, { id: u.id, name: u.name, role: u.role }]);
                            }
                            setMemberSearch('');
                            setMemberResults([]);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', padding: '8px 12px',
                            background: 'transparent', border: 'none',
                            borderBottom: '1px solid #f5f5f5', cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(213,170,91,0.12)', color: G,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>{(u.name || '?').charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{u.name}</div>
                            {u.role && <div style={{ fontSize: 11, color: '#5c5c5c' }}>{u.role}</div>}
                          </div>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={closeNewModal}
                disabled={creating}
                style={{
                  padding: '8px 14px', background: '#f5f5f5', color: '#555',
                  border: 'none', borderRadius: 8, cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: G, color: '#fff',
                  border: 'none', borderRadius: 8, cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontWeight: 700, opacity: creating ? 0.7 : 1,
                }}
              >
                <UserPlus size={14} /> {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
