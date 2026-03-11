import React, { useMemo, useState } from 'react';
import { Button, Card } from './UI';

type Props = {
  onBackToHome: () => void;
  onGoToLogin: () => void;
  onCreateAccount: (data: { name: string; email: string; password: string; role: 'Employee' | 'Mentor' | 'Admin'; department?: string }) => void;
};

const roles = ['Employee', 'Mentor', 'Admin'] as const;

export const GetStartedPage: React.FC<Props> = ({ onBackToHome, onGoToLogin, onCreateAccount }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('frontend');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, passwordStrength - 1)] || 'Weak';
  const strengthWidth = `${Math.max(20, passwordStrength * 25)}%`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onCreateAccount({
      name: fullName,
      email,
      password,
      role: role as 'Employee' | 'Mentor' | 'Admin',
      department: role === 'Admin' ? undefined : department,
    });
  };

  const handleSocialCreate = () => {
    onCreateAccount({
      name: fullName,
      email,
      password,
      role: role as 'Employee' | 'Mentor' | 'Admin',
      department: role === 'Employee' ? department : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
        <div className="relative flex flex-col justify-between bg-slate-900 p-8 text-white md:p-12 dark:bg-slate-950">
          <div className="space-y-10">
            <button onClick={onBackToHome} className="inline-flex items-center gap-2 text-sm font-bold text-white/90 transition hover:text-white">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Home
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              <p className="text-lg font-black tracking-tight">OnboardPlatform</p>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/95 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <img
              src="https://picsum.photos/seed/onboard-chart/900/520"
              alt="Onboarding analytics preview"
              className="h-auto w-full rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          </Card>

          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Empower your team from <span className="text-primary">Day One.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/80">
              Join over 500+ companies using AI-driven mentorship to build world-class onboarding experiences.
            </p>
          </div>
        </div>

        <div className="relative flex items-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start your 14-day free trial today.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Full Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="John Doe"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Work Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@company.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Employee">Employee</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </label>
              {(role === 'Employee' || role === 'Mentor') && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Department</span>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="mobile">Mobile</option>
                    <option value="design">Design</option>
                    <option value="qa">QA</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-primary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Password Strength</span>
                    <span>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: strengthWidth }} />
                  </div>
                </div>
              </label>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 toast-anchor">
              <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary" />
              <span>
                I agree to the <a href="#" className="font-bold text-primary">Terms of Service</a> and <a href="#" className="font-bold text-primary">Privacy Policy</a>.
              </span>
            </label>

            <Button type="submit" className="w-full">Create Account</Button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={onGoToLogin} className="font-bold text-primary hover:underline">Log in instead</button>
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span>Or continue with</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={handleSocialCreate}>Google</Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleSocialCreate}>Slack</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
