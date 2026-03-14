import React, { useState } from 'react';
import { Button } from './UI';

type Props = {
  onBackToHome: () => void;
  onGoToGetStarted: () => void;
  onSignIn: (data: { email: string; password: string }) => void;
};


export const LoginPage: React.FC<Props> = ({ onBackToHome, onGoToGetStarted, onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSignIn({ email, password });
  };

  const handleSocialSignIn = () => {
    onSignIn({ email, password });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
        <div className="flex flex-col justify-between bg-slate-900 p-8 text-white md:p-12 dark:bg-slate-950">
          <div>
            <button onClick={onBackToHome} className="inline-flex items-center gap-2 text-sm font-bold text-white/90 transition hover:text-white">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Home
            </button>
            <div className="mt-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
              <p className="text-lg font-black tracking-tight">OnboardFlow</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="text-5xl font-black leading-tight tracking-tight">Welcome back! Your journey continues here.</h1>
            <p className="text-sm text-white/80">
              Access your personalized dashboard, track your progress, and complete your professional onboarding experience seamlessly.
            </p>
          </div>

          <p className="text-xs text-white/60">© 2026 OnboardFlow Inc. · Privacy Policy · Terms of Service</p>
        </div>

        <div className="relative flex items-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Sign In</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access your account.</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

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
              </label>

            </div>

            <div className="flex items-center justify-between text-xs toast-anchor">
              <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                />
                Remember me
              </label>
              <button type="button" onClick={handleSocialSignIn} className="font-bold text-primary hover:underline">Forgot password?</button>
            </div>

            <Button type="submit" className="w-full">Sign In</Button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span>Or log in with</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button type="button" variant="outline" className="w-full text-xs" onClick={() => onSignIn({ email: 'employee@company.com', password: '12345678' })}>Demo Employee</Button>
              <Button type="button" variant="outline" className="w-full text-xs" onClick={() => onSignIn({ email: 'mentor@company.com', password: '12345678' })}>Demo Mentor</Button>
              <Button type="button" variant="outline" className="w-full text-xs" onClick={() => onSignIn({ email: 'admin@company.com', password: '12345678' })}>Demo Admin</Button>
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={onGoToGetStarted} className="font-bold text-primary hover:underline">Sign up</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
