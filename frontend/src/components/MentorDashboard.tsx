import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Badge } from './UI';
import { Announcements } from './Announcements';
import Messages from './Messages';
import { createMentorTip, getAnnouncementsFeed, getCurrentUser, getEmployeeProgress, getEmployeeLessons, getMentorEmployees, getMentorTipsForMentor } from '../services/mockApi.ts';
import { io } from 'socket.io-client';
import ChatWidget from './ChatWidget';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

type MenteeItem = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'On Track' | 'Blocked' | 'Needs Attention';
  progress: number;
  lastActive: string;
  blockedReason?: string;
};

const randomAvatar = (seed: number) => `https://picsum.photos/seed/onboard-mentee-${seed}/120/120`;

export const MentorDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [mentees, setMentees] = useState<MenteeItem[]>([]);
  const [filter, setFilter] = useState<'All' | 'On Track' | 'Blocked' | 'Needs Attention'>('All');
  const [activeMenteeId, setActiveMenteeId] = useState<string | null>(null);
  // notifications removed: mentors receive an email when assigned a new mentee
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string }>>([]);
  const [mentorTips, setMentorTips] = useState<Array<{ id: string; message: string; createdAt: string; mentees: string[] }>>([]);
  const [menteeLessons, setMenteeLessons] = useState<Array<{ id: string; title?: string; description?: string; position?: string; completed?: boolean }>>([]);
  const [lessonFilter, setLessonFilter] = useState<'all' | 'completed' | 'unfinished'>('all');
  const [tipMessage, setTipMessage] = useState('');
  const [tipTarget, setTipTarget] = useState<'all' | string>('all');

  useEffect(() => {
    const load = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return;
      }

      const assignedEmployees = await getMentorEmployees(currentUser.id);
      const mappedMenteesSettled = await Promise.allSettled(
        assignedEmployees.map(async (employee, index) => {
          const progressData = await getEmployeeProgress(employee.id);
          const percent = progressData?.percentage ?? 0;
          const status: 'On Track' | 'Blocked' | 'Needs Attention' =
            percent >= 70 ? 'On Track' : percent < 40 ? 'Blocked' : 'Needs Attention';

          return {
            id: employee.id,
            name: employee.name,
            role: employee.position || employee.role,
            avatar: randomAvatar(index + 1),
            status,
            progress: percent,
            lastActive: 'Today',
            blockedReason: status === 'Blocked' ? 'Low onboarding completion. Please follow up for support.' : undefined,
          };
        }),
      );

      const mappedMentees: MenteeItem[] = mappedMenteesSettled.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }

        const employee = assignedEmployees[index];
        return {
          id: employee.id,
          name: employee.name,
          role: employee.position || employee.role,
          avatar: randomAvatar(index + 1),
          status: 'Needs Attention',
          progress: 0,
          lastActive: 'Today',
          blockedReason: 'Progress is currently unavailable. Please refresh and try again.',
        };
      });

      setMentees(mappedMentees);
      setAnnouncements((await getAnnouncementsFeed()).slice(0, 2));
      setMentorTips(await getMentorTipsForMentor());

      // no persistent in-app notifications; mentors receive assignment emails
    };

    load().catch(() => undefined);

    const listener = (e: any) => {
      const currentUser = getCurrentUser();
      if (currentUser && e.detail?.mentorId === currentUser.id) {
        // re-load mentees when assignment event is fired
        load().catch(() => undefined);
      }
    };
    window.addEventListener('menteeAssigned', listener as EventListener);

    const openChatListener = (e: any) => {
      if (e.detail?.otherId) setActiveMenteeId(e.detail.otherId);
    };
    window.addEventListener('openChat', openChatListener as EventListener);

    // connect socket for real-time assignment notifications
    try {
      const wsRoot = (import.meta as any).env?.VITE_API_URL ? (import.meta as any).env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
      const socket = io(wsRoot, { auth: { token: (getCurrentUser() || {}).token } });
      socket.on('connect', () => socket.emit('join', getCurrentUser()?.id));
      socket.on('menteeAssigned', (_payload: any) => {
        // refresh mentees list when assignment happens
        load().catch(() => {});
      });
    } catch {
      // ignore socket errors
    }

    return () => {
      window.removeEventListener('menteeAssigned', listener as EventListener);
      window.removeEventListener('openChat', openChatListener as EventListener);
    };
  }, []);

  const navigate = useNavigate();

  const visibleMentees = useMemo(
    () => (filter === 'All' ? mentees : mentees.filter((mentee) => mentee.status === filter)),
    [mentees, filter],
  );

  const activeMenteesCount = mentees.length;
  const needsAttentionCount = mentees.filter((mentee) => mentee.status === 'Blocked' || mentee.status === 'Needs Attention').length;
  const completedCount = mentees.filter((mentee) => mentee.progress >= 80).length;

  const cycleFilter = () => {
    const sequence: Array<'All' | 'On Track' | 'Blocked' | 'Needs Attention'> = ['All', 'On Track', 'Blocked', 'Needs Attention'];
    const currentIndex = sequence.indexOf(filter);
    setFilter(sequence[(currentIndex + 1) % sequence.length]);
  };

  const sendQuickReply = (menteeId: string) => {
    const mentee = mentees.find((item) => item.id === menteeId);
    if (!mentee) return;

    // Navigate to mentor messages page and open chat for this mentee
    navigate('/mentor/messages');
    // small delay to ensure route mounted before dispatching event
    setTimeout(() => window.dispatchEvent(new CustomEvent('openChat', { detail: { otherId: menteeId } })), 120);
    showToast(`Reply sent to ${mentee.name}.`, 'success');
  };

  const markOnTrack = (menteeId: string) => {
    setMentees((previous) =>
      previous.map((mentee) => {
        if (mentee.id !== menteeId) {
          return mentee;
        }

        return {
          ...mentee,
          status: 'On Track',
          blockedReason: undefined,
          progress: Math.max(mentee.progress, 55),
          lastActive: 'Just now',
        };
      }),
    );

    const mentee = mentees.find((item) => item.id === menteeId);
    if (mentee) {
      showToast(`${mentee.name} moved to On Track.`, 'success');
    }
  };

  const requestCheckIn = (menteeId: string) => {
    const mentee = mentees.find((item) => item.id === menteeId);
    if (!mentee) {
      return;
    }
    showToast(`Check-in request sent to ${mentee.name}.`, 'info');
  };

    // replace notifications update with a toast
    // (above line will be replaced by showToast when executed)

  const handleSendTip = async () => {
    if (!tipMessage.trim()) {
      showToast('Please write a tip message first.', 'error');
      return;
    }

    const targetIds = tipTarget === 'all' ? mentees.map((mentee) => mentee.id) : [tipTarget];
    if (!targetIds.length) {
      showToast('No assigned mentees available for this tip.', 'error');
      return;
    }

    await createMentorTip(tipMessage.trim(), targetIds);
    setTipMessage('');
    setTipTarget('all');
    setMentorTips(await getMentorTipsForMentor());
    showToast('Tip shared with your mentees.', 'success');
  };

  useEffect(() => {
    if (!activeMenteeId) return;
    let mounted = true;
    (async () => {
      try {
        const lessons = await getEmployeeLessons(activeMenteeId);
        if (!mounted) return;
        setMenteeLessons(lessons || []);
      } catch {
        if (mounted) setMenteeLessons([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeMenteeId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Mentor Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your mentees and track their onboarding milestones.</p>
        {/* Messages card removed per request (left side Messages now available on /mentor/messages) */}
        {announcements.length > 0 && (
          <Card className="p-5">
            <h3 className="text-lg font-bold mb-2">Announcements</h3>
            <div className="space-y-2">
              {announcements.map((item) => (
                <button
                  key={item.id}
                  className="text-sm text-slate-600 dark:text-slate-300 text-left w-full hover:underline"
                  onClick={() => {
                    const current = getCurrentUser();
                    const role = String(current?.role || 'employee').toLowerCase();
                    navigate(`/${role}/announcements`);
                  }}
                >
                  • {item.message}
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-slate-900">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Mentees</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{activeMenteesCount}</p>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${Math.min(100, (activeMenteesCount / 6) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Capacity: {activeMenteesCount}/6 slots filled</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-2xl">priority_high</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Needs Attention</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{needsAttentionCount}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium italic">
              {needsAttentionCount > 0 ? 'One or more mentees currently need support' : 'All mentees are currently on track'}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed This Month</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{completedCount}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Average completion time: 14 days</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Mentees</h3>
              <Button variant="outline" size="sm" icon="filter_list" onClick={cycleFilter}>
                Filter: {filter}
              </Button>
            </div>

            <div className="space-y-4">
              {visibleMentees.map((mentee) => (
                <Card key={mentee.id} className="p-6 hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <img src={mentee.avatar} className="size-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800" alt={mentee.name} />
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{mentee.name}</h4>
                        <p className="text-sm text-slate-500">{mentee.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={mentee.status === 'On Track' ? 'success' : mentee.status === 'Blocked' ? 'danger' : 'warning'}>
                            {mentee.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Active {mentee.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Onboarding Progress</span>
                        <span className="text-xs font-black text-primary">{mentee.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${mentee.status === 'Blocked' ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${mentee.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon="chat" onClick={() => sendQuickReply(mentee.id)}>
                        Chat
                      </Button>
                      <Button size="sm" icon="visibility" onClick={() => setActiveMenteeId((previous) => (previous === mentee.id ? null : mentee.id))}>
                        Details
                      </Button>
                    </div>
                  </div>

                  {(mentee.status === 'Blocked' || activeMenteeId === mentee.id) && (
                    <div className="mt-4 space-y-3">
                      {mentee.status === 'Blocked' && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-3 items-start">
                          <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">warning</span>
                          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-medium">{mentee.blockedReason}</p>
                        </div>
                      )}
                      {activeMenteeId === mentee.id && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => markOnTrack(mentee.id)}>
                            Mark On Track
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestCheckIn(mentee.id)}>
                            Request Check-in
                          </Button>
                        </div>
                      )}
                      {activeMenteeId === mentee.id && (
                        <div className="mt-4">
                          <h4 className="text-sm font-bold mb-2">Available Courses</h4>
                          <div className="flex gap-2 mb-3">
                            <Button size="sm" variant={lessonFilter === 'all' ? undefined : 'outline'} onClick={() => setLessonFilter('all')}>All</Button>
                            <Button size="sm" variant={lessonFilter === 'completed' ? undefined : 'outline'} onClick={() => setLessonFilter('completed')}>Completed</Button>
                            <Button size="sm" variant={lessonFilter === 'unfinished' ? undefined : 'outline'} onClick={() => setLessonFilter('unfinished')}>Unfinished</Button>
                          </div>
                          <div className="space-y-3">
                            {menteeLessons.filter((l) => (lessonFilter === 'all' ? true : lessonFilter === 'completed' ? l.completed : !l.completed)).map((lesson) => (
                              <Card
                                key={lesson.id}
                                className={`p-3 transition-all hover:shadow-lg flex items-start gap-3 ${lesson.completed ? 'border border-emerald-600 bg-slate-800/60' : 'bg-slate-900/40 border border-slate-800'}`}>
                                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined">school</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                      <div className="font-semibold text-slate-100 truncate">{lesson.title || 'Untitled Course'}</div>
                                      <div className="text-xs text-slate-400 truncate">{lesson.position || ''}</div>
                                    </div>
                                    <div className="text-xs ml-4 flex-shrink-0">
                                      {lesson.completed ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700 text-emerald-100 font-bold"> 
                                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                          Completed
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 text-slate-300">Unfinished</span>
                                      )}
                                    </div>
                                  </div>
                                  {lesson.description && <div className="text-xs text-slate-400 mt-2 truncate">{lesson.description}</div>}
                                </div>
                              </Card>
                            ))}

                            {menteeLessons.length === 0 && <div className="text-xs text-slate-400">No courses available.</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="mt-4">
              <div className="mt-4">
                <Announcements />
              </div>
            </div>

            <Card className="p-6 bg-slate-900 text-white space-y-4">
              <h4 className="text-lg font-bold">Mentor Tips</h4>
              <textarea
                value={tipMessage}
                onChange={(event) => setTipMessage(event.target.value)}
                placeholder="Write a tip for your mentees..."
                className="w-full min-h-24 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex gap-2">
                <select
                  value={tipTarget}
                  onChange={(event) => setTipTarget(event.target.value as 'all' | string)}
                  className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All my mentees</option>
                  {mentees.map((mentee) => (
                    <option key={mentee.id} value={mentee.id}>{mentee.name}</option>
                  ))}
                </select>
                <Button onClick={handleSendTip}>Send Tip</Button>
              </div>

              <div className="space-y-2 max-h-44 overflow-auto pr-1">
                {mentorTips.slice(0, 5).map((tip) => (
                  <div key={tip.id} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">
                    <p>{tip.message}</p>
                  </div>
                ))}
                {mentorTips.length === 0 && <p className="text-xs text-slate-400">No tips shared yet.</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ChatWidget otherId={activeMenteeId} open={!!activeMenteeId} onClose={() => setActiveMenteeId(null)} />
    </div>
  );
};

// render Chat widget overlay
// (placed after component to keep main JSX concise)
export default MentorDashboard;
