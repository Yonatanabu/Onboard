import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge } from './UI';
import { completeLesson, getCurrentUser, getEmployeeLessons, getLessonProgress } from '../services/mockApi.ts';

type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  position: string;
  url?: string;
};

export const Resources: React.FC = () => {
  const [user, setUser] = useState<null | { id: string; position: string }>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Array<{ lessonId: string; completed: boolean }>>([]);

  useEffect(() => {
    const load = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return;
      }

      setUser(currentUser);
      const [employeeLessons, lessonProgress] = await Promise.all([
        getEmployeeLessons(currentUser.id),
        getLessonProgress(currentUser.id),
      ]);
      setLessons(employeeLessons);
      setProgress(lessonProgress);
    };

    load().catch(() => undefined);
  }, []);

  const completedLessons = useMemo(
    () => new Set(progress.filter((entry) => entry.completed).map((entry) => entry.lessonId)),
    [progress],
  );

  const markComplete = async (lessonId: string) => {
    if (!user) {
      return;
    }
    await completeLesson(user.id, lessonId);
    setProgress(await getLessonProgress(user.id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Resources</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Everything you need to succeed in your first 90 days.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => {
          const done = completedLessons.has(lesson.id);
          return (
            <Card key={lesson.id} className="p-6 hover:border-primary transition-colors group">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{lesson.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{lesson.description}</p>
              {lesson.url && (
                <div className="mb-4">
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View resource
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                {done ? <Badge variant="success">Completed</Badge> : <Badge variant="info">Pending</Badge>}
                <Button variant="outline" size="sm" icon={done ? 'check' : 'task_alt'} onClick={() => markComplete(lesson.id)}>
                  {done ? 'Completed' : 'Mark Complete'}
                </Button>
              </div>
            </Card>
          );
        })}

        {lessons.length === 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-2">No Resources Found</h3>
            <p className="text-sm text-slate-500 mb-4">No lessons are currently assigned to your position.</p>
          </Card>
        )}
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-bold">Role-Specific Documentation</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lessons.slice(0, 2).map((lesson) => (
            <Card key={`doc-${lesson.id}`} className="p-6 flex items-center gap-6">
              <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">description</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{lesson.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{lesson.content}</p>
                {lesson.url && (
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-xs block mb-2"
                  >
                    Open resource
                  </a>
                )}
                <div className="flex gap-2">
                  <Badge variant="info">{lesson.position}</Badge>
                </div>
              </div>
              <Button variant="ghost" icon="chevron_right" onClick={() => markComplete(lesson.id)} />
            </Card>
          ))}        </div>
      </section>
    </div>
  );
};
