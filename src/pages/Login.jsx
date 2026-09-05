import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function Login() {
  const { login, managers, auctionSettings } = useAuth();
  const { showToast } = useToast();
  
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
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans">
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
      <div className="relative z-10 text-center px-6 w-full flex flex-col items-center justify-center">
         
         <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md mb-8 animate-slide-up shadow-sm" style={{ animationDelay: '100ms' }}>
            <span className="text-fuchsia-500 dark:text-fuchsia-400 font-bold">★</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Live Transfer Window</span>
         </div>
         
         <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-[1.05] animate-slide-up" style={{ animationDelay: '250ms' }}>
           ESD Premier League <br />
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-400 animate-gradient-x">
             Auction 2026.
           </span>
         </h1>
         
         <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 font-medium mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '400ms' }}>
           Step into the ultimate live football auction. Outsmart rival managers, secure top talents, and build a team destined for glory.
         </p>
         
         <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
           <button 
             onClick={() => setIsLoginOpen(true)}
             className="group relative px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-full text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_60px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] overflow-hidden"
           >
             <span className="relative z-10">Access Portal</span>
             <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
           </button>
         </div>
      </div>

      {/* Login Modal - Sleek & Fluid */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-md animate-slide-up" style={{ animationDuration: '0.3s' }} onClick={() => setIsLoginOpen(false)}></div>
          
          <div className="relative w-full max-w-[400px] bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-black/5 animate-slide-up border border-slate-100 dark:border-slate-800/60" style={{ animationDuration: '0.4s' }}>
            <button 
              onClick={() => setIsLoginOpen(false)} 
              className="absolute top-5 right-5 p-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              CLOSE
            </button>
            
            <div className="mb-8 pr-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1.5">Welcome Back</h2>
              <p className="text-sm text-slate-500 font-medium">Select your role to login.</p>
            </div>

            <div className="flex bg-slate-50 dark:bg-[#111] p-1 rounded-xl mb-8 border border-slate-100 dark:border-slate-800/50">
              {loginTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setRoleSelection(type.id);
                    setUsername('');
                    setPassword('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    roleSelection === type.id 
                      ? 'bg-white dark:bg-[#222] text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {roleSelection === 'manager' && (
                <div className="animate-slide-up" style={{ animationDuration: '0.3s' }}>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Manager Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. manager1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="animate-slide-up" style={{ animationDuration: '0.4s' }}>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {roleSelection === 'admin' ? 'Admin Password' : roleSelection === 'podium' ? 'Podium Password' : 'Password'}
                </label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3.5 text-sm mt-4 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-600/20">
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Footer Credit */}
      <div className="absolute bottom-6 w-full text-center z-10 animate-slide-up" style={{ animationDelay: '700ms' }}>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
          Developed by <span className="font-bold text-slate-600 dark:text-slate-400">Ashadul Alam Fardin</span> • <a href="mailto:mdfardin6118@gmail.com" className="hover:text-indigo-500 transition-colors">mdfardin6118@gmail.com</a>
        </p>
      </div>

    </div>
  );
}
