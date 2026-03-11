import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button } from './UI';
import { getAllUsers, getAllLessons } from '../services/mockApi.ts';

export const Reports: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // compute progress per user
  useEffect(() => {
    const load = async () => {
      const [allUsers, allLessons] = await Promise.all([getAllUsers(), getAllLessons()]);
      setLessons(allLessons);

      const computed = allUsers.map((user: any, index: number) => {
        const completedSet = new Set((user.completedLessons || []).map((id: string) => String(id)));
        const total = allLessons.filter(
          (lesson: any) =>
            String(lesson.position || '').toLowerCase() === String(user.position || '').toLowerCase() ||
            String(lesson.position || '').toLowerCase() === 'all',
        ).length;
        const completed = allLessons.filter(
          (lesson: any) =>
            (String(lesson.position || '').toLowerCase() === String(user.position || '').toLowerCase() ||
              String(lesson.position || '').toLowerCase() === 'all') &&
            completedSet.has(String(lesson.id)),
        ).length;
        const progressPercent = total ? Math.round((completed / total) * 100) : 0;
        return { ...user, progress: progressPercent };
      });

      setUsers(computed);
    };
    load();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => set.add(String(u.department || '')));
    return Array.from(set).filter((d) => d).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (departmentFilter === 'All') return users;
    return users.filter((u) => String(u.department || '').toLowerCase() === departmentFilter.toLowerCase());
  }, [users, departmentFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Analytics & Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Deep dive into onboarding performance and organizational health.</p>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Department:</span>
        <Button variant={departmentFilter === 'All' ? 'primary' : 'outline'} size="sm" onClick={() => setDepartmentFilter('All')}>All</Button>
        {departments.map((d) => (
          <Button
            key={d}
            variant={departmentFilter.toLowerCase() === d.toLowerCase() ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDepartmentFilter(d)}
          >
            {d}
          </Button>
        ))}
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{u.department || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${u.progress}%` }} />
                    </div>
                    <span className="text-xs ml-2">{u.progress}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
