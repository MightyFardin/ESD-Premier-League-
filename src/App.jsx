import React, { Suspense, lazy, useState, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';

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

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const DashboardLayout = ({ children }) => {
  const { user, logout, settings, setSettings, dbStatus, liveAuction } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


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
    navItems.push({ path: '/admin', label: 'Admin Dashboard' });
    navItems.push({ path: '/admin/teams', label: 'Manage Teams' });
    navItems.push({ path: '/admin/settings', label: 'System Settings' });
    navItems.push({ path: '/logs', label: 'System Logs' });
    navItems.push({ path: '/auction', label: 'Live Auction' });
  } else if (user?.role === 'manager') {
    navItems.push({ path: '/manager', label: 'Team Dashboard' });
    navItems.push({ path: '/auction', label: 'Live Auction' });
  } else if (user?.role === 'auctioneer') {
    navItems.push({ path: '/admin', label: 'Players Database' });
    navItems.push({ path: '/admin/teams', label: 'Manage Teams' });
    navItems.push({ path: '/auction', label: 'Live Auction (Control)' });
  }

  return (
    <div className="flex h-[100dvh] w-[100vw] overflow-hidden bg-[rgb(var(--bg-main))]">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-[#0f0f11] border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <span className="text-white font-black text-xl tracking-tighter">EPL</span>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-white">Auction</h1>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{user?.role} Portal</p>
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
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-[#161618] border border-transparent'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 mr-2"></div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="bg-slate-50 dark:bg-[#161618] rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#111] rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                 {dbStatus === 'saving' && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>}
                 {dbStatus === 'saved' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                 {dbStatus === 'connected' && <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>}
                 {dbStatus === 'disconnected' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden sm:inline">
                   {dbStatus === 'saving' ? 'Saving' : dbStatus === 'saved' ? 'Saved' : dbStatus === 'connected' ? 'Synced' : 'Offline'}
                 </span>
               </div>
               <button onClick={toggleTheme} className="px-3 py-1.5 text-[10px] font-black tracking-widest uppercase rounded-lg bg-white dark:bg-[#0a0a0c] text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-800 transition-colors">
                 {settings.theme === 'dark' ? 'LIGHT' : 'DARK'}
               </button>
            </div>
            
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white dark:bg-red-900/20 dark:hover:bg-red-600 dark:text-red-400 dark:hover:text-white font-bold text-sm rounded-lg transition-colors tracking-widest uppercase">
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 dark:bg-[#0a0a0c]">
         
         {/* Mobile Header */}
         <header className="md:hidden h-16 bg-white dark:bg-[#0f0f11] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="text-white font-black text-sm tracking-tighter">EPL</span>
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight leading-none text-slate-900 dark:text-white">Auction</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-[#111] rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                 {dbStatus === 'saving' && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>}
                 {dbStatus === 'saved' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                 {dbStatus === 'connected' && <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>}
                 {dbStatus === 'disconnected' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
               </div>
               
               <button onClick={toggleTheme} className="px-2 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg bg-white dark:bg-[#0a0a0c] text-slate-500 border border-slate-200 dark:border-slate-800">
                 {settings.theme === 'dark' ? 'LT' : 'DK'}
               </button>
               
               <button onClick={logout} className="px-2 py-1 text-[9px] font-black tracking-widest uppercase rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                 EXIT
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
                 className={`flex flex-col items-center justify-center py-6 flex-1 transition-all duration-300 relative ${
                   isActive 
                     ? 'text-indigo-600 dark:text-indigo-400' 
                     : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                 }`}
               >
                 <span className={`text-[11px] sm:text-xs font-black tracking-widest uppercase transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>{shortLabel}</span>
                 {isActive && (
                   <div className="absolute top-0 w-10 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-b-full shadow-sm shadow-indigo-600/30"></div>
                 )}
               </Link>
             );
           })}
         </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
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
                <ProtectedRoute allowedRole="any">
                  <LiveAuction />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AuthRedirect() {
  const { user } = useAuth();
  if (!user) return <Suspense fallback={<PageLoader />}><Login /></Suspense>;
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
