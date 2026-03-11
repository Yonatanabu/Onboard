import React from 'react';
import { Card, Button, Badge } from './UI';

export const Schedule: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Schedule</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your onboarding milestones and mentor syncs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold">October 2023</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" icon="chevron_left" />
                <Button variant="ghost" size="sm" icon="chevron_right" />
              </div>
            </div>
            <Button variant="outline" size="sm" icon="calendar_today">Today</Button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{day}</span>
              </div>
            ))}
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const isToday = day === 24;
              const hasEvent = [24, 25, 28].includes(day);
              return (
                <div key={i} className={`bg-white dark:bg-slate-900 p-4 min-h-[100px] relative group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isToday ? 'ring-2 ring-inset ring-primary' : ''}`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-slate-400'}`}>{day}</span>
                  {hasEvent && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-primary/30 rounded-full"></div>
                      {day === 24 && <div className="text-[8px] font-bold text-primary uppercase truncate">Sync w/ Sarah</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <h3 className="text-xl font-bold">Upcoming Events</h3>
          <div className="space-y-4">
            {[
              { title: 'Weekly Mentor Sync', time: 'Today, 2:00 PM', type: 'Meeting', color: 'bg-primary' },
              { title: 'IT Security Workshop', time: 'Tomorrow, 10:00 AM', type: 'Workshop', color: 'bg-primary-dark' },
              { title: 'Milestone 1 Review', time: 'Oct 28, 4:00 PM', type: 'Review', color: 'bg-amber-500' },
            ].map((event, i) => (
              <Card key={i} className="p-4 flex gap-4 items-center">
                <div className={`size-2 rounded-full ${event.color}`}></div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{event.title}</h4>
                  <p className="text-xs text-slate-500">{event.time}</p>
                </div>
                <Badge variant="info">{event.type}</Badge>
              </Card>
            ))}
          </div>
          
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h4 className="font-bold mb-2">Sync with Sarah</h4>
            <p className="text-xs text-slate-500 mb-4">You have a meeting in 2 hours. Prepare your questions about the design system.</p>
            <Button className="w-full" size="sm" icon="video_call">Join Meeting</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
