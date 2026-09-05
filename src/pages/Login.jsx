import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import Countdown from '../components/Countdown';

export default function Login() {
  const { login, managers, players, auctionSettings } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [roleSelection, setRoleSelection] = useState('manager'); // 'manager', 'admin', 'podium'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) return;
    
    if (roleSelection === 'admin') {
      if (password === 'admin') {
        login({ id: 'admin-id', name: 'Admin', role: 'admin' });
      } else {
        showToast('Invalid Admin password!', 'error');
      }
      return;
    }

    if (roleSelection === 'podium') {
      if (password === (auctionSettings?.auctioneerPassword || '123')) {
        login({ id: 'auctioneer-id', name: 'Auctioneer', role: 'auctioneer' });
      } else {
        showToast('Invalid Podium password!', 'error');
      }
      return;
    }

    if (roleSelection === 'manager') {
      if (!username) return;
      const manager = managers.find(m => m.username === username.trim() && m.password === password);
      if (manager) {
        login({ id: manager.id, name: manager.name, role: 'manager' });
      } else {
        showToast('Invalid username or password!', 'error');
      }
    }
  };

  const loginTypes = [
    { id: 'manager', label: 'Manager' },
    { id: 'podium', label: 'Podium' },
    { id: 'admin', label: 'Admin' }
  ];

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#030303] flex flex-col items-center relative font-sans w-full overflow-hidden pt-4 pb-6 px-4">
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 4s linear infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          opacity: 0;
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Premium Colorful Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[5%] left-[15%] w-[40vw] h-[40vw] bg-fuchsia-400/20 dark:bg-fuchsia-600/15 blur-[100px] md:blur-[120px] rounded-full animate-[pulse_10s_ease-in-out_infinite]"></div>
         <div className="absolute bottom-[5%] right-[15%] w-[45vw] h-[45vw] bg-cyan-400/20 dark:bg-cyan-600/15 blur-[120px] md:blur-[140px] rounded-full animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
         <div className="absolute top-[40%] left-[45%] w-[35vw] h-[35vw] bg-violet-400/20 dark:bg-violet-600/15 blur-[100px] md:blur-[120px] rounded-full animate-[pulse_14s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-5xl text-center flex flex-col items-center my-auto">
         
         <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md animate-slide-up shadow-sm" style={{ animationDelay: '100ms' }}>
            <span className="text-fuchsia-500 dark:text-fuchsia-400 font-bold">★</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Live Transfer Window</span>
         </div>
         
         <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter leading-[1.05] animate-slide-up" style={{ animationDelay: '250ms' }}>
           ESD Premier League <br />
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-400 animate-gradient-x">
             Auction 2026.
           </span>
         </h1>
         
         <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium mb-6 max-w-xl mx-auto animate-slide-up px-4" style={{ animationDelay: '400ms' }}>
           Step into the ultimate live football auction. Outsmart rival managers, secure top talents, and build a team destined for glory.
         </p>
         
         {auctionSettings?.auctionStartDate && (
            <Countdown targetDate={auctionSettings.auctionStartDate} />
         )}
         
         <div className="flex flex-col items-center justify-center animate-slide-up mt-5" style={{ animationDelay: '550ms' }}>
           <button 
             onClick={() => navigate('/auction')}
             className="group relative px-10 py-4 sm:px-12 sm:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-full text-base sm:text-lg hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden w-full sm:w-auto flex items-center justify-center gap-3 mb-4"
           >
             <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Watch Live
           </button>
           
           <button 
             onClick={() => setIsLoginOpen(true)}
             className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 group"
           >
             <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
             Admin / Manager Access
           </button>
         </div>
         
         <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 w-full animate-slide-up" style={{ animationDelay: '700ms' }}>
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-md text-center hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-1">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
                {managers?.length || 0}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Franchises</p>
            </div>
            
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-md text-center hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-1">
              <p className="text-2xl sm:text-3xl font-black text-fuchsia-600 dark:text-fuchsia-400 mb-1">
                {players?.length || 0}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Players in Pool</p>
            </div>

            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-md text-center hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-1">
              <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 mb-1">
                {players?.filter(p => p.status === 'sold').length || 0}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Players Sold</p>
            </div>

            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white/40 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 backdrop-blur-md text-center hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-1">
              <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">
                {((managers?.length || 0) * (auctionSettings?.defaultManagerBudget || 10000)).toLocaleString()}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Purse</p>
            </div>
         </div>
      </div>

      {/* Login Modal - Premium Split Layout */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-slide-up" style={{ animationDuration: '0.3s' }} onClick={() => setIsLoginOpen(false)}></div>
          
          <div className="relative w-full max-w-[360px] sm:max-w-3xl bg-white dark:bg-[#0a0a0c] rounded-[1.5rem] shadow-2xl shadow-black/20 animate-slide-up border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row overflow-hidden max-h-[90vh] sm:max-h-auto" style={{ animationDuration: '0.4s' }}>
            
            {/* Left side art (hidden on mobile) */}
            <div className="hidden sm:flex sm:w-5/12 bg-indigo-900 relative items-center justify-center p-8 overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-fuchsia-700 to-indigo-900 opacity-90"></div>
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                   <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter mb-2 leading-tight">Command<br/>Your Legacy</h3>
                <p className="text-white/70 font-medium text-[11px] px-4">Secure authentication gateway for authorized personnel.</p>
              </div>
            </div>

            {/* Right side form */}
            <div className="w-full sm:w-7/12 p-5 sm:p-8 relative flex flex-col overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => setIsLoginOpen(false)} 
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                CLOSE
              </button>
              
              <div className="mb-6 pr-8">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Access Portal</h2>
                <p className="text-xs text-slate-500 font-medium">Select role to continue.</p>
              </div>

              <div className="flex bg-slate-50 dark:bg-[#111] p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-800/50 relative">
                {loginTypes.map((type, i) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setRoleSelection(type.id);
                      setUsername('');
                      setPassword('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all relative z-10 ${
                      roleSelection === type.id 
                        ? 'text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {roleSelection === type.id && (
                       <div className="absolute inset-0 bg-white dark:bg-[#222] rounded-lg border border-slate-200/50 dark:border-slate-700/50 -z-10 shadow-sm transition-all"></div>
                    )}
                    {type.label}
                  </button>
                ))}
              </div>

            <form onSubmit={handleLogin} className="space-y-3">
              {roleSelection === 'manager' && (
                <div className="animate-slide-up" style={{ animationDuration: '0.3s' }}>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. manager1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="animate-slide-up" style={{ animationDuration: '0.4s' }}>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {roleSelection === 'admin' ? 'Admin Password' : roleSelection === 'podium' ? 'Podium Password' : 'Password'}
                </label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 text-xs mt-3 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-600/20">
                Sign In
              </button>
            </form>
          </div>
        </div>
        </div>
      )}
      {/* Footer Credit */}
      <div className="w-full text-center z-10 mt-auto pt-12 animate-slide-up" style={{ animationDelay: '700ms' }}>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
          Developed by <span className="font-bold text-slate-600 dark:text-slate-400">Ashadul Alam Fardin</span> • <a href="mailto:mdfardin6118@gmail.com" className="hover:text-indigo-500 transition-colors">mdfardin6118@gmail.com</a>
        </p>
      </div>

    </div>
  );
}
