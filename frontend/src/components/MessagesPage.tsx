import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Badge } from './UI';
import { getUserConversations, getConversation, sendMessage, getCurrentUser, markMessageRead, markMessageUnread, getMentorEmployees, getBuddyInfo } from '../services/mockApi.ts';
import { io } from 'socket.io-client';

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Array<any>>([]);
  const [mentees, setMentees] = useState<Array<any>>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<any>(null);
  const current = getCurrentUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const conv = await getUserConversations();
        if (!mounted) return;
        setConversations(conv || []);
        // Try to pre-load mentee/buddy names so we can resolve partner IDs to names
        try {
          if (current?.role === 'mentor') {
            const m = await getMentorEmployees(current.id);
            if (mounted) setMentees(m || []);
          } else if (current?.role === 'employee') {
            const b = await getBuddyInfo(current.buddyId || null);
            if (b && mounted) setMentees([b]);
          }
        } catch (e) {
          // ignore lookup errors
        }
      } catch {
        if (mounted) setConversations([]);
      }
    })();

    try {
      const wsRoot = (import.meta as any).env?.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
      const socket = io(wsRoot, { auth: { token: current?.token } });
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('join', current?.id));
      socket.on('message', (m: any) => {
        // update conversation list last message/time and append to open conversation if relevant
        setConversations((prev) => {
          const copy = prev.slice();
          const idx = copy.findIndex((c) => c.partnerId === (String(m.from) === String(current?.id) ? String(m.to) : String(m.from)));
          const partnerId = String(m.from) === String(current?.id) ? String(m.to) : String(m.from);
          const partnerName = m.partnerName || null;
          const summary = { partnerId, partnerName: partnerName || partnerId, lastMessage: m.text, lastAt: m.createdAt, unread: String(m.to) === String(current?.id) && !m.read };
          if (idx >= 0) {
            copy.splice(idx, 1);
            copy.unshift(summary);
          } else {
            copy.unshift(summary);
          }
          return copy;
        });

        const partnerId = String(m.from) === String(current?.id) ? String(m.to) : String(m.from);
        if (selected && selected === partnerId) {
          setMessages((prev) => [...prev, { id: m.id, from: m.from, to: m.to, text: m.text, createdAt: m.createdAt, read: m.read }]);
          // auto-mark incoming as read
          if (String(m.from) !== String(current?.id) && !m.read) {
            markMessageRead(m.id).catch(() => {});
          }
        }
      });
    } catch {
      // ignore socket errors
    }

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const openConversation = async (partnerId: string) => {
    setSelected(partnerId);
    try {
      const msgs = await getConversation(partnerId);
      setMessages(msgs || []);
      // try to infer partner name from populated messages and update conversations
      if (msgs && msgs.length) {
        const sample = msgs.find((m: any) => (m.from && (m.from.name || m.from.email)) || (m.to && (m.to.name || m.to.email)));
        if (sample) {
          const partnerObj = String(sample.from) === String(current?.id) ? sample.to : sample.from;
          const inferredName = partnerObj?.name || partnerObj?.email || null;
          if (inferredName) {
            setConversations((prev) => prev.map((c) => (String(c.partnerId) === String(partnerId) ? { ...c, partnerName: inferredName } : c)));
          }
        }
      }
      // mark unread messages as read
      msgs.forEach((m: any) => {
        if (m.from && String(m.from) !== String(current?.id) && !m.read) {
          markMessageRead(m.id).catch(() => {});
        }
      });
    } catch {
      setMessages([]);
    }
  };

  // Helper to compute deterministic room name for two users
  const roomFor = (a: string, b: string) => {
    const sorted = [String(a), String(b)].sort();
    return `chat:${sorted[0]}:${sorted[1]}`;
  };

  // join a conversation room after opening
  useEffect(() => {
    if (!selected || !current) return;
    try {
      const socket = socketRef.current;
      if (!socket) return;
      const room = roomFor(current.id || current?.id || current?.token?.sub || '', selected);
      socket.emit('joinRoom', room);
    } catch (e) {
      // ignore
    }
  }, [selected, current]);

  // Listen for global `openChat` events (dispatched by dashboards) and open the conversation.
  // Use a ref to call the latest `openConversation` implementation safely from the event handler.
  const openConversationRef = React.useRef(openConversation);
  useEffect(() => {
    openConversationRef.current = openConversation;
  }, [openConversation]);

  useEffect(() => {
    const handler = (e: any) => {
      const otherId = e?.detail?.otherId;
      const partnerName = e?.detail?.partnerName;
      if (!otherId) return;

      setConversations((prev) => {
        const exists = prev.find((c) => String(c.partnerId) === String(otherId));
        if (exists) return prev;
        const summary = { partnerId: otherId, partnerName: partnerName || otherId, partnerEmail: '', lastMessage: '', lastAt: '', unread: false };
        return [summary, ...prev];
      });

      // open conversation (use ref to ensure stable reference)
      if (openConversationRef.current) openConversationRef.current(otherId);
    };

    window.addEventListener('openChat', handler as EventListener);
    return () => window.removeEventListener('openChat', handler as EventListener);
  }, []);

  const filtered = useMemo(() => {
    const q = String(query || '').toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => String(c.partnerName || c.partnerId).toLowerCase().includes(q) || String(c.lastMessage || '').toLowerCase().includes(q));
  }, [conversations, query]);

  // Resolve a partner id to a human-friendly name using available sources
  const resolveName = (partnerId: string) => {
    if (!partnerId) return partnerId;
    const conv = conversations.find((c) => String(c.partnerId) === String(partnerId));
    if (conv && conv.partnerName) return conv.partnerName;
    const mentee = mentees.find((m) => String(m.id) === String(partnerId));
    if (mentee) return mentee.name || mentee.email || partnerId;
    const sample = messages.find((m) => String(m.from) === String(partnerId) || String(m.to) === String(partnerId));
    if (sample) {
      const partnerObj = String(sample.from) === String(current?.id) ? sample.to : sample.from;
      return (partnerObj && (partnerObj.name || partnerObj.email)) || partnerId;
    }
    return partnerId;
  };

  const handleSend = async () => {
    if (!text.trim() || !selected) return;
    try {
      const m = await sendMessage(selected, text.trim());
      setMessages((prev) => [...prev, { id: m.id, from: m.from || current?.id, to: m.to, text: m.text, createdAt: m.createdAt, read: m.read }]);
      setText('');
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    if (!selected) return;
    try {
      const msgs = await getConversation(selected);
      await Promise.all(msgs.filter((m: any) => String(m.to) === String(current?.id) && !m.read).map((m: any) => markMessageRead(m.id)));
      // refresh
      const refreshed = await getConversation(selected);
      setMessages(refreshed || []);
      setConversations((prev) => prev.map((c) => (c.partnerId === selected ? { ...c, unread: false } : c)));
    } catch {}
  };

  const toggleMessageRead = async (messageId: string, unread: boolean) => {
    try {
      if (unread) await markMessageRead(messageId);
      else await markMessageUnread(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: unread } : m)));
    } catch {}
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6">
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search messages..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 ring-primary outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <div key={c.partnerId} onClick={() => openConversation(c.partnerId)} className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selected === c.partnerId ? 'bg-primary/5 border-r-2 border-primary' : ''}`}>
              <div className="relative">
                <img src={`https://picsum.photos/seed/${encodeURIComponent(c.partnerName || c.partnerId)}/100/100`} className="size-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                {c.unread && <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="text-sm font-bold truncate">{c.partnerName || resolveName(c.partnerId)}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(c.lastAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-4 text-xs text-slate-400">No conversations.</div>}
        </div>
      </Card>

      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selected ? (
              <>
                <img src={`https://picsum.photos/seed/${encodeURIComponent(resolveName(selected || ''))}/100/100`} className="size-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-sm font-bold">{resolveName(selected || '')}</h4>
                  <p className="text-[10px] text-slate-400">Conversation</p>
                </div>
              </>
            ) : (
              <h3 className="font-bold">Select a conversation</h3>
            )}
          </div>
          <div className="flex gap-2">
            {selected && <Button size="sm" variant="outline" onClick={markAllRead}>Mark all read</Button>}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/20">
          {!selected && <div className="text-sm text-slate-500">Choose a conversation to view messages.</div>}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 max-w-[70%] ${String(m.from) === String(current?.id) ? 'ml-auto flex-row-reverse' : ''}`}>
              <img src={`https://picsum.photos/seed/${encodeURIComponent(String(m.from || m.id))}/100/100`} className="size-8 rounded-full object-cover self-end" alt="" referrerPolicy="no-referrer" />
              <div>
                <div className={`p-4 rounded-2xl ${String(m.from) === String(current?.id) ? 'bg-primary text-slate-900' : 'bg-white dark:bg-slate-800'} shadow-sm border border-slate-100 dark:border-slate-700/50`}> 
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">{new Date(m.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {String(m.from) !== String(current?.id) && (
                    <button className="underline" onClick={() => toggleMessageRead(m.id, true)}>Mark read</button>
                  )}
                  {String(m.from) === String(current?.id) && (
                    <button className="underline" onClick={() => toggleMessageRead(m.id, !m.read)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
            <input value={text} onChange={(e) => setText(e.target.value)} type="text" placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2" />
            <Button size="sm" icon="send" onClick={handleSend} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessagesPage;
