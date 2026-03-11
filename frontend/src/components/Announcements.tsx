import React, { useEffect, useState } from 'react';
import { Card, Button } from './UI';
import { getAnnouncementsFeed, markAnnouncementRead, markAnnouncementUnread, getCurrentUser } from '../services/mockApi.ts';
import { useNavigate } from 'react-router-dom';

export const Announcements: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Array<{ id: string; title?: string; message: string; createdAt?: string; createdBy?: any }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAnnouncementsFeed();
        if (!mounted) return;
        setItems(data || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!items.length) {
    return (
      <Card className="p-4">
        <h4 className="text-sm font-bold mb-2">Announcements</h4>
        <p className="text-xs text-slate-500">No announcements at this time.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4 className="text-sm font-bold mb-3">Announcements</h4>
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {items.map((a) => (
          <div key={a.id || a._id} className={`rounded-lg p-3 ${a.read ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700'}`}>
            <div className="flex justify-between items-start">
              <div>
                {a.title && <div className="text-sm font-semibold mb-1">{a.title}</div>}
                <div className="text-xs text-slate-700 dark:text-slate-200">{a.message}</div>
                <div className="text-[10px] text-slate-400 mt-2">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
              </div>
              <div className="ml-3">
                {!a.read ? (
                  <Button size="sm" onClick={async () => {
                    await markAnnouncementRead(a._id || a.id);
                    const refreshed = await getAnnouncementsFeed();
                    setItems(refreshed || []);
                    window.dispatchEvent(new CustomEvent('announcementsUpdated'));
                  }}>Mark read</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={async () => {
                    await markAnnouncementUnread(a._id || a.id);
                    const refreshed = await getAnnouncementsFeed();
                    setItems(refreshed || []);
                    window.dispatchEvent(new CustomEvent('announcementsUpdated'));
                  }}>Mark unread</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={async () => setItems(await getAnnouncementsFeed())}>Refresh</Button>
        <div>
          <Button variant="outline" size="sm" onClick={() => {
            const current = getCurrentUser();
            const role = String(current?.role || 'employee').toLowerCase();
            navigate(`/${role}/announcements`);
          }}>View all</Button>
        </div>
      </div>
    </Card>
  );
};

export default Announcements;
