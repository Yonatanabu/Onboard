import React, { useState } from 'react';
import { Button } from './UI';
import { getCurrentUser, getEmployeeLessons } from '../services/mockApi.ts';

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

export const AIChat: React.FC = () => {
  const user = getCurrentUser();
  const [lessons, setLessons] = useState<Array<{ id: string; title: string }>>([]);
  React.useEffect(() => {
    if (!user) {
      setLessons([]);
      return;
    }

    getEmployeeLessons(user.id)
      .then((items) => setLessons(items))
      .catch(() => setLessons([]));
  }, [user?.id]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Welcome${user?.name ? ` ${user.name}` : ''}! I can guide your onboarding tasks based on your position.${
        lessons[0] ? ` Start with: ${lessons[0].title}.` : ''
      }`,
    },
  ]);
  const [input, setInput] = useState('');

  const buildReply = (question: string) => {
    const normalized = question.toLowerCase();
    if (lessons.length > 0) {
      const nextLesson = lessons[0];
      if (normalized.includes('next') || normalized.includes('lesson') || normalized.includes('what')) {
        return `Based on your position, you should complete lesson ${nextLesson.title}.`;
      }
    }
    if (normalized.includes('buddy')) {
      return 'Your buddy can help with team-specific questions and your weekly check-ins.';
    }
    if (normalized.includes('resource')) {
      return 'Go to Resources to see all lessons assigned to your position and mark them complete.';
    }
    return lessons[0]
      ? `Based on your position, you should complete lesson ${lessons[0].title}.`
      : 'You currently have no assigned lessons. Ask your admin to publish one for your position.';
  };

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) {
      return;
    }

    const reply = buildReply(text);
    setMessages((previous) => [...previous, { role: 'user', text }, { role: 'assistant', text: reply }]);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col relative bg-white dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="flex justify-center">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">Today</span>
        </div>

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-4 max-w-3xl ${message.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            {message.role === 'assistant' ? (
              <div className="size-10 rounded-full bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-xl">smart_toy</span>
              </div>
            ) : (
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" className="size-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" alt="User" />
            )}
            <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : ''}`}>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{message.role === 'assistant' ? 'Onboarding Assistant' : user?.name || 'Employee'}</span>
              <div className={`${message.role === 'assistant' ? 'bg-slate-100 dark:bg-slate-800/80 rounded-tl-none border border-slate-200 dark:border-slate-700/50' : 'bg-primary text-slate-900 rounded-tr-none shadow-xl shadow-primary/10'} p-5 rounded-2xl`}>
                <p className={`leading-relaxed ${message.role === 'assistant' ? 'text-slate-800 dark:text-slate-200' : 'font-medium'}`}>{message.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl focus-within:ring-2 ring-primary/50 transition-all">
          <button type="button" className="p-2 text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <textarea
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 resize-none max-h-32 text-slate-800 dark:text-slate-200 placeholder-slate-500"
            placeholder="Ask me anything about your first week..."
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          ></textarea>
          <div className="flex items-center gap-1">
            <button type="button" className="p-2 text-slate-400 hover:text-primary">
              <span className="material-symbols-outlined text-2xl">mic</span>
            </button>
            <Button type="submit" size="sm" icon="send" />
          </div>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-tight">
          AI-generated responses can sometimes be inaccurate. Always verify with your HR representative.
        </p>
      </div>
    </div>
  );
};
