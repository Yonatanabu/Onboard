import React from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
const LandingPage = React.lazy(() => import('./components/LandingPage.tsx').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./components/LoginPage.tsx').then(m => ({ default: m.LoginPage })));
const GetStartedPage = React.lazy(() => import('./components/GetStartedPage.tsx').then(m => ({ default: m.GetStartedPage })));
const EmployeeDashboard = React.lazy(() => import('./components/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard.tsx').then(m => ({ default: m.AdminDashboard })));
const MentorDashboard = React.lazy(() => import('./components/MentorDashboard').then(m => ({ default: m.MentorDashboard })));
const LessonManagement = React.lazy(() => import('./components/LessonManagement.tsx').then(m => ({ default: m.LessonManagement })));
const BuddyAssignment = React.lazy(() => import('./components/BuddyAssignment.tsx').then(m => ({ default: m.BuddyAssignment })));
const Resources = React.lazy(() => import('./components/Resources').then(m => ({ default: m.Resources })));
const AIChat = React.lazy(() => import('./components/AIChat').then(m => ({ default: m.AIChat })));
const Settings = React.lazy(() => import('./components/Settings.tsx').then(m => ({ default: m.Settings })));
const Reports = React.lazy(() => import('./components/Reports.tsx').then(m => ({ default: m.Reports })));
import { ToastProvider, useToast } from './components/Toast.tsx';
import { authenticateUser, getCurrentUser, logout, submitSignupRequest, getUnreadAnnouncementCount } from './services/mockApi.ts';
const AnnouncementsPage = React.lazy(() => import('./components/AnnouncementsPage'));
const MessagesPage = React.lazy(() => import('./components/MessagesPage'));

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getHomeRouteByRole = (role: string) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return '/admin/dashboard';
  if (normalized === 'mentor') return '/mentor/dashboard';
  return '/employee/dashboard';
};

const RoleLayout: React.FC<{
  role: 'employee' | 'admin' | 'mentor';
  portalLabel: string;
  navItems: Array<{ icon: string; label: string; path: string }>;
  logoutLabel?: string;
  theme?: ThemeMode;
  toggleTheme?: () => void;
}> = ({ role, portalLabel, navItems, logoutLabel = 'Logout', theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const updateBadge = async () => {
      try {
        const count = await getUnreadAnnouncementCount();
        const el = document.getElementById('annBadge');
        if (!el || !mounted) return;
        if (count > 0) {
          el.style.display = 'inline-block';
          el.textContent = String(count);
        } else {
          el.style.display = 'none';
        }
      } catch {
        // ignore
      }
    };

    updateBadge();
    const listener = () => updateBadge();
    window.addEventListener('announcementsUpdated', listener);
    return () => {
      mounted = false;
      window.removeEventListener('announcementsUpdated', listener);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile unless toggled, always visible on medium+ screens */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 md:sticky md:top-0 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isSidebarMinimized ? 'md:w-20' : 'w-72'}`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="size-10 shrink-0 bg-primary rounded-xl flex items-center justify-center text-slate-900">
            <span className="material-symbols-outlined text-2xl font-bold">rocket_launch</span>
          </div>
          <h1 className={`text-xl font-black tracking-tighter transition-opacity duration-200 ${isSidebarMinimized ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>Onboardly</h1>
          {/* Close button for mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path.endsWith('/dashboard') && location.pathname === item.path.replace('/dashboard', ''));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-4'} p-3 rounded-xl transition-all group ${active
                  ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <span className={`material-symbols-outlined ${active ? 'font-bold' : ''}`}>{item.icon}</span>
                <span className={`font-bold text-sm tracking-tight transition-opacity duration-200 ${isSidebarMinimized ? 'md:hidden' : 'block'}`}>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-4'} p-3 rounded-xl transition-all group text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100`}
            >
              <span className="material-symbols-outlined">logout</span>
              <span className={`font-bold text-sm tracking-tight transition-opacity duration-200 ${isSidebarMinimized ? 'md:hidden' : 'block'}`}>{logoutLabel}</span>
            </button>
          </div>
        </nav>

        {/* Desktop-only Minimize Button */}
        <div className="hidden border-t border-slate-100 p-3 dark:border-slate-800 md:block">
          <button
            onClick={() => setIsSidebarMinimized((previous) => !previous)}
            className="flex w-full items-center justify-center rounded-xl py-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            <span className="material-symbols-outlined text-xl">{isSidebarMinimized ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 md:ml-0">
        <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {portalLabel}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {theme && toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="relative material-symbols-outlined p-2 text-slate-400 hover:text-primary transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </button>
            )}
            <button onClick={() => navigate(`/${role}/announcements`)} className="relative material-symbols-outlined p-2 text-slate-400 hover:text-primary transition-colors">
              notifications
              <span id="annBadge" className="absolute -top-0 -right-0 bg-rose-500 text-white text-[10px] rounded-full px-1" style={{ display: 'none' }}>0</span>
            </button>
            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 md:block mx-1 md:mx-2"></div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold truncate max-w-[120px] md:max-w-none">{currentUser?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{currentUser?.position || role}</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                className="size-8 md:size-10 rounded-full border-2 border-primary/20 object-cover"
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[100vw] md:max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const RequireRole: React.FC<{ children: React.ReactNode; role: 'employee' | 'admin' | 'mentor' }> = ({ children, role }) => {
  const currentUser = getCurrentUser();
  const userRole = String(currentUser?.role || '').toLowerCase();
  if (!currentUser || userRole !== role) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const LandingRoute: React.FC = () => {
  const navigate = useNavigate();
  return <LandingPage onGoToLogin={() => navigate('/login')} onGoToGetStarted={() => navigate('/register')} />;
};

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <LoginPage
      onBackToHome={() => navigate('/')}
      onGoToGetStarted={() => navigate('/register')}
      onSignIn={async ({ email, password }) => {
        try {
          const user = await authenticateUser({ email, password });
          if (!user) {
            showToast('Invalid credentials or account not yet approved by admin.', 'error');
            return;
          }
          navigate(getHomeRouteByRole(user.role));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          showToast(message, 'error');
        }
      }}
    />
  );
};

const RegisterRoute: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <GetStartedPage
      onBackToHome={() => navigate('/')}
      onGoToLogin={() => navigate('/login')}
      onCreateAccount={async ({ name, email, password, role, department }) => {
        try {
          await submitSignupRequest({ name, email, password, role, department });
          showToast('Signup request sent to admin for approval. You can sign in after approval.', 'success');
          navigate('/login');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Signup failed';
          showToast(message || 'Request failed', 'error');
        }
      }}
    />
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = React.useState<ThemeMode>(getInitialTheme);
  const location = useLocation();
  const isDashboardRoute = /^\/(employee|admin|mentor)/.test(location.pathname);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <ToastProvider>
      {!isDashboardRoute && (
        <button
          type="button"
          onClick={toggleTheme}
          className="fixed right-4 top-4 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      )}

      <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />

          <Route
            path="/employee"
            element={
              <RequireRole role="employee">
                <RoleLayout
                  role="employee"
                  portalLabel="Employee Portal"
                  navItems={[
                    { icon: 'home', label: 'My Dashboard', path: '/employee/dashboard' },
                    { icon: 'chat', label: 'Messages', path: '/employee/messages' },
                    { icon: 'menu_book', label: 'Resources', path: '/employee/resources' },
                    { icon: 'campaign', label: 'Announcements', path: '/employee/announcements' },
                    { icon: 'smart_toy', label: 'AI Assistant', path: '/employee/ai-assistant' },
                    { icon: 'settings', label: 'Settings', path: '/employee/settings' },
                  ]}
                  logoutLabel="Log out"
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="resources" element={<Resources />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="ai-assistant" element={<AIChat />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <RoleLayout
                  role="admin"
                  portalLabel="Admin Portal"
                  navItems={[
                    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
                    { icon: 'group', label: 'Buddy Matching', path: '/admin/users' },
                    { icon: 'bar_chart', label: 'Reports', path: '/admin/reports' },
                    { icon: 'menu_book', label: 'Lessons', path: '/admin/resources' },
                    { icon: 'campaign', label: 'Announcements', path: '/admin/announcements' },
                    { icon: 'settings', label: 'Settings', path: '/admin/settings' },
                  ]}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<BuddyAssignment />} />
            <Route path="reports" element={<Reports />} />
            <Route path="resources" element={<LessonManagement />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/mentor"
            element={
              <RequireRole role="mentor">
                <RoleLayout
                  role="mentor"
                  portalLabel="Mentor Portal"
                  navItems={[
                    { icon: 'dashboard', label: 'Dashboard', path: '/mentor/dashboard' },
                    { icon: 'chat', label: 'Messages', path: '/mentor/messages' },
                    { icon: 'groups', label: 'Employees', path: '/mentor/employees' },
                    { icon: 'menu_book', label: 'Resources', path: '/mentor/resources' },
                    { icon: 'campaign', label: 'Announcements', path: '/mentor/announcements' },
                    { icon: 'settings', label: 'Settings', path: '/mentor/settings' },
                  ]}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="employees" element={<MentorDashboard />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="resources" element={<LessonManagement />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </React.Suspense>
    </ToastProvider>
  );
};

export default App;
