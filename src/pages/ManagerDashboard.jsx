import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

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
  
  const spentBudget = (auctionSettings?.defaultManagerBudget || 10000) - (myTeam.budget || 0);
  const budgetPercent = Math.min(100, Math.max(0, (spentBudget / (auctionSettings?.defaultManagerBudget || 10000)) * 100));
  const squadPercent = Math.min(100, Math.max(0, (myPlayers.length / (auctionSettings?.maxSquadSize || 15)) * 100));
  
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 dark:from-indigo-950 dark:via-slate-900 dark:to-black p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-indigo-900/20 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/20 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <p className="text-indigo-300 font-black tracking-[0.3em] uppercase text-[10px] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Manager Dashboard
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 leading-tight">
             Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300">{myTeam.teamName || myTeam.name}</span>
          </h1>
          <p className="text-indigo-200/80 font-medium text-sm md:text-base max-w-xl">
             Your strategic command center. Review your remaining budget, monitor squad balance, and prepare for upcoming biddings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Card */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#111] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg">Remaining Budget</p>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">{spentBudget.toLocaleString()} pts</p>
                </div>
             </div>
             <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {myTeam.budget?.toLocaleString() || 0} <span className="text-lg text-slate-400 font-bold ml-1">PTS</span>
             </h2>
             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${budgetPercent}%` }}></div>
             </div>
          </div>
        </div>

        {/* Squad Card */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#111] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">Squad Size</p>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300">{auctionSettings?.maxSquadSize || 15}</p>
                </div>
             </div>
             <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {myPlayers.length} <span className="text-lg text-slate-400 font-bold ml-1">PLAYERS</span>
             </h2>
             <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${squadPercent}%` }}></div>
             </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#111] border border-slate-200/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="relative z-10">
             <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg inline-block mb-4">Squad Balance</p>
             <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm font-bold mt-1">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                   <span className="text-slate-500">Goalkeepers</span> <span className="text-slate-900 dark:text-white">{getPosCount('Goalkeeper')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                   <span className="text-slate-500">Defenders</span> <span className="text-slate-900 dark:text-white">{getPosCount('Defender')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                   <span className="text-slate-500">Midfielders</span> <span className="text-slate-900 dark:text-white">{getPosCount('Midfielder')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                   <span className="text-slate-500">Attackers</span> <span className="text-slate-900 dark:text-white">{getPosCount('Attacker')}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl w-full max-w-3xl overflow-x-auto custom-scrollbar backdrop-blur-sm">
         <button onClick={() => setActiveTab('squad')} className={`flex-1 px-4 sm:px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'squad' ? 'bg-white dark:bg-[#1a1a1c] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            My Squad
         </button>
         <button onClick={() => setActiveTab('pool')} className={`flex-1 px-4 sm:px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'pool' ? 'bg-white dark:bg-[#1a1a1c] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Player Pool
         </button>
         <button onClick={() => setActiveTab('watchlist')} className={`flex-1 px-4 sm:px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'watchlist' ? 'bg-white dark:bg-[#1a1a1c] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Watchlist
         </button>
         <button onClick={() => setActiveTab('rivals')} className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'rivals' ? 'bg-white dark:bg-[#1a1a1c] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
            Rivals
         </button>
         <button onClick={() => setActiveTab('history')} className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white dark:bg-[#1a1a1c] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>
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
                          <img src={p.pic} alt="Profile" className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" />
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
                             <img src={p.pic} alt="Profile" className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" />
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
                             <img src={p.pic} alt="Profile" className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 shrink-0" />
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
              <div className="p-6 md:px-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#131315]">
                <h3 className="font-black text-lg tracking-tight text-rose-600 dark:text-rose-500">Rival Analytics</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111]">
                {managers.filter(m => m.id !== user.id).sort((a,b) => b.budget - a.budget).map(m => {
                   const theirPlayers = players.filter(p => p.teamId === m.id);
                   const maxBudget = auctionSettings?.defaultManagerBudget || 10000;
                   const budgetPercent = Math.max(0, Math.min(100, (m.budget / maxBudget) * 100));
                   return (
                      <div key={m.id} className="p-6 md:px-8 hover:bg-slate-50/50 dark:hover:bg-[#141416] transition-colors">
                         <div className="flex justify-between items-end mb-4">
                            <div>
                               <p className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{m.teamName || m.name}</p>
                               <p className="text-xs text-slate-500 font-bold tracking-wide mt-0.5">{theirPlayers.length} Players Acquired</p>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-rose-600 dark:text-rose-400 text-2xl tracking-tight">{m.budget?.toLocaleString()}</p>
                               <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1">Remaining Pts</p>
                            </div>
                         </div>
                         <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50">
                            <div className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-1000 rounded-full" style={{ width: `${budgetPercent}%` }}></div>
                         </div>
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
