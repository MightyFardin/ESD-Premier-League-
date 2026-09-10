import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import Countdown from '../components/Countdown';

export default function Login() {
  const { login, managers, players, auctionSettings, fixtures = [] } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const hasLive = fixtures.some(f => f.status === 'live');
  const nextGame = fixtures.find(f => f.status === 'upcoming');
  
  const totalMatchesPlayed = fixtures.filter(f => f.status === 'completed').length;
  const totalGoals = fixtures.filter(f => f.status === 'completed').reduce((sum, f) => sum + (f.teamAGoals || 0) + (f.teamBGoals || 0), 0);
  
  const totalPlayersSold = players.filter(p => p.status === 'sold').length;
  const highestBid = players.filter(p => p.status === 'sold').reduce((max, p) => Math.max(max, p.soldPrice || 0), 0);
  
  const [roleSelection, setRoleSelection] = useState('manager'); // 'manager', 'admin', 'podium'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const loginTypes = [
    { id: 'manager', label: 'Manager' },
    { id: 'podium', label: 'Podium' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) return;
    
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



  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#030303] flex flex-col items-center relative font-sans w-full overflow-y-auto custom-scrollbar overflow-x-hidden pt-4 pb-6 px-4">
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
      
      {/* Football Pitch Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
         {/* Subtle Grid texture */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
         
         <style>{`
           @keyframes rollAcross {
             0% { left: -20%; transform: rotate(-180deg); }
             100% { left: 120%; transform: rotate(720deg); }
           }
           @keyframes varScan {
             0%, 100% { top: 10%; opacity: 0; }
             10% { opacity: 1; }
             50% { top: 90%; opacity: 1; }
             90% { opacity: 1; }
           }
         `}</style>

         {/* Static Football Pitch */}
         <div className="absolute opacity-30 dark:opacity-15 text-slate-400 dark:text-white/30 transition-transform duration-1000 ease-out">
            <div className="relative w-[150vw] h-[100vw] sm:w-[90vw] sm:h-[60vw] border-[4px] border-current rounded-xl flex items-center justify-center transform -rotate-12 scale-110">
               
               {/* Center Line */}
               <div className="absolute w-[4px] h-full bg-current"></div>
               {/* Center Circle */}
               <div className="absolute w-[30vw] h-[30vw] sm:w-[20vw] sm:h-[20vw] border-[4px] border-current rounded-full"></div>
               {/* Center Dot */}
               <div className="absolute w-4 h-4 bg-current rounded-full"></div>
               
               {/* Left Penalty Area */}
               <div className="absolute left-0 w-[20%] h-[50%] border-[4px] border-l-0 border-current">
                  <div className="absolute right-[-4px] top-1/2 transform -translate-y-1/2 translate-x-full w-[10vw] h-[15vw] sm:w-[6vw] sm:h-[10vw] border-[4px] border-l-0 border-current rounded-r-full border-t-transparent border-b-transparent"></div>
               </div>
               
               {/* Right Penalty Area */}
               <div className="absolute right-0 w-[20%] h-[50%] border-[4px] border-r-0 border-current">
                  <div className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 -translate-x-full w-[10vw] h-[15vw] sm:w-[6vw] sm:h-[10vw] border-[4px] border-r-0 border-current rounded-l-full border-t-transparent border-b-transparent"></div>
               </div>
               
               {/* VAR Scanning Line Animation */}
               <div className="absolute left-0 w-full h-1 bg-indigo-500/40 dark:bg-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.5)] animate-[varScan_8s_ease-in-out_infinite]"></div>

               {/* Continuous Rolling Football Animation */}
               <div className="absolute top-[60%] sm:top-[70%] w-12 h-12 sm:w-16 sm:h-16 text-slate-500 dark:text-white/40 animate-[rollAcross_12s_linear_infinite]">
                  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                     <circle cx="50" cy="50" r="48" />
                     <polygon points="50,30 65,42 59,59 41,59 35,42" fill="currentColor" opacity="0.6" />
                     <line x1="50" y1="30" x2="50" y2="2" />
                     <line x1="65" y1="42" x2="95" y2="35" />
                     <line x1="59" y1="59" x2="78" y2="88" />
                     <line x1="41" y1="59" x2="22" y2="88" />
                     <line x1="35" y1="42" x2="5" y2="35" />
                  </svg>
               </div>
               
            </div>
         </div>
         
         {/* Deep central fade to ensure text is readable */}
         <div className="absolute inset-0 from-transparent via-slate-50/90 to-slate-50 dark:via-[#030303]/90 dark:to-[#030303]" style={{ background: 'radial-gradient(circle, transparent 15%, var(--tw-gradient-stops))' }}></div>
         
         {/* Subtle Ambient Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-500/10 dark:bg-white/5 rounded-full blur-[120px]"></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-5xl text-center flex flex-col items-center justify-center min-h-[85vh] py-12">
         
         {auctionSettings?.appMode === 'tournament' ? (
            hasLive ? (
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded border border-red-300 dark:border-red-500/20 bg-red-100/50 dark:bg-red-500/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></span>
                 <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-widest">Live Match in Progress</span>
              </div>
            ) : (
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded border border-indigo-300 dark:border-indigo-500/20 bg-indigo-100/50 dark:bg-indigo-500/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></span>
                 <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Tournament Mode</span>
              </div>
            )
         ) : (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 animate-slide-up" style={{ animationDelay: '100ms' }}>
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
               <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Live Transfer Window</span>
            </div>
         )}
         
         <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-[1.1] animate-slide-up" style={{ animationDelay: '250ms' }}>
           ESD Premier League <br />
           <span className="text-slate-500 dark:text-slate-400">
             Auction 2026.
           </span>
         </h1>
         
         <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mb-8 max-w-xl mx-auto animate-slide-up px-4 leading-relaxed" style={{ animationDelay: '400ms' }}>
           The ultimate live football auction platform. Outsmart rival managers, secure top talents, and build a team destined for glory.
         </p>
         
         {auctionSettings?.appMode === 'tournament' ? (
           (() => {
             if (!nextGame || !nextGame.date) return null;
             const tA = managers.find(m => m.id === nextGame.teamAId);
             const tB = managers.find(m => m.id === nextGame.teamBId);
             return (
               <div className="mb-6 animate-slide-up w-full max-w-md mx-auto px-4" style={{ animationDelay: '450ms' }}>
                 <div className="bg-white/70 dark:bg-[#111]/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-xl relative overflow-hidden flex flex-col items-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 pointer-events-none"></div>
                    
                    <div className="w-full flex items-center justify-between gap-3 relative z-10 mb-2">
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-black text-xs sm:text-sm leading-tight text-slate-900 dark:text-white text-right break-words">{tA?.teamName || 'TBD'}</span>
                        {tA?.teamLogo ? <img src={tA.teamLogo} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm ring-2 ring-white dark:ring-[#111]">{tA?.teamName?.charAt(0) || 'A'}</div>}
                      </div>
                      
                      <div className="shrink-0 flex flex-col items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-200/80 dark:bg-slate-800/80 px-2 py-0.5 rounded shadow-sm">VS</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1 justify-start">
                        {tB?.teamLogo ? <img src={tB.teamLogo} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" /> : <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm ring-2 ring-white dark:ring-[#111]">{tB?.teamName?.charAt(0) || 'B'}</div>}
                        <span className="font-black text-xs sm:text-sm leading-tight text-slate-900 dark:text-white text-left break-words">{tB?.teamName || 'TBD'}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 w-full flex flex-col items-center bg-black/5 dark:bg-white/5 rounded-xl pt-1 pb-2 border border-black/5 dark:border-white/5">
                       <Countdown targetDate={nextGame.date} compact={true} />
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{new Date(nextGame.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {nextGame.venue || 'TBD'}</p>
                    </div>
                 </div>
               </div>
             );
           })()
         ) : (
           auctionSettings?.auctionStartDate && (
             <div className="mb-8 animate-slide-up w-full max-w-lg mx-auto" style={{ animationDelay: '450ms' }}>
                <Countdown targetDate={auctionSettings.auctionStartDate} />
             </div>
           )
         )}
         
         <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up mt-2 w-full max-w-sm sm:max-w-none mx-auto px-4 sm:px-0" style={{ animationDelay: '550ms' }}>
           <button 
             onClick={() => navigate(auctionSettings?.appMode === 'tournament' ? '/tournament' : '/auction')}
             className="flex-1 sm:flex-none sm:px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg text-xs sm:text-base hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
           >
             {hasLive && <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
             {auctionSettings?.appMode === 'tournament' ? 'Enter Tournament' : 'Watch Live'}
           </button>
           
           <button 
             onClick={() => setIsLoginOpen(true)}
             className="flex-1 sm:flex-none sm:px-8 py-3.5 bg-transparent border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-bold rounded-lg text-xs sm:text-base hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
           >
             Login
           </button>
         </div>
         
         <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full animate-slide-up" style={{ animationDelay: '700ms' }}>
           <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-white/10 hover:scale-105 transition-transform duration-300">
             <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{auctionSettings?.appMode === 'tournament' ? totalMatchesPlayed : totalPlayersSold}</div>
             <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{auctionSettings?.appMode === 'tournament' ? 'Matches Played' : 'Players Sold'}</div>
           </div>
           <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-white/10 hover:scale-105 transition-transform duration-300">
             <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">{auctionSettings?.appMode === 'tournament' ? totalGoals : highestBid.toLocaleString()}</div>
             <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{auctionSettings?.appMode === 'tournament' ? 'Total Goals' : 'Highest Bid'}</div>
           </div>
           <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-white/10 hover:scale-105 transition-transform duration-300">
             <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{managers.length}</div>
             <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Franchises</div>
           </div>
           <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-white/10 hover:scale-105 transition-transform duration-300">
             <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">{players.length}</div>
             <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Registered Players</div>
           </div>
         </div>
      </div>
      
      {/* Spacer to allow scrolling to the footer easily */}
      <div className="h-10 w-full shrink-0"></div>

      {/* Login Modal - Premium Split Layout */}
      {isLoginOpen && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-slide-up" style={{ animationDuration: '0.3s' }} onClick={() => setIsLoginOpen(false)}></div>
          
          <div className="relative w-full max-w-[360px] sm:max-w-3xl bg-white dark:bg-[#0a0a0c] rounded-[1.5rem] shadow-2xl shadow-black/20 animate-slide-up border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row overflow-hidden max-h-[90vh] sm:max-h-auto" style={{ animationDuration: '0.4s' }}>
            
            {/* Left side art (hidden on mobile) */}
            <div className="hidden sm:flex sm:w-5/12 bg-slate-50 dark:bg-[#08080a] relative items-center justify-center p-8 overflow-hidden shrink-0 border-r border-slate-100 dark:border-slate-800/60">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,0,0,1)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:12px_12px]"></div>
              
              <div className="relative z-10 flex flex-col items-start text-left w-full pl-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                   <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">System Online</span>
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-[1.1]">
                  Command<br/>
                  <span className="text-slate-400 dark:text-slate-500">Your</span><br/>
                  Legacy.
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] leading-relaxed max-w-[90%] border-l-2 border-indigo-500 pl-3">
                  Secure authentication gateway for authorized franchise personnel.
                </p>
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
                <p className="text-xs text-slate-500 font-medium">Select your role to continue.</p>
              </div>

              <div className="flex bg-slate-50 dark:bg-[#111] p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-800/50 relative">
                {loginTypes.map((type, i) => (
                  <button
                    type="button"
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

            <form onSubmit={handleLogin} className="space-y-4 mt-2">
              {roleSelection === 'manager' && (
                <div className="animate-slide-up" style={{ animationDuration: '0.3s' }}>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white transition-all"
                    placeholder="e.g. manager1"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="animate-slide-up" style={{ animationDuration: '0.4s' }}>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  {roleSelection === 'podium' ? 'Podium Password' : 'Password'}

                </label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-900 dark:focus:border-white transition-all"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold rounded-xl py-3 text-xs mt-3 active:scale-[0.98] transition-transform shadow-sm">
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
