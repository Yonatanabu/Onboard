import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from './UI';
import { getUserConversations, getCurrentUser, getMentorEmployees, getBuddyInfo } from '../services/mockApi.ts';
import { io } from 'socket.io-client';

export const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Array<any>>([]);
  const [mentees, setMentees] = useState<Array<any>>([]);
  const current = getCurrentUser();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const conv = await getUserConversations();
        if (!mounted) return;

        // if current user is employee, ensure their mentor/buddy appears on top
        if (String(current?.role || '').toLowerCase() === 'employee') {
          try {
            const buddy = await getBuddyInfo(current?.buddyId || null);
            if (mounted) {
              const normalized = conv || [];
              // avoid duplicate partner entries
              const exists = normalized.find((c: any) => String(c.partnerId) === String(buddy?.id));
              const list = exists ? normalized : [{ partnerId: buddy?.id, partnerName: buddy?.name || 'Mentor', partnerEmail: buddy?.email || '', lastMessage: '', lastAt: '', unread: false }, ...normalized];
              setConversations(list);
            }
            return;
          } catch {
            // fallback to just conversations
          }
        }

        if (mounted) setConversations(conv || []);
      } catch {
        if (mounted) setConversations([]);
      }
    })();

    // if mentor, also load assigned mentees and show them in the left list
    (async () => {
      try {
        if (String(current?.role || '').toLowerCase() === 'mentor') {
          const list = await getMentorEmployees(current.id);
          console.debug('Fetched mentees for mentor', current?.id, list);
          if (!mounted) return;
          setMentees(list || []);
        }
      } catch {
        if (mounted) setMentees([]);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // subscribe to socket events so mentors see newly assigned mentees in real time
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      const wsRoot = (import.meta as any).env?.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
      const socket = io(wsRoot, { auth: { token: currentUser?.token } });
      socket.on('connect', () => socket.emit('join', currentUser?.id));
      socket.on('menteeAssigned', (payload: any) => {
        console.debug('socket menteeAssigned', payload);
        if (String(currentUser.role || '').toLowerCase() === 'mentor') {
          // refresh mentee list
          getMentorEmployees(currentUser.id).then((list) => {
            console.debug('Refreshed mentees after event', list);
            setMentees(list || []);
          }).catch((e) => { console.debug('Failed to refresh mentees', e); });
        }
      });

      return () => { socket.disconnect(); };
    } catch {
      // ignore socket errors
    }
  }, []);

  const openChat = (partnerId: string) => {
    // include partnerName when available so MessagesPage can show username instead of id
    const partner = mentees.find((m) => String(m.id) === String(partnerId)) || null;
    window.dispatchEvent(new CustomEvent('openChat', { detail: { otherId: partnerId, partnerName: partner?.name || undefined } }));
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold">Messages</h4>
        <Button size="sm" variant="outline" onClick={() => window.location.href = `/${String(current?.role || 'employee')}/messages`}>View all</Button>
      </div>
      <div className="space-y-2">
        {String(current?.role || '').toLowerCase() === 'mentor' && (
          // show all assigned mentees for mentors
          mentees.length ? (
            mentees.map((m: any) => (
              <button key={m.id} onClick={() => openChat(m.id)} className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || m.id)}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="text-sm font-semibold">{m.name || m.id}</div>
                    <div className="text-xs text-slate-400 truncate">{m.position || m.role || ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2" />
              </button>
            ))
          ) : (
            <div className="text-xs text-slate-400">No assigned mentees.</div>
          )
        )}

        {/* show recent conversations for everyone (below mentees for mentors) */}
        {conversations.length ? (
          conversations.map((c) => (
            <button key={c.partnerId} onClick={() => openChat(c.partnerId)} className="w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.partnerName || c.partnerId)}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
                <div>
                  <div className="text-sm font-semibold">{c.partnerName || c.partnerId}</div>
                  <div className="text-xs text-slate-400 truncate">{c.lastMessage}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.unread && <Badge variant="danger">New</Badge>}
              </div>
            </button>
          ))
        ) : (
          <div className="text-xs text-slate-400">No recent messages.</div>
        )}
      </div>
        {conversations.length === 0 && <div className="text-xs text-slate-400">No recent messages.</div>}
      </div>
    </Card>
  );
};

export default Messages;

