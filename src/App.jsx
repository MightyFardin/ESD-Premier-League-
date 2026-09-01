import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { LayoutDashboard, Users, UserPlus, LogOut, Gavel, Settings as SettingsIcon, Settings2, Moon, Sun, Menu, X, Database, CheckCircle, WifiOff, Loader2 } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const ManagerManagement = lazy(() => import('./pages/ManagerManagement'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const LiveAuction = lazy(() => import('./pages/LiveAuction'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
  </div>
);

const DashboardLayout = ({ children }) => {
  const { user, logout, settings, setSettings, dbStatus } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = () => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const navItems = [];
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard size={20} /> });
    navItems.push({ path: '/admin/teams', label: 'Manage Teams', icon: <Users size={20} /> });
    navItems.push({ path: '/admin/settings', label: 'System Settings', icon: <Settings2 size={20} /> });
    navItems.push({ path: '/auction', label: 'Live Auction', icon: <Gavel size={20} /> });
  } else if (user?.role === 'manager') {
    navItems.push({ path: '/manager', label: 'Team Dashboard', icon: <Users size={20} /> });
    navItems.push({ path: '/auction', label: 'Live Auction', icon: <Gavel size={20} /> });
  } else if (user?.role === 'auctioneer') {
    navItems.push({ path: '/admin', label: 'Players Database', icon: <LayoutDashboard size={20} /> });
    navItems.push({ path: '/auction', label: 'Live Auction (Control)', icon: <Gavel size={20} /> });
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[rgb(var(--bg-main))]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-[150] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[200] w-72 bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-xl tracking-tighter">EPL</span>
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none">Auction</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role} Portal</p>
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
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`}
              >
                <div className={`${isActive ? 'opacity-100 scale-110' : 'opacity-70 scale-100'} transition-all`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-[#111] rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-indigo-700 dark:text-indigo-400">{user?.name.charAt(0)}</span>
                </div>
                <div className="truncate">
                  <p className="font-bold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-[#222] text-slate-500 hover:text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700">
                {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl transition-colors">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#0a0a0a]">
        <header className="h-20 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Menu size={24} />
            </button>
            <h2 className="font-black text-xl tracking-tight hidden sm:block">
              {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#111] rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
               {dbStatus === 'saving' && <Loader2 size={12} className="animate-spin text-indigo-500" />}
               {dbStatus === 'saved' && <CheckCircle size={12} className="text-emerald-500" />}
               {dbStatus === 'connected' && <Database size={12} className="text-slate-400 dark:text-slate-500" />}
               {dbStatus === 'disconnected' && <WifiOff size={12} className="text-red-500" />}
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                 {dbStatus === 'saving' ? 'Saving...' : 
                  dbStatus === 'saved' ? 'Saved' : 
                  dbStatus === 'connected' ? 'Synced' : 'Offline'}
               </span>
             </div>
             <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-500/20">
               Live
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 custom-scrollbar">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
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
              <ProtectedRoute allowedRole="admin">
                <ManagerManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRole="admin">
                <AdminSettings />
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
