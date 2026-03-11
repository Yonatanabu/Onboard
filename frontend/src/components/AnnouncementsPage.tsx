import React, { useEffect, useState } from 'react';
import { Card, Button } from './UI';
import { getAnnouncementsFeed, getAllAnnouncements, deleteAnnouncement, markAnnouncementRead, markAnnouncementUnread, getCurrentUser } from '../services/mockApi.ts';

export const AnnouncementsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    const current = getCurrentUser();
    const adminFlag = String(current?.role || '').toLowerCase() === 'admin';
    setIsAdminView(adminFlag);
    load(adminFlag).catch(() => {});
  }, []);

  const load = async (isAdminOverride?: boolean) => {
    const useAdmin = typeof isAdminOverride === 'boolean' ? isAdminOverride : isAdminView;
    if (useAdmin) {
      const all = await getAllAnnouncements();
      setItems(all);
      return;
    }

    const feed = await getAnnouncementsFeed();
    setItems(feed);
  };

  const applyFilter = () => {
    let filtered = items;
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      filtered = filtered.filter((a) => new Date(a.createdAt).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      filtered = filtered.filter((a) => new Date(a.createdAt).getTime() <= to + 24 * 60 * 60 * 1000 - 1);
    }
    return filtered;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await deleteAnnouncement(id);
    await load();
    window.dispatchEvent(new CustomEvent('announcementsUpdated'));
  };

  const handleMarkRead = async (id: string) => {
    await markAnnouncementRead(id);
    await load();
    window.dispatchEvent(new CustomEvent('announcementsUpdated'));
  };

  const handleMarkUnread = async (id: string) => {
    await markAnnouncementUnread(id);
    await load();
    window.dispatchEvent(new CustomEvent('announcementsUpdated'));
  };

  const rows = applyFilter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded px-3 border" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded px-3 border" />
          <Button variant="outline" onClick={() => { setFromDate(''); setToDate(''); }}>Reset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.map((a) => (
          <Card key={a.id || a._id} className={`p-4 ${a.read ? '' : 'border border-primary/40'}`}>
            <div className="flex justify-between">
              <div>
                {a.title && <div className="font-bold mb-1">{a.title}</div>}
                <div className="text-sm text-slate-700 dark:text-slate-200">{a.message || a.body}</div>
                <div className="text-xs text-slate-400 mt-2">{a.department ? `${a.department}` : ''} • {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
              </div>
              <div className="flex flex-col gap-2">
                {!a.read ? (
                  <Button size="sm" onClick={() => handleMarkRead(a._id || a.id)}>Mark read</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleMarkUnread(a._id || a.id)}>Mark unread</Button>
                )}
                {isAdminView && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(a._id || a.id)}>Delete</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-4">No announcements found for selected date range.</Card>}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
