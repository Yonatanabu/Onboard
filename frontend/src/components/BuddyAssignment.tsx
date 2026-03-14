import React, { useMemo, useState } from 'react';
import { Button, Card, Badge } from './UI';
import { assignMentor, getAllUsers } from '../services/mockApi.ts';
import { useToast } from './Toast.tsx';

type UserItem = {
  id: string;
  name: string;
  role: string;
  email: string;
  position?: string;
  department?: string;
  buddyId?: string | null;
  createdAt?: string;
};

const avatarFor = (id: string) => `https://picsum.photos/seed/${id}/120/120`;

export const BuddyAssignment: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const { showToast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedBuddyId, setSelectedBuddyId] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'All' | 'Engineering' | 'Design' | 'Marketing' | 'HR & Ops'>('All');
  const [onlyNext14Days, setOnlyNext14Days] = useState(false);
  const [showPastAssignments, setShowPastAssignments] = useState(false);

  const refreshUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  React.useEffect(() => {
    refreshUsers().catch(() => undefined);
  }, []);

  const now = Date.now();
  const withinNext14Days = (value?: string) => {
    if (!value) {
      return true;
    }
    const diff = new Date(value).getTime() - now;
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 14;
  };

  // filter based on the raw department string (frontend, backend, etc.)
  const matchesDepartment = (dept?: string) => {
    if (departmentFilter === 'All') {
      return true;
    }

    const normalized = String(dept || '').toLowerCase();
    if (departmentFilter === 'Design') {
      return normalized === 'design';
    }
    if (departmentFilter === 'Engineering') {
      return normalized === 'frontend' || normalized === 'backend' || normalized === 'mobile' || normalized === 'qa';
    }
    if (departmentFilter === 'Marketing') {
      return normalized === 'marketing';
    }
    if (departmentFilter === 'HR & Ops') {
      return normalized === 'sales' || normalized === 'operations' || normalized === 'hr';
    }

    return true;
  };

  const unassignedEmployees = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.role || '').toLowerCase() === 'employee' &&
          !user.buddyId &&
          matchesDepartment(user.department) &&
          (!onlyNext14Days || withinNext14Days(user.createdAt)),
      ),
    [users, departmentFilter, onlyNext14Days],
  );

  const assignedEmployees = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.role || '').toLowerCase() === 'employee' &&
          !!user.buddyId &&
          matchesDepartment(user.department) &&
          (!onlyNext14Days || withinNext14Days(user.createdAt)),
      ),
    [users, departmentFilter, onlyNext14Days],
  );

  const leftPanelEmployees = showPastAssignments ? assignedEmployees : unassignedEmployees;

  const selectedEmployee = leftPanelEmployees.find((user) => user.id === selectedEmployeeId) || null;

  const mentors = useMemo(
    () =>
      users.filter(
        (user) =>
          String(user.role || '').toLowerCase() === 'mentor' &&
          matchesDepartment(user.department) &&
          (!onlyNext14Days || withinNext14Days(user.createdAt)) &&
          (!selectedEmployee || !selectedEmployee.department || String(user.department || '').toLowerCase() === String(selectedEmployee.department || '').toLowerCase()),
      ),
    [users, departmentFilter, onlyNext14Days, selectedEmployee],
  );

  const activeCount = (mentorId: string) => users.filter((user) => String(user.role || '').toLowerCase() === 'employee' && user.buddyId === mentorId).length;

  const selectedBuddy = mentors.find((user) => user.id === selectedBuddyId) || null;
  const showDraftAssignment = Boolean(selectedEmployee || selectedBuddy);

  const confirmAssignment = async () => {
    if (!selectedEmployee || !selectedBuddy) {
      showToast('Select both an employee and a mentor first.', 'error');
      return;
    }

    if (selectedEmployee.department && selectedBuddy.department && selectedEmployee.department !== selectedBuddy.department) {
      // mismatched departments prevented
      showToast('Employee and mentor must be in the same department to pair.', 'error');
      return;
    }

    try {
      await assignMentor(selectedEmployee.id, selectedBuddy.id);
      setSelectedEmployeeId('');
      setSelectedBuddyId('');
      await refreshUsers();
      showToast('Mentor assigned successfully.', 'success');
      // notify any open mentor dashboards about the new pairing
      window.dispatchEvent(new CustomEvent('menteeAssigned', { detail: { mentorId: selectedBuddy.id } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign mentor';
      showToast(message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-slate-100 text-4xl font-black leading-tight tracking-tight">Buddy Assignment</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal max-w-2xl">Connect incoming talent with seasoned mentors. Use the AI matching suggestions for optimal cultural and professional fit.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon="history" onClick={() => setShowPastAssignments((previous) => !previous)}>{showPastAssignments ? 'Unassigned View' : 'Past Assignments'}</Button>
          <Button icon="check_circle" onClick={confirmAssignment}>Confirm All Pairings</Button>
        </div>
      </div>

      <div className="flex gap-4 mb-2 overflow-x-auto pb-2">
        <Button variant="outline" size="sm" icon="filter_alt" className={departmentFilter === 'Engineering' ? 'bg-primary/20 border-primary/30 text-slate-900 dark:text-primary' : ''} onClick={() => setDepartmentFilter('Engineering')}>Engineering</Button>
        <Button variant="outline" size="sm" className={departmentFilter === 'Design' ? 'bg-primary/20 border-primary/30 text-slate-900 dark:text-primary' : ''} onClick={() => setDepartmentFilter('Design')}>Design</Button>
        <Button variant="outline" size="sm" className={departmentFilter === 'Marketing' ? 'bg-primary/20 border-primary/30 text-slate-900 dark:text-primary' : ''} onClick={() => setDepartmentFilter('Marketing')}>Marketing</Button>
        <Button variant="outline" size="sm" className={departmentFilter === 'HR & Ops' ? 'bg-primary/20 border-primary/30 text-slate-900 dark:text-primary' : ''} onClick={() => setDepartmentFilter('HR & Ops')}>HR & Ops</Button>
        <Button variant="outline" size="sm" onClick={() => setDepartmentFilter('All')}>All</Button>
        <div className="h-10 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
        <Button variant="outline" size="sm" icon="calendar_today" className={onlyNext14Days ? 'bg-primary/20 border-primary/30 text-slate-900 dark:text-primary' : ''} onClick={() => setOnlyNext14Days((previous) => !previous)}>Next 14 Days</Button>
      </div>

      <div className="grid grid-cols-12 gap-6 min-h-150">
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{showPastAssignments ? `Past Assignments (${assignedEmployees.length})` : `Unassigned New Hires (${unassignedEmployees.length})`}</h3>
            <Badge variant="warning">Urgent</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {leftPanelEmployees.map((mentee) => (
              <button
                key={mentee.id}
                onClick={() => setSelectedEmployeeId(mentee.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer group bg-white dark:bg-slate-800/30 ${selectedEmployeeId === mentee.id
                    ? 'border-primary'
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <img src={avatarFor(mentee.id)} className="size-10 rounded-full object-cover" alt={mentee.name} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{mentee.name}</h4>
                    <p className="text-xs text-slate-500">{mentee.position || mentee.role}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">Today</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="info">React</Badge>
                    <Badge variant="info">London</Badge>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden">
          <div className="p-8 flex flex-col items-center justify-center text-center h-full gap-4">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary">touch_app</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">Drop Hire here to Assign</h3>
            <p className="text-sm text-slate-500 max-w-60">Select a hire from the left and drop them onto an available buddy on the right.</p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Available Buddies ({mentors.length})</h3>
            <button className="text-primary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm mr-1">sort</span>
              Availability
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mentors.map((buddy) => {
              const activeMentees = activeCount(buddy.id);
              const maxMentees = 3;
              return (
                <button
                  key={buddy.id}
                  onClick={() => setSelectedBuddyId(buddy.id)}
                  className={`w-full text-left p-4 rounded-xl border bg-white dark:bg-slate-800 transition-all hover:shadow-md border-l-4 ${selectedBuddyId === buddy.id
                      ? 'border-primary border-l-primary'
                      : activeMentees < maxMentees
                        ? 'border-slate-200 dark:border-slate-800 border-l-primary'
                        : 'border-slate-200 dark:border-slate-800 border-l-slate-300 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={avatarFor(buddy.id)} className="size-12 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" alt={buddy.name} />
                      <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{buddy.name}</h4>
                        <span className={`text-[10px] font-bold ${activeMentees >= maxMentees ? 'text-slate-400' : 'text-primary'}`}>
                          {activeMentees}/{maxMentees} Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{buddy.position || buddy.role} • 4.8 <span className="material-symbols-outlined text-[10px] align-middle">star</span></p>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(activeMentees / maxMentees) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex flex-wrap gap-2">
                    <Badge variant="info">Mentor</Badge>
                    <Badge variant="info">Available</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showDraftAssignment && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3 overflow-hidden">
                <div className="inline-block h-12 w-12 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 overflow-hidden">
                  <img src={selectedBuddy ? avatarFor(selectedBuddy.id) : avatarFor('mentor-default')} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="inline-block h-12 w-12 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 overflow-hidden">
                  <img src={selectedEmployee ? avatarFor(selectedEmployee.id) : avatarFor('employee-default')} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Draft Assignment: {selectedBuddy?.name || 'Select buddy'} + {selectedEmployee?.name || 'Select hire'}</h4>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setSelectedEmployeeId(''); setSelectedBuddyId(''); }}>Discard</Button>
              <Button size="lg" onClick={confirmAssignment}>Confirm Assignment</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
