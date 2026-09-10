import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../AuthContext';
import Countdown from '../components/Countdown';

export default function ManagerDashboard() {
  const { user, managers, players, bids, auctionSettings, socket, fixtures } = useAuth();
  
  const [activeTab, setActiveTab] = useState('squad');
  const [confirmClear, setConfirmClear] = useState(false);
  const [watchlist, setWatchlist] = useState(() => {
     const saved = localStorage.getItem(`watchlist_${user.id}`);
     return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
     localStorage.setItem(`watchlist_${user.id}`, JSON.stringify(watchlist));
  }, [watchlist, user.id]);

  const toggleWatchlist = (playerId) => {
     if (watchlist.includes(playerId)) {
        setWatchlist(watchlist.filter(id => id !== playerId));
     } else {
        setWatchlist([...watchlist, playerId]);
     }
  };
  
  const myTeam = managers.find(m => m.id === user.id) || { id: user.id, budget: 10000, name: user.name };
  const myPlayers = players.filter(p => p.teamId === myTeam.id);

  const getPosCount = (posKeywords) => myPlayers.filter(p => {
    if (!p.position) return false;
    const pos = p.position.toLowerCase();
    return posKeywords.some(kw => {
       const keyword = kw.toLowerCase();
       if (keyword.length <= 3) {
          const parts = pos.split(/[\s,;/|-]+/);
          return parts.includes(keyword);
       }
       return pos.includes(keyword);
    });
  }).length;
  
  const totalPlayers = players.length;
  const totalTeams = managers.length;
  const baseQuota = totalTeams > 0 ? Math.floor(totalPlayers / totalTeams) : 0;
  
  const spentBudget = (auctionSettings?.defaultManagerBudget || 10000) - (myTeam.budget || 0);
  const budgetPercent = Math.min(100, Math.max(0, (spentBudget / (auctionSettings?.defaultManagerBudget || 10000)) * 100));
  const squadPercent = Math.min(100, Math.max(0, (myPlayers.length / (baseQuota || 15)) * 100));
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
    <div className="space-y-4 md:space-y-6 relative">
      
      {auctionSettings?.auctionStartDate && (
        <div className="mb-6 bg-slate-100 dark:bg-[#1a1a1c] rounded-[2rem] p-4 border border-slate-300 dark:border-slate-700">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Auction Begins In</p>
          <Countdown targetDate={auctionSettings.auctionStartDate} />
        </div>
      )}

      {/* Compact Header & Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="col-span-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
          <p className="text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase text-[9px] sm:text-[10px] mb-1">Manager Dashboard</p>
          <div className="flex items-center gap-3 relative z-10">
            {myTeam.teamLogo && <img src={myTeam.teamLogo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-slate-700 dark:border-slate-200" />}
            <h1 className="text-lg sm:text-xl font-black text-inherit leading-tight truncate">
               {myTeam.teamName || myTeam.name}
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Budget Left</p>
           <p className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">{myTeam.budget?.toLocaleString() || 0} <span className="text-[10px] sm:text-xs">pts</span></p>
        </div>

        <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Squad (Min: {baseQuota}, Max: {auctionSettings?.maxSquadSize || 15})</p>
           <p className="font-black text-lg sm:text-xl text-emerald-600 dark:text-emerald-400">{myPlayers.length} <span className="text-[10px] sm:text-xs">plyrs</span></p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] sm:text-[10px] font-bold text-slate-500">
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-0.5"><span>GK:</span><span className="text-slate-900 dark:text-white">{getPosCount(['gk', 'goalkeeper'])}</span></div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-0.5"><span>DEF:</span><span className="text-slate-900 dark:text-white">{getPosCount(['def', 'cb', 'lb', 'rb', 'defender', 'defense'])}</span></div>
             <div className="flex justify-between pt-0.5"><span>MID:</span><span className="text-slate-900 dark:text-white">{getPosCount(['mid', 'cm', 'cdm', 'cam', 'lm', 'rm', 'midfielder', 'midfield'])}</span></div>
             <div className="flex justify-between pt-0.5"><span>ATT:</span><span className="text-slate-900 dark:text-white">{getPosCount(['att', 'forward', 'fw', 'st', 'lw', 'rw', 'cf', 'attacker', 'attack'])}</span></div>
           </div>
        </div>
      </div>

      {auctionSettings?.appMode === 'tournament' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Top Goal Scorer</p>
             <p className="font-black text-sm sm:text-lg text-slate-900 dark:text-white truncate">
               {(() => {
                  let maxGoals = 0;
                  let topScorer = null;
                  myPlayers.forEach(p => {
                     let goals = 0;
                     fixtures.forEach(f => {
                        (f.events || []).forEach(e => {
                           if (e.type === 'goal' && e.playerId === p.id) goals++;
                        });
                     });
                     if (goals > maxGoals) { maxGoals = goals; topScorer = p; }
                  });
                  return maxGoals > 0 ? (
                     <>{topScorer.name} <span className="text-indigo-600 dark:text-indigo-400 ml-1">({maxGoals})</span></>
                  ) : (
                     <span className="text-slate-400">0</span>
                  );
               })()}
             </p>
          </div>
          <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Top Assist Provider</p>
             <p className="font-black text-sm sm:text-lg text-slate-900 dark:text-white truncate">
               {(() => {
                  let maxAssists = 0;
                  let topAssist = null;
                  myPlayers.forEach(p => {
                     let assists = 0;
                     fixtures.forEach(f => {
                        (f.events || []).forEach(e => {
                           if (e.type === 'goal' && e.assistId === p.id) assists++;
                        });
                     });
                     if (assists > maxAssists) { maxAssists = assists; topAssist = p; }
                  });
                  return maxAssists > 0 ? (
                     <>{topAssist.name} <span className="text-emerald-600 dark:text-emerald-400 ml-1">({maxAssists})</span></>
                  ) : (
                     <span className="text-slate-400">0</span>
                  );
               })()}
             </p>
          </div>
        </div>
      )}

      {/* Wrapping Tabs */}
      <div className="flex flex-wrap bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl w-full gap-1.5 backdrop-blur-sm">
         <button onClick={() => setActiveTab('squad')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'squad' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Squad
         </button>
         <button onClick={() => setActiveTab('pool')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'pool' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Pool
         </button>
         <button onClick={() => setActiveTab('watchlist')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'watchlist' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Watch
         </button>
         <button onClick={() => setActiveTab('rivals')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'rivals' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Rivals
         </button>
         {auctionSettings?.appMode === 'tournament' && (
           <button onClick={() => setActiveTab('fixtures')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'fixtures' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
              Fixtures
           </button>
         )}
         <button onClick={() => setActiveTab('history')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'history' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Bids
         </button>
      </div>

      <div className="card-minimal p-0 overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none">
        {activeTab === 'squad' && (
           <>
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315]">
                <h3 className="font-black text-lg tracking-tight">Your Squad Roster</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111]">
                {myPlayers.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    No players bought yet. Your squad is empty.
                  </div>
                ) : (
                  myPlayers.map(p => (
                    <div key={p.id} className="p-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#161618] transition-colors group">
                      <div className="flex items-center gap-4">
                        {p.pic ? (
                          <img src={p.pic} alt={p.name || "Profile"} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + (p.name || 'Player') + '&background=random'; }} />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-slate-50 dark:ring-slate-900 shrink-0">
                             <span className="text-base font-black text-slate-400">{p.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">{p.name}</p>
                          <p className="text-xs font-medium text-slate-500 tracking-wide">{p.position}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800/80 sm:border-0">
                        <p className="text-base md:text-lg font-black text-slate-900 dark:text-white">{p.soldPrice?.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-0.5">PTS</span></p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Acquired For</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </>
        )}

        {activeTab === 'pool' && (
           <>
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg tracking-tight text-emerald-600 dark:text-emerald-500">Player Database</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Browse all available players and add to targets.</p>
                </div>
                <input 
                  type="text" 
                  placeholder="Search players by name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#111]">
                {players.filter(p => p.status === 'unsold' && p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">No unsold players match your search.</div>
                ) : (
                  players.filter(p => p.status === 'unsold' && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
                    const isStarred = watchlist.includes(p.id);
                    return (
                       <div key={p.id} className={`p-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group hover:bg-slate-50 dark:hover:bg-[#161618]`}>
                         <div className="flex items-center gap-4">
                           {p.pic ? (
                             <img src={p.pic} alt={p.name || "Profile"} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + (p.name || 'Player') + '&background=random'; }} />
                           ) : (
                             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-slate-50 dark:ring-slate-900 shrink-0">
                                <span className="text-base font-black text-slate-400">{p.name.charAt(0)}</span>
                             </div>
                           )}
                           <div className="flex-1 min-w-0">
                             <p className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors break-words">{p.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded uppercase tracking-widest">{p.position}</span>
                                <span className="text-xs font-bold text-slate-500"><span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Base</span>{auctionSettings?.defaultBasePrice || 100}</span>
                             </div>
                           </div>
                         </div>
                         <button 
                           onClick={() => toggleWatchlist(p.id)} 
                           className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-black uppercase tracking-widest rounded-xl sm:rounded-full transition-all border ${
                              isStarred 
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm' 
                                : 'bg-white dark:bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20'
                           }`}
                         >
                            {isStarred ? '✓ Watchlisted' : '+ Add to Target'}
                         </button>
                       </div>
                    );
                  })
                )}
              </div>
           </>
        )}

        {activeTab === 'watchlist' && (
           <>
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315]">
                <h3 className="font-black text-lg tracking-tight text-amber-600 dark:text-amber-500">Your High-Priority Targets</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Players you have actively shortlisted for the auction.</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#111]">
                {players.filter(p => watchlist.includes(p.id) && p.status === 'unsold').length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">Your watchlist is empty or all your targets are sold.<br/>Go to Player Pool to find new targets.</div>
                ) : (
                  players.filter(p => watchlist.includes(p.id) && p.status === 'unsold').map(p => {
                    return (
                       <div key={p.id} className={`p-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group bg-amber-50/30 dark:bg-amber-900/10`}>
                         <div className="flex items-center gap-4">
                           {p.pic ? (
                             <img src={p.pic} alt={p.name || "Profile"} className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + (p.name || 'Player') + '&background=random'; }} />
                           ) : (
                             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-2 ring-slate-50 dark:ring-slate-900 shrink-0">
                                <span className="text-base font-black text-slate-400">{p.name.charAt(0)}</span>
                             </div>
                           )}
                           <div className="flex-1 min-w-0">
                             <p className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors break-words">{p.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-[10px] font-bold text-amber-700 dark:text-amber-500 rounded uppercase tracking-widest">{p.position}</span>
                                <span className="text-xs font-bold text-slate-500"><span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Base</span>{auctionSettings?.defaultBasePrice || 100}</span>
                             </div>
                           </div>
                         </div>
                         <button 
                           onClick={() => toggleWatchlist(p.id)} 
                           className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-black uppercase tracking-widest rounded-xl sm:rounded-full transition-all border bg-white dark:bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:border-red-700 dark:hover:bg-red-900/20`}
                         >
                            Remove
                         </button>
                       </div>
                    );
                  })
                )}
              </div>
           </>
        )}

        {activeTab === 'rivals' && (
           <>
              <div className="p-4 sm:p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315]">
                <h3 className="font-black text-lg tracking-tight text-rose-600 dark:text-rose-500">Rival Analytics</h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">Track your competitors' budgets and squad progress in real-time.</p>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#111]">
                {managers.filter(m => m.id !== user.id).sort((a,b) => b.budget - a.budget).map(m => {
                   const theirPlayers = players.filter(p => p.teamId === m.id);
                   const colorClass = ['from-rose-500 to-orange-400', 'from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-purple-500 to-fuchsia-400'][m.id.length % 4];
                   
                   return (
                      <div key={m.id} className="bg-white dark:bg-[#161618] rounded-[1.5rem] p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                         {/* Name */}
                         <div className="flex justify-between items-start mb-4 relative z-10">
                             <div className="flex items-center gap-3 overflow-hidden">
                                {m.teamLogo && <img src={m.teamLogo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />}
                                <div className="overflow-hidden">
                                   <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">{m.teamName || 'Unnamed'}</h4>
                                   <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 mt-0.5 truncate">{m.name || 'Unknown'}</p>
                                </div>
                             </div>
                            <div className="text-right shrink-0">
                               <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-bold">Remaining</p>
                               <p className="font-black text-rose-600 dark:text-rose-400 text-lg sm:text-xl tracking-tight">{m.budget?.toLocaleString()} <span className="text-[10px] sm:text-xs text-rose-500/70">pts</span></p>
                            </div>
                         </div>
                         
                         {/* Progress bar */}
                         <div className="mb-4 relative z-10">
                            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                               <span>Squad Limit</span>
                               <span>{theirPlayers.length} / {baseQuota}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-slate-900 dark:bg-slate-300 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (theirPlayers.length / (baseQuota || 15)) * 100)}%` }}></div>
                            </div>
                         </div>
                         
                         {/* Spy Dropdown */}
                         <details className="group mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
                            <summary className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer list-none flex items-center justify-between hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                              Spy on Squad
                              <svg className="w-3.5 h-3.5 transform group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </summary>
                            <div className="mt-3 flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                              {theirPlayers.length === 0 ? (
                                <p className="text-[10px] sm:text-xs text-slate-400 italic">No players acquired yet.</p>
                              ) : (
                                theirPlayers.map(p => (
                                  <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-[#111] px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{p.name}</span>
                                    <span className="text-[9px] sm:text-[10px] font-black text-rose-500 shrink-0">{p.soldPrice} pts</span>
                                  </div>
                                ))
                              )}
                            </div>
                         </details>
                      </div>
                   )
                })}
              </div>
           </>
        )}

        {activeTab === 'history' && (
           <>
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315] flex justify-between items-center">
                <h3 className="font-black text-lg tracking-tight text-blue-600 dark:text-blue-500">Your Bidding Log</h3>
                {bids.filter(b => b.managerId === user.id).length > 0 && (
                  <button onClick={() => setConfirmClear(true)} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md transition-colors">Clear</button>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#111]">
                {bids.filter(b => b.managerId === user.id).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium">You haven't placed any bids yet.</div>
                ) : (
                  bids.filter(b => b.managerId === user.id).map((bid, i) => {
                     const player = players.find(p => p.id === bid.playerId);
                     const won = player?.status === 'sold' && player?.teamId === user.id;
                     return (
                        <div key={i} className={`p-5 md:px-8 flex justify-between items-center transition-colors ${won ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-[#161618]'}`}>
                           <div>
                              <p className="font-bold text-base text-slate-900 dark:text-white">Bid on <span className="font-black">{player?.name || 'Unknown'}</span></p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{new Date(bid.timestamp).toLocaleString()}</p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-1">
                              <p className={`font-black text-xl tracking-tight ${won ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{bid.amount.toLocaleString()} <span className="text-[10px] opacity-70 font-bold">PTS</span></p>
                              {won ? (
                                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-sm">Acquired</span>
                              ) : (
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm">Outbid</span>
                              )}
                           </div>
                        </div>
                     )
                  })
                )}
              </div>
           </>
        )}

        {activeTab === 'fixtures' && auctionSettings?.appMode === 'tournament' && (
           <div className="space-y-6 animate-fade-in">
              {/* My Next Match */}
              {fixtures.some(f => (f.teamAId === user.id || f.teamBId === user.id) && f.status === 'upcoming') && (() => {
                 const myNextMatch = fixtures.find(f => (f.teamAId === user.id || f.teamBId === user.id) && f.status === 'upcoming');
                 const oppId = myNextMatch.teamAId === user.id ? myNextMatch.teamBId : myNextMatch.teamAId;
                 const oppTeam = managers.find(m => m.id === oppId);
                 return (
                    <div className="bg-indigo-600 dark:bg-indigo-900/40 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-4">Your Next Match</p>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                         <div className="text-sm font-black text-indigo-100 uppercase tracking-widest opacity-80 shrink-0">VS</div>
                         <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl flex-1 border border-white/5 shadow-sm">
                           {oppTeam?.teamLogo ? <img src={oppTeam.teamLogo} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white/20" /> : <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-sm ring-2 ring-white/20">{oppTeam?.teamName?.charAt(0) || '?'}</div>}
                           <span className="font-black text-sm sm:text-base">{oppTeam?.teamName || 'TBD'}</span>
                         </div>
                       </div>
                       <p className="text-[11px] font-bold text-indigo-200">{new Date(myNextMatch.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {myNextMatch.venue || 'TBD'}</p>
                    </div>
                 );
              })()}

              {/* All Fixtures List */}
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-1 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm">
                 <div className="p-4 px-5">
                    <h2 className="font-black text-sm uppercase tracking-widest text-slate-400">All Fixtures</h2>
                 </div>
                 {[...fixtures].sort((a, b) => {
                    const order = { 'live': 1, 'upcoming': 2, 'completed': 3 };
                    return (order[a.status] || 4) - (order[b.status] || 4);
                 }).map(f => {
                    const tA = managers.find(m => m.id === f.teamAId);
                    const tB = managers.find(m => m.id === f.teamBId);
                    const isMyMatch = f.teamAId === user.id || f.teamBId === user.id;
                    return (
                       <div key={f.id} className={`p-4 flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors ${isMyMatch ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-[#161618]'}`}>
                          <div className="flex items-center gap-3 flex-1 sm:justify-end w-full sm:w-auto justify-center">
                             <span className={`font-bold text-[13px] ${isMyMatch && f.teamAId === user.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{tA?.teamName || 'TBD'}</span>
                             {tA?.teamLogo ? <img src={tA.teamLogo} className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">{tA?.teamName?.charAt(0) || 'A'}</div>}
                          </div>
                          
                          <div className="flex flex-col items-center justify-center shrink-0 w-24">
                             {f.status === 'completed' ? (
                                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded font-black tracking-widest text-sm shadow-sm">{f.teamAGoals ?? 0} - {f.teamBGoals ?? 0}</div>
                             ) : f.status === 'live' ? (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-1 rounded flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span><span className="text-[10px] font-black uppercase tracking-widest">Live</span></div>
                             ) : (
                                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded uppercase tracking-widest">VS</div>
                             )}
                          </div>

                          <div className="flex items-center gap-3 flex-1 sm:justify-start w-full sm:w-auto justify-center flex-row-reverse sm:flex-row">
                             {tB?.teamLogo ? <img src={tB.teamLogo} className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">{tB?.teamName?.charAt(0) || 'B'}</div>}
                             <span className={`font-bold text-[13px] ${isMyMatch && f.teamBId === user.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{tB?.teamName || 'TBD'}</span>
                          </div>
                       </div>
                    );
                 })}
                 {fixtures.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">No fixtures scheduled.</div>
                 )}
              </div>
           </div>
        )}
      </div>
    </div>
    
    {confirmClear && createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
         <div className="bg-white dark:bg-[#111] p-6 rounded-2xl w-full max-w-sm shadow-2xl text-center animate-slide-up" style={{ animationDuration: '0.2s' }}>
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-3xl font-black text-red-500">
               !
            </div>
            <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">Clear History?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete your entire bidding history? This cannot be undone.</p>
            <div className="flex gap-3">
               <button onClick={() => setConfirmClear(false)} className="flex-1 btn-secondary py-3">Cancel</button>
               <button onClick={() => {
                  socket?.emit('clearManagerBids', user.id);
                  setConfirmClear(false);
               }} className="flex-1 py-3 font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors">Clear</button>
            </div>
         </div>
      </div>,
      document.body
    )}
    </>
  );
}
