import React from 'react';
import { Button, Card } from './UI';

type Props = {
  onGoToLogin: () => void;
  onGoToGetStarted: () => void;
};

export const LandingPage: React.FC<Props> = ({ onGoToLogin, onGoToGetStarted }) => {
  const navItems = [
    { label: 'Features', target: 'features' },
    { label: 'How it Works', target: 'how-it-works' },
    { label: 'About', target: 'about' },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen scroll-smooth">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">rocket_launch</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Onboardly</h2>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors dark:text-slate-300"
                href={`#${item.target}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onGoToLogin} className="hidden text-sm font-bold text-slate-700 hover:text-primary md:block dark:text-slate-200">Login</button>
            <Button onClick={onGoToGetStarted}>Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-16 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="flex flex-col gap-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  New: AI-Powered Workflows
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl dark:text-white">
                  Onboard Smarter with <span className="text-primary">AI</span> & <span className="text-primary-dark">Human Connection</span>
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Reduce time-to-productivity with automated AI workflows and personalized mentorship systems designed for modern B2B teams. Scale your culture effortlessly.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={onGoToGetStarted}>Get Started for Free</Button>
                  <Button variant="outline" size="lg" icon="play_circle">Watch Demo</Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
                <div className="absolute -bottom-4 -right-4 h-72 w-72 rounded-full bg-primary-dark/10 blur-3xl"></div>
                <Card className="relative overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                      <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="mx-auto text-[10px] font-medium text-slate-400">app.onboardly.com</div>
                  </div>
                  <img src="/1.png" className="aspect-video w-full object-cover" alt="Onboarding dashboard preview" />
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-50 dark:bg-slate-900/50 px-6 py-24 lg:px-10 scroll-mt-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex flex-col items-center text-center">
              <h2 className="text-base font-bold text-primary">Core Capabilities</h2>
              <h3 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl dark:text-white">Streamline Your Onboarding Experience</h3>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { title: 'AI Assistant', icon: 'smart_toy', desc: '24/7 instant support to answer common questions and guide users through technical setup.' },
                { title: 'Buddy System', icon: 'group', desc: 'Automatically pair new hires with experienced mentors to foster human connection.' },
                { title: 'Role-Based Lessons', icon: 'school', desc: 'Customized learning paths tailored specifically to individual roles and responsibilities.' }
              ].map(feature => (
                <Card key={feature.title} className="p-8 group hover:-translate-y-1 transition-all">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                    <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 pb-20 pt-16 lg:px-10 scroll-mt-24">
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="grid items-center gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
              <Card className="border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/60">
                <img
                  src="https://picsum.photos/seed/adoption-guide/640/420"
                  className="h-auto w-full rounded-xl object-cover"
                  alt="User adoption workflow"
                  referrerPolicy="no-referrer"
                />
              </Card>

              <div className="space-y-6">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Three steps to seamless user adoption</h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Connect Your Product',
                      desc: 'Our unified API imports your journey and feature set in minutes.',
                    },
                    {
                      title: 'AI Configures Paths',
                      desc: 'Role-aware onboarding tracks are generated automatically for each user group.',
                    },
                    {
                      title: 'Launch & Pair',
                      desc: 'Users begin with an AI companion and a mentor buddy from day one.',
                    },
                  ].map((step, index) => (
                    <div key={step.title} className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-background-dark">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section id="about" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-wider text-primary">About</p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Built for teams that want onboarding to feel intentional</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Onboardly blends structured learning, AI guidance, and real mentor relationships so new hires and product users both get a faster path to confidence.
                  </p>
                </div>
                <Card className="p-6">
                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <p><span className="font-bold text-slate-900 dark:text-white">Mission:</span> shorten time-to-productivity without losing the human touch.</p>
                    <p><span className="font-bold text-slate-900 dark:text-white">Approach:</span> automate the repetitive parts and keep mentors focused on meaningful check-ins.</p>
                    <p><span className="font-bold text-slate-900 dark:text-white">Outcome:</span> more consistent onboarding, less manager overhead, and clearer progress visibility.</p>
                  </div>
                </Card>
              </div>
            </section>

            <Card className="bg-primary-dark p-8 text-white dark:bg-primary-dark/90">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <h4 className="text-3xl font-black tracking-tight">Ready to accelerate adoption?</h4>
                  <p className="mt-2 text-sm text-white/80">Join 2,000+ organizations using Onboardly to delight their users.</p>
                </div>
                <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/15 p-2 backdrop-blur">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="h-10 flex-1 rounded-xl border border-white/20 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <Button variant="dark" size="sm" onClick={onGoToGetStarted}>Get Started</Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-16 px-6 lg:px-10 dark:border-slate-800 dark:bg-background-dark">
        <div className="mx-auto grid max-w-7xl gap-10 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-2xl font-bold">rocket_launch</span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Onboardly</h2>
            </div>
            <p className="max-w-sm leading-relaxed">Automating B2B user success through intelligent AI workflows and human mentorship pairings.</p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'Integrations', 'Enterprise', 'Roadmap'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Blog', 'Press Kit'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'] },
          ].map((column) => (
            <div key={column.title}>
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <span className="cursor-default text-slate-600 dark:text-slate-400">{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Onboardly Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
