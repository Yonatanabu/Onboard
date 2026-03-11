import React, { useEffect, useRef, useState } from 'react';
import { Card, Button } from './UI';
import { getConversation, sendMessage, getCurrentUser, markMessageRead } from '../services/mockApi.ts';
import { io } from 'socket.io-client';

type Props = {
  otherId: string | null;
  open: boolean;
  onClose: () => void;
};

export const ChatWidget: React.FC<Props> = ({ otherId, open, onClose }) => {
  const [messages, setMessages] = useState<Array<any>>([]);
  const [text, setText] = useState('');
  const socketRef = useRef<any>(null);
  const current = getCurrentUser();

  useEffect(() => {
    if (!open || !otherId) return;
    let mounted = true;

    const load = async () => {
      try {
        const data = await getConversation(otherId);
        if (!mounted) return;
        setMessages(data || []);
        // mark messages from other as read
        data.forEach((m: any) => {
          if (m.from && String(m.from) !== String(current?.id) && !m.read) {
            markMessageRead(m.id).catch(() => {});
          }
        });
      } catch {
        if (mounted) setMessages([]);
      }
    };

    load();

    // connect socket
    try {
      const wsRoot = (import.meta as any).env?.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
      const socket = io(wsRoot, { auth: { token: current?.token } });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('join', current?.id);
      });

      socket.on('message', (m: any) => {
        // ignore messages not part of this conversation
        const partnerId = String(m.from) === String(current?.id) ? String(m.to) : String(m.from);
        if (partnerId !== String(otherId)) return;
        setMessages((prev) => [...prev, { id: m.id, from: m.from, to: m.to, text: m.text, createdAt: m.createdAt, read: m.read }]);
      });
    } catch (e) {
      // socket failed, fall back to polling already handled by load
    }

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [open, otherId]);

  const handleSend = async () => {
    if (!text.trim() || !otherId) return;
    try {
      const msg = await sendMessage(otherId, text.trim());
      setMessages((m) => [...m, { id: msg.id, from: msg.from || current?.id, to: msg.to, text: msg.text, createdAt: msg.createdAt, read: msg.read }]);
      setText('');
    } catch {
      // ignore send errors for now
    }
  };

  if (!open || !otherId) return null;

  // group consecutive messages by sender for compact UI
  const groups: Array<{ from: any; items: any[] }> = [];
  messages.forEach((m) => {
    const last = groups[groups.length - 1];
    if (!last || String(last.from) !== String(m.from)) {
      groups.push({ from: m.from, items: [m] });
    } else {
      last.items.push(m);
    }
  });

  return (
    <div className="fixed right-6 bottom-6 w-96 z-50">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold">Chat</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-3 max-h-64 overflow-auto space-y-3 bg-white dark:bg-slate-900">
          {groups.map((g, i) => (
            <div key={`g-${i}`} className={`flex ${String(g.from) === String(current?.id) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%]`}> 
                <div className="flex items-end gap-2">
                  {String(g.from) !== String(current?.id) && (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(String(g.from || 'User'))}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
                  )}
                  <div>
                    {g.items.map((m) => (
                      <div key={m.id} className={`rounded-xl px-3 py-2 mb-1 text-sm ${String(m.from) === String(current?.id) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'}`}>
                        <div>{m.text}</div>
                        <div className="text-[10px] text-slate-400 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-xs text-slate-400">No messages yet.</div>}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..." className="flex-1 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-sm focus:outline-none" />
            <Button onClick={handleSend} size="sm">Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatWidget;
