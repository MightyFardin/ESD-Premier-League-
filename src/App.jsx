import React, { Suspense, lazy, useState, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import GlobalNotice from './components/GlobalNotice';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by Error Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="text-4xl mb-6">⚠️</div>
          <h1 className="text-3xl font-black text-red-900 mb-4">Application Error</h1>
          <p className="text-red-700 font-bold mb-8">Something crashed on this page.</p>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 text-left w-full max-w-3xl overflow-auto">
            <p className="font-mono text-sm text-red-600 font-bold mb-4">{this.state.error && this.state.error.toString()}</p>
            <pre className="font-mono text-xs text-slate-600 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const ManagerManagement = lazy(() => import('./pages/ManagerManagement'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const LiveAuction = lazy(() => import('./pages/LiveAuction'));
const SystemLogs = lazy(() => import('./pages/SystemLogs'));

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);
const ServerIcon = ({ status }) => {
  let color = 'text-slate-400 dark:text-slate-500';
  if (status === 'saving') color = 'text-indigo-500 animate-pulse';
  else if (status === 'saved') color = 'text-emerald-500';
  else if (status === 'disconnected') color = 'text-red-500';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
  );
};

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const DashboardLayout = ({ children }) => {
  const { user, logout, settings, setSettings, dbStatus, liveAuction } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  // Auto-navigate when auction starts
  React.useEffect(() => {
    if (user?.role === 'manager' && liveAuction?.status === 'active' && liveAuction?.currentPlayerId) {
      if (location.pathname !== '/auction') {
        navigate('/auction');
      }
    }
  }, [liveAuction?.status, liveAuction?.currentPlayerId, user?.role, location.pathname, navigate]);

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const navItems = [];
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin Dashboard', icon: 'dashboard' });
    navItems.push({ path: '/admin/teams', label: 'Manage Teams', icon: 'teams' });
    navItems.push({ path: '/auction', label: 'Live Auction', icon: 'auction' });
    navItems.push({ path: '/admin/settings', label: 'System Settings', icon: 'settings' });
    navItems.push({ path: '/logs', label: 'System Logs', icon: 'logs' });
  } else if (user?.role === 'manager') {
    navItems.push({ path: '/manager', label: 'Team Dashboard', icon: 'dashboard' });
    navItems.push({ path: '/auction', label: 'Live Auction', icon: 'auction' });
  } else if (user?.role === 'auctioneer') {
    navItems.push({ path: '/admin', label: 'Players Database', icon: 'dashboard' });
    navItems.push({ path: '/auction', label: 'Live Auction (Control)', icon: 'auction' });
    navItems.push({ path: '/admin/teams', label: 'Manage Teams', icon: 'teams' });
  } else if (user?.role === 'spectator') {
    navItems.push({ path: '/auction', label: 'Live View', icon: 'auction' });
  }

  const NavIcon = ({ type }) => {
    switch(type) {
      case 'dashboard': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>;
      case 'teams': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'settings': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
      case 'logs': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
      case 'auction': return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"></path><path d="M17.64 15 22 10.64"></path><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16 4.6V3.86a3.36 3.36 0 0 0-.93-2.25L13.82.36"></path><path d="m10.64 6.36 4.36-4.36"></path></svg>;
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-[100vw] overflow-hidden bg-[rgb(var(--bg-main))]">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-[#0f0f11] border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <div className="h-24 flex items-center px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white font-black text-2xl tracking-tighter">EPL</span>
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight leading-none text-slate-900 dark:text-white">Auction</h1>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{user?.role} Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161618]'
                }`}
              >
                <div className={`mr-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  <NavIcon type={item.icon} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-[#161618] rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <ServerIcon status={dbStatus} />
                 <span className="text-xs font-bold uppercase tracking-widest text-slate-500 hidden sm:inline">
                   {dbStatus === 'saving' ? 'Saving' : dbStatus === 'saved' ? 'Saved' : dbStatus === 'connected' ? 'Synced' : 'Offline'}
                 </span>
               </div>
               <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-[#0a0a0c] text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 transition-colors">
                 {settings.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
               </button>
            </div>
            
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white font-black text-base rounded-xl transition-colors tracking-widest uppercase shadow-sm">
              LOGOUT
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-[#0a0a0c]">
         
         {/* Mobile Header */}
         <header className="md:hidden h-20 bg-white dark:bg-[#0f0f11] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-white font-black text-lg tracking-tighter">EPL</span>
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-white">Auction</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <ServerIcon status={dbStatus} />
               </div>
               
               <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-[#0a0a0c] text-slate-500 border border-slate-200 dark:border-slate-800">
                 {settings.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
               </button>
               
               <button onClick={() => setShowLogoutConfirm(true)} className="px-3.5 py-2 text-[10px] sm:text-xs font-black tracking-widest uppercase rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors shadow-sm">
                 LOGOUT
               </button>
            </div>
         </header>

         {/* Scrollable Main View */}
         <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 md:pb-0">
            <div className="p-4 md:p-10 mx-auto w-full max-w-7xl">
              {children}
            </div>
         </main>

         {/* Mobile Bottom Navigation (Flush with bottom) */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 z-[100] flex items-center justify-around px-2 pb-safe pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
           {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             let shortLabel = item.label;
             if (item.label.includes('Dashboard')) shortLabel = 'HOME';
             else if (item.label.includes('Live')) shortLabel = 'LIVE';
             else if (item.label.includes('Teams')) shortLabel = 'TEAMS';
             else if (item.label.includes('Settings')) shortLabel = 'CONFIG';
             else if (item.label.includes('Logs')) shortLabel = 'LOGS';
             else if (item.label.includes('Database')) shortLabel = 'DATA';
             
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={`flex flex-col items-center justify-center py-4 flex-1 transition-all duration-300 relative gap-1.5 ${
                   isActive 
                     ? 'text-indigo-600 dark:text-indigo-400' 
                     : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 <div className={`transition-transform ${isActive ? 'scale-110' : 'scale-100 opacity-70'}`}>
                    <NavIcon type={item.icon} />
                 </div>
                 <span className={`text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-transform ${isActive ? 'scale-105' : 'scale-100'}`}>{shortLabel}</span>
                 {isActive && (
                   <div className="absolute top-0 w-10 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-full shadow-sm shadow-indigo-600/30"></div>
                 )}
               </Link>
             );
           })}
         </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] p-6 rounded-3xl w-full max-w-xs border border-slate-200 dark:border-slate-800 shadow-2xl">
             <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white text-center">Confirm Logout</h3>
             <p className="text-sm font-bold text-slate-500 mb-6 text-center">Are you sure you want to sign out?</p>
             
             <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setShowLogoutConfirm(false); logout(); }} 
                  className="w-full py-3.5 font-black uppercase tracking-widest rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Yes, Logout
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold text-sm transition-colors">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="flex flex-col h-[100dvh] w-full overflow-hidden">
              <GlobalNotice />
              <div className="flex-1 relative overflow-hidden flex flex-col">
                <Routes>
                  <Route path="/" element={
                    <AuthRedirect />
                  } />

              <Route path="/admin" element={
                <ProtectedRoute allowedRole={['admin', 'auctioneer']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/teams" element={
                <ProtectedRoute allowedRole={['admin', 'auctioneer']}>
                  <ManagerManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              
              <Route path="/logs" element={
                <ProtectedRoute allowedRole={['admin']}>
                  <SystemLogs />
                </ProtectedRoute>
              } />

              <Route path="/manager" element={
                <ProtectedRoute allowedRole="manager">
                  <ManagerDashboard />
                </ProtectedRoute>
              } />

              <Route path="/auction" element={
                <AuctionRoute />
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AuctionRoute() {
  const { user } = useAuth();
  
  if (user && user.role !== 'spectator') {
    return (
      <Suspense fallback={<PageLoader />}>
        <DashboardLayout>
          <LiveAuction />
        </DashboardLayout>
      </Suspense>
    );
  }

  // Spectator View (Public)
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="h-full w-full bg-slate-50 dark:bg-[#030303] overflow-y-auto custom-scrollbar flex flex-col relative">
         <div className="px-4 pt-4 pb-2 sticky top-0 z-50 flex items-start bg-gradient-to-b from-slate-50 dark:from-[#030303] to-transparent">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-x-1 active:scale-95 group">
               <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
               <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            </Link>
         </div>
         <div className="flex-1 px-4 md:px-6 lg:px-8 pb-8 max-w-[1600px] mx-auto w-full">
            <LiveAuction />
         </div>
      </div>
    </Suspense>
  );
}

function AuthRedirect() {
  const { user, logout } = useAuth();
  
  React.useEffect(() => {
    if (user?.role === 'spectator') {
      logout();
    }
  }, [user, logout]);

  if (!user || user.role === 'spectator') return <Suspense fallback={<PageLoader />}><Login /></Suspense>;
  if (user.role === 'admin' || user.role === 'auctioneer') return <Navigate to="/admin" replace />;
  return <Navigate to="/manager" replace />;
}

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  
  if (allowedRole !== 'any') {
    if (Array.isArray(allowedRole)) {
       if (!allowedRole.includes(user.role)) return <Navigate to="/" replace />;
    } else {
       if (user.role !== allowedRole) return <Navigate to="/" replace />;
    }
  }
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </DashboardLayout>
  );
}
