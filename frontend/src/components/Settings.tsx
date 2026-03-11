import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from './UI';
import { getCurrentUser, updateEmployeeSettings } from '../services/mockApi.ts';

export const Settings: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('Employee');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      return;
    }

    setUserId(current.id);
    setName(current.name || '');
    setEmail(current.email || '');
    setPosition(current.position || 'Employee');
  }, []);

  const saveChanges = async () => {
    if (!userId) {
      return;
    }

    try {
      await updateEmployeeSettings(userId, { name, email });
      setSaved('Profile updated successfully.');
    } catch (error) {
      setSaved(error instanceof Error ? error.message : 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your profile information.</p>
      </div>

      <Card className="p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" className="size-24 rounded-2xl object-cover border-4 border-slate-100 dark:border-slate-800 shadow-xl" alt="Profile" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{name || 'User'}</h4>
              <p className="text-sm text-slate-500 mb-2">{position}</p>
              <div className="flex gap-2">
                <Badge variant="info">Profile</Badge>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Title</label>
              <input type="text" value={position} readOnly className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none transition-all" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSaved('')}>Cancel</Button>
            <Button onClick={saveChanges}>Save Changes</Button>
          </div>
          {saved && <p className="text-sm text-slate-500">{saved}</p>}
        </div>
      </Card>
    </div>
  );
};
