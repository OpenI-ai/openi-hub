import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare, Search, Send, Paperclip, MoreHorizontal,
  ChevronDown, Check, CheckCheck, Bell, BellOff, Archive,
  Plus, Users, Lock, Hash, Star, Clock, Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const G = '#D5AA5B';

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
  const [active, setActive] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
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
          setActive(list[0]);
          loadMessages(list[0].id);
        }
      })
      .catch(err => toast.error(err.message || 'Failed to load conversations'))
      .finally(() => setLoading(false));
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
      .catch(err => toast.error(err.message || 'Failed to create conversation'))
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
          <h1 style={{ margin: 0, color: '#1a1a1a', fontSize: 22, fontWeight: 700 }}>
            Messaging
            {totalUnread > 0 && (
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#dc2626', color: '#fff' }}>{totalUnread}</span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>Internal comms between OpenI, startups & evaluators</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', background: G, color: '#fff',
          border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 10px rgba(213,170,91,0.3)',
        }}>
          <Plus size={14} /> New Conversation
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 220px)', minHeight: 500 }}>

        {/* Sidebar: conversation list */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                placeholder="Search conversations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                  background: '#f8f8f8', border: '1.5px solid #eee', borderRadius: 8,
                  fontSize: 12, outline: 'none', color: '#1a1a1a',
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
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>No conversations</div>
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
                      <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{c.lastMsg}</span>
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

        {/* Chat panel */}
        {active ? (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
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
                <div style={{ color: '#888', fontSize: 11 }}>{active.online ? 'Online' : active.role}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[Bell, Archive, MoreHorizontal].map((Icon, i) => (
                  <button key={i} style={{ padding: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 7 }}
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
              {msgLoading && <div style={{ textAlign: 'center', padding: 24, color: '#aaa', fontSize: 12 }}>Loading messages…</div>}
              {!msgLoading && activeMessages.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#aaa', fontSize: 12 }}>No messages yet — start the conversation!</div>}
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
                      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3, paddingLeft: 4 }}>{msg.from}</div>
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
              <button style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa', borderRadius: 7 }}>
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
                    fontSize: 13, outline: 'none', resize: 'none',
                    color: '#1a1a1a', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = G}
                  onBlur={e => e.target.style.borderColor = '#eee'}
                />
              </div>
              <button
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
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <MessageSquare size={40} color="#ddd" />
            <p style={{ color: '#aaa', fontSize: 13 }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
