import React from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { GetStartedPage } from './components/GetStartedPage.tsx';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { MentorDashboard } from './components/MentorDashboard';
import { LessonManagement } from './components/LessonManagement.tsx';
import { BuddyAssignment } from './components/BuddyAssignment.tsx';
import { Resources } from './components/Resources';
import { AIChat } from './components/AIChat';
import { Settings } from './components/Settings.tsx';
import { Reports } from './components/Reports.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { authenticateUser, getCurrentUser, logout, submitSignupRequest, getUnreadAnnouncementCount } from './services/mockApi.ts';
import AnnouncementsPage from './components/AnnouncementsPage';
import MessagesPage from './components/MessagesPage';

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
}> = ({ role, portalLabel, navItems, logoutLabel = 'Logout' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);

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
      <aside className={`${isSidebarMinimized ? 'w-20' : 'w-72'} transition-all duration-300 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sticky top-0 h-screen z-40`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-slate-900">
            <span className="material-symbols-outlined text-2xl font-bold">rocket_launch</span>
          </div>
          {!isSidebarMinimized && <h1 className="text-xl font-black tracking-tighter">Onboardly</h1>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path.endsWith('/dashboard') && location.pathname === item.path.replace('/dashboard', ''));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-4'} p-3 rounded-xl transition-all group ${
                  active
                    ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className={`material-symbols-outlined ${active ? 'font-bold' : ''}`}>{item.icon}</span>
                {!isSidebarMinimized && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
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
              {!isSidebarMinimized && <span className="font-bold text-sm tracking-tight">{logoutLabel}</span>}
            </button>
          </div>
        </nav>

        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <button
            onClick={() => setIsSidebarMinimized((previous) => !previous)}
            className="w-full flex items-center justify-center py-2 rounded-xl transition-all text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-200"
            aria-label={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            <span className="material-symbols-outlined text-xl">{isSidebarMinimized ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {portalLabel}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/${role}/announcements`)} className="relative material-symbols-outlined p-2 text-slate-400 hover:text-primary transition-colors">
              notifications
              <span id="annBadge" className="absolute -top-0 -right-0 bg-rose-500 text-white text-[10px] rounded-full px-1" style={{display: 'none'}}>0</span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{currentUser?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{currentUser?.position || role}</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                className="size-10 rounded-full border-2 border-primary/20 object-cover"
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
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

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ToastProvider>
      <button
        type="button"
        onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        className="fixed right-4 top-4 z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
      </button>

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
              logoutLabel="Exit Demo"
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
    </ToastProvider>
  );
};

export default App;
