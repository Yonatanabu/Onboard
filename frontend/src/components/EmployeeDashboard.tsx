import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Badge } from './UI';
import { completeLesson, getAnnouncementsFeed, getBuddyInfo, getCurrentUser, getEmployeeLessons, getLessonProgress, getMentorTipsFeed } from '../services/mockApi.ts';
import { Announcements } from './Announcements';
import Messages from './Messages';
import { useNavigate } from 'react-router-dom';

type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  position: string;
  url?: string;
};

type Progress = {
  userId: string;
  lessonId: string;
  completed: boolean;
};

export const EmployeeDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<null | { id: string; name: string; buddyId: string | null; position: string }>(null);
  const [buddy, setBuddy] = useState<null | { name: string; position: string; email: string }>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [buddyStatus, setBuddyStatus] = useState('No new messages yet.');
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string }>>([]);
  const [mentorTips, setMentorTips] = useState<Array<{ id: string; message: string; mentorName: string; createdAt: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) {
        return;
      }

      setCurrentUser(user);
      const [employeeLessons, lessonProgress, buddyInfo] = await Promise.all([
        getEmployeeLessons(user.id),
        getLessonProgress(user.id),
        getBuddyInfo(user.buddyId),
      ]);
      setLessons(employeeLessons);
      setProgress(lessonProgress);
      setBuddy(buddyInfo);
      setAnnouncements((await getAnnouncementsFeed()).slice(0, 2));
      setMentorTips(await getMentorTipsFeed());
    };

    load().catch(() => undefined);
  }, []);

  const completedLessonIds = useMemo(
    () => new Set(progress.filter((item) => item.completed).map((item) => item.lessonId)),
    [progress],
  );

  const overallProgress = useMemo(() => {
    if (!lessons.length) {
      return 0;
    }
    return Math.round((completedLessonIds.size / lessons.length) * 100);
  }, [completedLessonIds.size, lessons.length]);

  const remainingModules = Math.max(0, lessons.length - completedLessonIds.size);

  const handleCompleteLesson = async (lessonId: string) => {
    if (!currentUser) {
      return;
    }
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson?.url) {
      const formattedUrl = (!lesson.url.startsWith('http://') && !lesson.url.startsWith('https://'))
        ? `https://${lesson.url}`
        : lesson.url;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }

    await completeLesson(currentUser.id, lessonId);
    setProgress(await getLessonProgress(currentUser.id));
  };

  if (!currentUser) {
    return <div className="text-slate-500">No employee session found.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Welcome back, {currentUser.name}! 👋</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">You&apos;re making great progress. {remainingModules} modules to go until your first milestone.</p>
      </div>

      {announcements.length > 0 && (
        <Card className="p-5">
          <h3 className="text-lg font-bold mb-2">Announcements</h3>
          <div className="space-y-2">
            {announcements.map((item) => (
              <p key={item.id} className="text-sm text-slate-600 dark:text-slate-300">• {item.message}</p>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Messages card removed from EmployeeDashboard per UI update */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span>
              My Learning Path
            </h3>
            <Badge variant="info">{overallProgress}% Overall Progress</Badge>
          </div>

          <div className="grid gap-4">
            {lessons.map((lesson, index) => {
              const completed = completedLessonIds.has(lesson.id);
              return (
                <Card
                  key={lesson.id}
                  className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${completed ? '' : index === 0 ? 'border-l-4 border-l-primary' : ''
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${completed ? 'bg-primary' : 'bg-primary/20'}`}>
                      <span className={`material-symbols-outlined ${completed ? 'text-slate-900' : 'text-primary'}`}>
                        {completed ? 'verified' : 'menu_book'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{lesson.title}</h4>
                      <p className="text-xs text-slate-500">{lesson.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col items-start gap-3 sm:mt-0 sm:items-end sm:gap-1">
                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                      <div className="h-2 w-full max-w-[128px] shrink-0 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-700 sm:w-32">
                        <div className="h-full bg-primary" style={{ width: completed ? '100%' : '0%' }}></div>
                      </div>
                      <span className="text-xs font-bold">{completed ? '100%' : '0%'}</span>
                    </div>
                    {completed ? (
                      lesson.url ? (
                        <a href={(!lesson.url.startsWith('http://') && !lesson.url.startsWith('https://')) ? `https://${lesson.url}` : lesson.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">Review Material</a>
                      ) : (
                        <button className="text-xs font-semibold text-primary hover:underline">Review Material</button>
                      )
                    ) : (
                      <div className="mt-1 flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                        {lesson.url && (
                          <a href={(!lesson.url.startsWith('http://') && !lesson.url.startsWith('https://')) ? `https://${lesson.url}` : lesson.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline">Review Material</a>
                        )}
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => handleCompleteLesson(lesson.id)}>Complete Lesson</Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {lessons.length === 0 && (
              <Card className="p-5">
                <p className="text-sm text-slate-500">No lessons assigned for your position yet.</p>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_celebrate</span>
            My Buddy
          </h3>
          <Card className="overflow-hidden group">
            <div className="h-24 bg-linear-to-r from-primary/40 to-primary/10 relative" />
            <div className="pt-6 px-6 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">{buddy?.name || 'Not assigned yet'}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">{buddy?.position || 'Pending assignment'}</p>
                </div>
                {buddy && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Online
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {buddy
                  ? `${buddy.name} is available to help with onboarding questions. Reach out anytime.`
                  : 'A buddy will be assigned by your admin soon.'}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  icon="chat"
                  onClick={() => {
                    const buddyId = currentUser?.buddyId;
                    if (!buddyId) {
                      setBuddyStatus('No buddy assigned yet.');
                      return;
                    }
                    const role = 'employee';
                    navigate(`/${role}/messages`);
                    setTimeout(() => window.dispatchEvent(new CustomEvent('openChat', { detail: { otherId: buddyId } })), 120);
                  }}
                >
                  Message Buddy
                </Button>
                <Button variant="outline" className="w-full" icon="calendar_today" onClick={() => setBuddyStatus('Sync request submitted.')}>Schedule Sync</Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{buddyStatus}</p>
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">Mentor Tips</h4>
            <div className="space-y-3">
              {mentorTips.slice(0, 4).map((tip) => (
                <div key={tip.id} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{tip.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">From {tip.mentorName}</p>
                </div>
              ))}
              {mentorTips.length === 0 && (
                <p className="text-sm text-slate-500">No tips from your mentor yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <div className="mb-4">
        <Announcements />
      </div>
    </div>
  );
};
