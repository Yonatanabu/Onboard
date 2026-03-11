import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Badge } from './UI';
import { useNavigate } from 'react-router-dom';
import { approveSignupRequest, createAnnouncement, createUser as createUserApi, deleteUser, getAllLessons, getAllUsers, getPendingApprovalRequests, rejectSignupRequest } from '../services/mockApi.ts';
import { useToast } from './Toast.tsx';

type AdminUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  registrationDate: string;
  verificationStatus: 'Approved' | 'Pending' | 'Rejected';
  progress: number;
  approved?: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  position?: string;
  buddyId?: string;
};

type PanelMode = 'none' | 'create-user' | 'announcement';

const randomAvatar = (seed: number) => `https://picsum.photos/seed/onboard-user-${seed}/120/120`;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [lessons, setLessons] = useState<Array<{ id: string; title: string; description: string; position: string; createdBy?: string; status?: string }>>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>('none');
  const [statusMessage, setStatusMessage] = useState('');
  const { showToast } = useToast();
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [newUserPosition, setNewUserPosition] = useState('Product Designer');

  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementDepartment, setAnnouncementDepartment] = useState('all');
  const [announceToMentors, setAnnounceToMentors] = useState(true);
  const [announceToEmployees, setAnnounceToEmployees] = useState(true);

  const refreshData = async () => {
    const [allUsers, allLessons, approvalRequests] = await Promise.all([
      getAllUsers(),
      getAllLessons(),
      getPendingApprovalRequests(),
    ]);

    const usersWithDisplay: AdminUser[] = allUsers.map((user, index) => {
      const normalizedStatus = String(user.approvalStatus || (user.approved ? 'approved' : 'pending')).toLowerCase();
      const mappedStatus: 'approved' | 'pending' | 'rejected' =
        normalizedStatus === 'approved' || normalizedStatus === 'rejected' ? normalizedStatus : 'pending';
      const completedSet = new Set((user.completedLessons || []).map((id) => String(id)));
      const total = allLessons.filter(
        (lesson) =>
          String(lesson.position || '').toLowerCase() === String(user.position || '').toLowerCase() ||
          String(lesson.position || '').toLowerCase() === 'all',
      ).length;
      const completed = allLessons.filter(
        (lesson) =>
          (String(lesson.position || '').toLowerCase() === String(user.position || '').toLowerCase() ||
            String(lesson.position || '').toLowerCase() === 'all') &&
          completedSet.has(String(lesson.id)),
      ).length;
      const progressPercent = total ? Math.round((completed / total) * 100) : 0;
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        avatar: randomAvatar(index + 1),
        registrationDate: mappedStatus === 'approved' && user.approvedAt
          ? new Date(user.approvedAt).toLocaleDateString()
          : 'Not approved yet',
        verificationStatus: mappedStatus === 'approved' ? 'Approved' : mappedStatus === 'rejected' ? 'Rejected' : 'Pending',
        progress: progressPercent,
        approved: user.approved,
        approvalStatus: mappedStatus,
        position: user.position,
        buddyId: user.buddyId || undefined,
      };
    });

    setUsers(usersWithDisplay);
    setLessons(allLessons);
    setPendingApprovals(approvalRequests.length);
  };

  const activeNewHires = users.filter((user) => user.progress < 100).length;
  const completionRate = useMemo(() => {
    if (!users.length) {
      return 0;
    }
    return Math.round(users.reduce((sum, user) => sum + user.progress, 0) / users.length);
  }, [users]);

  const completedUsers = users.filter((user) => user.progress >= 80).length;
  const verifiedUsers = users.filter((user) => user.verificationStatus === 'Approved').length;
  const filteredUsers = useMemo(
    () => (statusFilter === 'all' ? users : users.filter((user) => user.approvalStatus === statusFilter)),
    [users, statusFilter],
  );

  const lessonCompletionDelta = completionRate >= 80 ? '+1.8%' : '-2.4%';

  useEffect(() => {
    refreshData().catch(() => setStatusMessage('Failed to load admin data.'));
  }, []);

  const togglePanel = (mode: PanelMode) => {
    setPanelMode((previous) => (previous === mode ? 'none' : mode));
  };

  const createUserAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserRole.trim()) {
      setStatusMessage('Please fill in name, email, and role to create a user.');
      return;
    }

    const normalizedRole = newUserRole.trim().toLowerCase();
    try {
      await createUserApi({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: normalizedRole,
        position: normalizedRole === 'mentor' ? 'Mentor' : newUserPosition,
        buddyId: null,
      });
      await refreshData();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create user.');
      return;
    }

    const msg = `User account created for ${newUserName.trim()}.`;
    setStatusMessage(msg);
    showToast(msg, 'success');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('employee');
    setNewUserPosition('Product Designer');
  };

  const publishAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!announcementTitle.trim() || !announcementText.trim()) {
      setStatusMessage('Title and message are required to publish an announcement.');
      return;
    }

    const targets: string[] = [];
    if (announceToMentors) targets.push('mentor');
    if (announceToEmployees) targets.push('employee');
    if (!targets.length) targets.push('all');

    try {
      await createAnnouncement(announcementTitle.trim(), announcementText.trim(), announcementDepartment === 'all' ? null : announcementDepartment, targets);
      const msg = `Announcement published to ${announcementDepartment === 'all' ? 'all departments' : announcementDepartment}.`;
      setStatusMessage(msg);
      showToast(msg, 'success');
      setAnnouncementTitle('');
      setAnnouncementText('');
      setAnnouncementDepartment('all');
      setAnnounceToMentors(true);
      setAnnounceToEmployees(true);
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish announcement';
      setStatusMessage(message);
      showToast(message, 'error');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      await refreshData();
      const msg = 'User deleted successfully.';
      setStatusMessage(msg);
      showToast(msg, 'success');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete user.');
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await approveSignupRequest(userId);
      await refreshData();
      const msg = 'User approved. They can now sign in with their password.';
      setStatusMessage(msg);
      showToast(msg, 'success');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to approve user.');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await rejectSignupRequest(userId);
      await refreshData();
      const msg = 'User rejected successfully.';
      setStatusMessage(msg);
      showToast(msg, 'success');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to reject user.');
    }
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      users: users.map((user) => ({
        name: user.name,
        role: user.role,
        progress: user.progress,
        completionStatus: user.progress >= 80 ? 'Completed' : 'In Progress',
      })),
      lessons: lessons.length,
    };

    const fileContent = JSON.stringify(report, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'onboarding-report.json';
    link.click();
    URL.revokeObjectURL(url);

    const msg = 'Report exported as onboarding-report.json.';
    setStatusMessage(msg);
    showToast(msg, 'success');
  };

  const buddyNameFor = (role: string, buddyId?: string) => {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole !== 'employee') {
      return 'Not required';
    }
    return users.find((buddy) => buddy.id === buddyId)?.name ?? 'Unassigned';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Onboarding Overview</h2>
        <p className="text-slate-500 dark:text-slate-400">Track company-wide onboarding health and resource management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active New Hires</span>
            <Badge variant="success">+{Math.max(1, activeNewHires)}%</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{activeNewHires}</div>
          <p className="text-xs text-slate-400 mt-2 font-medium">{verifiedUsers} verified users in current cohort</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lesson Completion</span>
            <Badge variant={completionRate >= 80 ? 'success' : 'danger'}>{lessonCompletionDelta}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{completionRate}%</div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Target: 85% completion</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Employees Completed</span>
            <Badge variant="success">{completedUsers}/{users.length}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{completedUsers}</div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Reached ≥80% lesson progress</p>
        </Card>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button icon="menu_book" onClick={() => navigate('/admin/resources')}>Go to Lessons</Button>
          <Button variant="dark" icon="campaign" onClick={() => togglePanel('announcement')}>Write Announcement</Button>
          <Button variant="outline" icon="badge" onClick={() => togglePanel('create-user')}>Create User Account</Button>
          <Button variant="outline" icon="file_download" onClick={exportReport}>Export Report</Button>
        </div>

        {statusMessage && <p className="text-sm text-slate-500 dark:text-slate-400">{statusMessage}</p>}

        {panelMode === 'create-user' && (
          <Card className="p-5">
            <form onSubmit={createUserAccount} className="grid gap-3 md:grid-cols-4">
              <input
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
                placeholder="Full name"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
                placeholder="Work email"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={newUserRole}
                onChange={(event) => setNewUserRole(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="employee">Employee</option>
                <option value="mentor">Mentor</option>
              </select>
              <input
                value={newUserPosition}
                onChange={(event) => setNewUserPosition(event.target.value)}
                placeholder="Position"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <Button type="submit" size="sm">Create</Button>
            </form>
          </Card>
        )}

        {panelMode === 'announcement' && (
          <Card className="p-5">
            <form onSubmit={publishAnnouncement} className="grid gap-3 md:grid-cols-4">
              <input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement title"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={announcementDepartment}
                onChange={(e) => setAnnouncementDepartment(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All Departments</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="mobile">Mobile</option>
                <option value="design">Design</option>
                <option value="qa">QA</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
              </select>
              <textarea
                value={announcementText}
                onChange={(event) => setAnnouncementText(event.target.value)}
                placeholder="Write announcement for mentors and employees"
                className="md:col-span-3 min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="flex flex-col gap-2">
                <label className="text-xs">Target</label>
                <div className="flex gap-2 items-center">
                  <label className="text-sm"><input type="checkbox" checked={announceToMentors} onChange={(e) => setAnnounceToMentors(e.target.checked)} /> Mentors</label>
                  <label className="text-sm"><input type="checkbox" checked={announceToEmployees} onChange={(e) => setAnnounceToEmployees(e.target.checked)} /> Employees</label>
                </div>
                <Button type="submit" size="sm">Publish</Button>
              </div>
            </form>
          </Card>
        )}
      </section>

      <Card>
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Registrations</h3>
          <button className="text-primary-dark dark:text-primary text-sm font-bold hover:underline">View All Users</button>
        </div>
        <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-slate-400">
          <div className="flex items-center justify-between gap-3">
            <span>Pending approvals: {pendingApprovals}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'approved' | 'pending' | 'rejected')}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4">Buddy</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" alt={user.name} />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.registrationDate}</td>
                  <td className="px-6 py-4">
                    <Badge variant={user.verificationStatus === 'Approved' ? 'success' : user.verificationStatus === 'Rejected' ? 'danger' : 'warning'}>{user.verificationStatus}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{buddyNameFor(user.role, user.buddyId)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {user.approvalStatus !== 'approved' && (
                        <button
                          onClick={() => approveUser(user.id)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Approve
                        </button>
                      )}
                      {user.approvalStatus === 'pending' && (
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="text-xs font-bold text-amber-500 hover:underline"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => removeUser(user.id)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Delete
                      </button>
                    </div>
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
