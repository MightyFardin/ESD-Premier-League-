import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Countdown from '../components/Countdown';

export default function ManagerDashboard() {
  const { user, managers, players, bids, auctionSettings } = useAuth();
  
  const [activeTab, setActiveTab] = useState('squad');
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

  const getPosCount = (pos) => myPlayers.filter(p => p.position === pos).length;
  
  const totalPlayers = players.length;
  const totalTeams = managers.length;
  const baseQuota = totalTeams > 0 ? Math.floor(totalPlayers / totalTeams) : 0;
  
  const spentBudget = (auctionSettings?.defaultManagerBudget || 10000) - (myTeam.budget || 0);
  const budgetPercent = Math.min(100, Math.max(0, (spentBudget / (auctionSettings?.defaultManagerBudget || 10000)) * 100));
  const squadPercent = Math.min(100, Math.max(0, (myPlayers.length / (baseQuota || 15)) * 100));
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-4 md:space-y-6 relative">
      
      {auctionSettings?.auctionStartDate && (
        <div className="mb-6 bg-indigo-900/10 dark:bg-indigo-900/20 rounded-[2rem] p-4 border border-indigo-500/20">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Auction Begins In</p>
          <Countdown targetDate={auctionSettings.auctionStartDate} />
        </div>
      )}

      {/* Compact Header & Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[30px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <p className="text-indigo-300 font-bold tracking-widest uppercase text-[9px] sm:text-[10px] mb-1">Manager Dashboard</p>
          <h1 className="text-lg sm:text-xl font-black text-white leading-tight truncate">
             {myTeam.teamName || myTeam.name}
          </h1>
        </div>

        <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Budget Left</p>
           <p className="font-black text-lg sm:text-xl text-indigo-600 dark:text-indigo-400">{myTeam.budget?.toLocaleString() || 0} <span className="text-[10px] sm:text-xs">pts</span></p>
        </div>

        <div className="bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Squad ({baseQuota} max)</p>
           <p className="font-black text-lg sm:text-xl text-emerald-600 dark:text-emerald-400">{myPlayers.length} <span className="text-[10px] sm:text-xs">plyrs</span></p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white dark:bg-[#111] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
           <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] sm:text-[10px] font-bold text-slate-500">
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-0.5"><span>GK:</span><span className="text-slate-900 dark:text-white">{getPosCount('Goalkeeper')}</span></div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-0.5"><span>DEF:</span><span className="text-slate-900 dark:text-white">{getPosCount('Defender')}</span></div>
             <div className="flex justify-between pt-0.5"><span>MID:</span><span className="text-slate-900 dark:text-white">{getPosCount('Midfielder')}</span></div>
             <div className="flex justify-between pt-0.5"><span>ATT:</span><span className="text-slate-900 dark:text-white">{getPosCount('Attacker')}</span></div>
           </div>
        </div>
      </div>

      {/* Wrapping Tabs */}
      <div className="flex flex-wrap bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl w-full gap-1.5 backdrop-blur-sm">
         <button onClick={() => setActiveTab('squad')} className={`flex-1 min-w-[70px] px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all text-center ${activeTab === 'squad' ? 'bg-white dark:bg-[#1a1a1c] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
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
                        <div>
                          <p className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words">{p.name}</p>
                          <p className="text-xs font-medium text-slate-500 tracking-wide">{p.position}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800/80 sm:border-0">
                        <p className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400">{p.soldPrice?.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-0.5">PTS</span></p>
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
                           <div>
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
                           <div>
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
                            <div className="overflow-hidden">
                               <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">{m.teamName || 'Unnamed'}</h4>
                               <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 mt-0.5 truncate">{m.name || 'Unknown'}</p>
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
                               <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (theirPlayers.length / (baseQuota || 15)) * 100)}%` }}></div>
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
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315]">
                <h3 className="font-black text-lg tracking-tight text-blue-600 dark:text-blue-500">Your Bidding Log</h3>
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
      </div>
    </div>
  );
}
