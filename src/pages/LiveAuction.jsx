import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import CustomSelect from '../components/CustomSelect';
import Countdown from '../components/Countdown';

const getSessionStr = (studentId) => {
  if (!studentId || studentId.length < 2) return 'Unknown';
  const prefixStr = studentId.substring(0, 2);
  const prefix = parseInt(prefixStr);
  if (isNaN(prefix)) return 'Unknown';
  return `20${prefixStr}-20${prefix + 1}`;
};

const getPositionStr = (pos) => {
  if (!pos) return 'Unknown';
  const upper = pos.toUpperCase();
  if (upper === 'GK' || upper === 'GOALKEEPER') return 'Goalkeeper';
  if (upper === 'DEF' || upper === 'DEFENDER') return 'Defender';
  if (upper === 'MID' || upper === 'MIDFIELD' || upper === 'MIDFIELDER') return 'Midfield';
  if (upper === 'FWD' || upper === 'ATTACKER' || upper === 'FORWARD') return 'Attacker';
  return pos;
};

export default function LiveAuction() {
  const { user, liveAuction, players, managers, auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  const [customBid, setCustomBid] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  
  // Data for Spectator Overview
  const topSignings = [...players].filter(p => p.status === 'sold').sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)).slice(0, 10);
  const selectedTeam = managers.find(m => m.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedSession, setSelectedSession] = useState('All');
  
  const getTeamStats = (managerId) => {
    const teamPlayers = players.filter(p => p.status === 'sold' && p.teamId === managerId);
    const spent = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const budget = auctionSettings?.defaultManagerBudget || 1000;
    return { spent, remaining: budget - spent, players: teamPlayers.length };
  };
  const [viewTab, setViewTab] = useState('unsold'); // 'unsold', 'sold'
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [revealStage, setRevealStage] = useState('ready'); // 'position', 'session', 'full', 'ready'
  
  const [confirmAction, setConfirmAction] = useState(null); // 'sell' or 'unsold'
  const [confirmUndoPlayer, setConfirmUndoPlayer] = useState(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleBidError = (err) => {
      showToast(err.message || "Bid failed. Are you logged in with a valid manager account?", "error");
    };
    
    const handleAuctionAlert = (msg) => {
      showToast(msg, "error");
    };
    
    socket.on('bidError', handleBidError);
    socket.on('auctionAlert', handleAuctionAlert);
    
    return () => {
       socket.off('bidError', handleBidError);
       socket.off('auctionAlert', handleAuctionAlert);
    };
  }, [socket, showToast]);

  const endAtRef = useRef(null);
  
  useEffect(() => {
    if (liveAuction.timerPaused) {
      setTimeLeft(liveAuction.timerRemaining || 0);
      endAtRef.current = null;
      return;
    }
    
    // Only set new target if serverEndAt actually changed (e.g., new bid or addTime)
    if (!endAtRef.current || endAtRef.current.serverEndAt !== liveAuction.auctionEndAt) {
      endAtRef.current = {
        serverEndAt: liveAuction.auctionEndAt,
        localTarget: Date.now() + ((liveAuction.timerRemaining || 0) * 1000)
      };
    }
    
    const targetEndAt = endAtRef.current.localTarget;
    let interval = null;
    
    if (liveAuction.status === 'active') {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= targetEndAt) {
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.ceil((targetEndAt - now) / 1000));
        }
      }, 100);
    } else {
      setTimeLeft(0);
    }
    
    return () => clearInterval(interval);
  }, [liveAuction.auctionEndAt, liveAuction.status, liveAuction.timerPaused, liveAuction.timerRemaining]);

  const currentPlayer = liveAuction.currentPlayerId ? players.find(p => p.id === liveAuction.currentPlayerId) : null;

  useEffect(() => {
    if (currentPlayer?.id && liveAuction.status === 'active') {
      setRevealStage('position');
      const t1 = setTimeout(() => setRevealStage('session'), 2000);
      const t2 = setTimeout(() => setRevealStage('full'), 4000);
      const t3 = setTimeout(() => setRevealStage('ready'), 7000); // 3s for floating badge
      
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setRevealStage('ready');
    }
  }, [currentPlayer?.id, liveAuction.status]);

  const highestBidder = liveAuction.highestBidderId ? managers.find(m => m.id === liveAuction.highestBidderId) : null;
  const myTeam = user ? (managers.find(m => m.id === user.id) || { id: user.id, budget: auctionSettings?.defaultManagerBudget || 10000, name: user.name }) : null;

  const currentIncrement = liveAuction.currentIncrement || 10;
  const isFirstBid = !liveAuction.highestBidderId;

  const handleBid = (overrideAmount = null) => {
    if (user?.role !== 'manager') return;
    
    // Check if timer ran out
    if (timeLeft === 0 && (liveAuction.auctionEndAt || liveAuction.timerPaused)) {
      showToast("Time is up! No more bids allowed.", 'error');
      return;
    }

    const amount = overrideAmount || (isFirstBid ? liveAuction.currentBid : liveAuction.currentBid + currentIncrement);
    
    if (!isFirstBid && amount <= liveAuction.currentBid) {
      showToast("Bid must be strictly higher than current bid!", 'error');
      return;
    }
    if (liveAuction.highestBidderId === myTeam.id) {
      showToast("You are already the highest bidder!", 'error');
      return;
    }
    if (isFirstBid && amount < liveAuction.currentBid) {
      showToast("First bid must be at least the base price!", 'error');
      return;
    }
    if (myTeam.budget < amount) {
      showToast("Not enough budget!", 'error');
      return;
    }
    
    socket?.emit('placeBid', { amount, managerId: myTeam.id });
    setCustomBid('');
  };

  const handleStartAuction = (playerId) => {
    socket?.emit('startAuction', playerId);
  };

  // Filter Data
  const baseFilteredPlayers = players.filter(p => viewTab === 'all' || p.status === viewTab);
  const allSessions = ['All', ...Array.from(new Set(players.map(p => getSessionStr(p.studentId)))).sort()];
  const allPositions = ['All', 'Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
  
  const filteredPlayers = baseFilteredPlayers.filter(p => {
    const matchSession = selectedSession === 'All' || getSessionStr(p.studentId) === selectedSession;
    const matchPosition = selectedPosition === 'All' || getPositionStr(p.position) === selectedPosition;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (p.studentId && p.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSession && matchPosition && matchSearch;
  });

  return (
    <div className={`max-w-6xl mx-auto space-y-4 md:space-y-6 pb-40 md:pb-0 ${isFullscreen ? 'p-2 sm:p-4 md:p-8 bg-slate-50/50 dark:bg-[#0a0a0a] min-h-screen overflow-y-auto' : ''}`}>
      
      <div className="flex items-center justify-between bg-white dark:bg-[#111] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-widest px-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Room
        </div>
        <button 
          onClick={toggleFullscreen} 
          className="btn-secondary py-1.5 px-3 text-[10px] font-black uppercase tracking-widest"
        >
          {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
        </button>
      </div>

      {liveAuction.status === 'idle' || !currentPlayer ? (
        <div className="space-y-6">
          {(!user?.role || user?.role === 'manager' || user?.role === 'spectator') && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center p-8 card-minimal relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-100 dark:bg-[#161616] pointer-events-none"></div>
              {auctionSettings?.auctionStartDate ? (
                <div className="relative z-10 w-full animate-pop-in">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest text-slate-900 dark:text-white">Auction Commences In</h2>
                  <Countdown targetDate={auctionSettings.auctionStartDate} />
                </div>
              ) : (
                <div className="relative z-10 animate-pop-in">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 mx-auto text-2xl font-black text-slate-300">
                    <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Awaiting Action</h2>
                  <p className="text-slate-500">The auction floor is currently idle. Bidding will begin shortly.</p>
                </div>
              )}
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'auctioneer') && (
            <div className="card-minimal p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold">Player Queue</h2>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
                     <button onClick={() => setViewTab('unsold')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'unsold' ? 'bg-white dark:bg-[#222] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Unsold ({players.filter(p => p.status === 'unsold').length})</button>
                     <button onClick={() => setViewTab('sold')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'sold' ? 'bg-white dark:bg-[#222] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Sold ({players.filter(p => p.status === 'sold').length})</button>
                     <button onClick={() => setViewTab('all')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'all' ? 'bg-white dark:bg-[#222] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>All ({players.length})</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 w-full z-20 bg-slate-50 dark:bg-[#161618] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="col-span-3 sm:col-span-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search player..." 
                      className="input-field pl-9 h-10 w-full bg-white dark:bg-[#111]"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <CustomSelect 
                      name="position"
                      value={selectedPosition}
                      onChange={setSelectedPosition}
                      options={allPositions.map(p => ({ value: p, label: p === 'All' ? 'Position' : p }))}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <CustomSelect 
                      name="session"
                      value={selectedSession}
                      onChange={setSelectedSession}
                      options={allSessions.map(s => ({ value: s, label: s === 'All' ? 'Session' : s }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.length === 0 && (
                  <p className="text-slate-500 col-span-full text-center py-8">No players found matching the filters.</p>
                )}
                {filteredPlayers.map(p => (
                  <div key={p.id} className="bg-slate-50 dark:bg-[#1a1a1a] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between gap-3">
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                       {p.pic ? (
                          <img src={p.pic} alt={p.name} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + p.name + '&background=random'; }} />
                       ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{p.name.charAt(0)}</div>
                       )}
                       <div className="flex-1 min-w-0">
                         <p className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white leading-tight">{p.name}</p>
                         <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.position} • {getSessionStr(p.studentId)}</p>
                         {p.status === 'sold' && (
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                               Sold to {managers.find(m => m.id === p.teamId)?.name || 'Unknown'}
                            </p>
                         )}
                         {p.status === 'unsold' && viewTab !== 'unsold' && (
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Unsold</p>
                         )}
                       </div>
                     </div>
                     <div className="shrink-0 flex items-center gap-1.5 pl-2">
                       {p.status === 'unsold' && (
                         <button onClick={() => handleStartAuction(p.id)} className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center justify-center active:scale-95 transition-transform shadow-md shadow-indigo-600/20" title="Start Auction">
                           <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         </button>
                       )}
                       {p.status === 'sold' && (user?.role === 'admin' || user?.role === 'auctioneer') && (
                         <button onClick={() => setConfirmUndoPlayer(p)} className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20 dark:hover:bg-red-900/40 flex items-center justify-center active:scale-95 transition-transform" title="Mark Unsold">
                           <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
                         </button>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 relative">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Top Bar: Timer (No overlaps, cleanly positioned) */}
            {(liveAuction.auctionEndAt || liveAuction.timerPaused) && (
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                     <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Live Auction</span>
                  </div>
                  <div className={`px-6 py-2 rounded-xl font-black text-2xl md:text-3xl transition-colors ${
                    timeLeft === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : liveAuction.timerPaused ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : timeLeft <= 10 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  }`}>
                    {timeLeft === 0 ? 'TIME UP!' : liveAuction.timerPaused ? `PAUSED (00:${timeLeft.toString().padStart(2, '0')})` : `00:${timeLeft.toString().padStart(2, '0')}`}
                  </div>
              </div>
            )}
            
            {/* Top Bar: Admin Controls (Zero Scrolling!) */}
            {(user?.role === 'admin' || user?.role === 'auctioneer') && liveAuction.status === 'active' && (
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm animate-pop-in">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Auctioneer Controls</p>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-2 w-full md:w-auto">
                       <button onClick={() => setConfirmAction('sell')} className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                         <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> Finalize
                       </button>
                       <button onClick={() => setConfirmAction('unsold')} className="flex-1 bg-slate-200 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-900/40 text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                         <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg> Unsold
                       </button>
                       <button onClick={() => setConfirmAction('cancel')} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                         Cancel
                       </button>
                       <button onClick={() => socket?.emit(liveAuction.timerPaused ? 'resumeTimer' : 'pauseTimer')} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                         {liveAuction.timerPaused ? (
                           <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Resume</>
                         ) : (
                           <><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause</>
                         )}
                       </button>
                       <button onClick={() => socket?.emit('addTime', 10)} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                         <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> 10s
                       </button>
                       {liveAuction.history?.length > 0 && (
                         <button onClick={() => socket?.emit('revertBid')} className="flex-1 bg-slate-200 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/30 text-slate-700 hover:text-amber-700 dark:text-slate-300 dark:hover:text-amber-400 py-3 md:py-2 md:px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-1.5">
                           <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg> Undo
                         </button>
                       )}
                     </div>
                 </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 flex-1">
              
              {/* Left Side: Player Info Card */}
              <div key={currentPlayer.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center shadow-sm min-h-[400px]">
                
                {revealStage === 'position' && (
                   <div className="flex flex-col items-center overflow-hidden py-4 px-2 md:px-8 w-full max-w-2xl">
                     <h2 className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest mb-2 animate-slide-in-left w-full text-center">Player Position</h2>
                     <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-2 animate-slide-in-left" style={{ animationDelay: '100ms' }}></div>
                     <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest animate-slide-in-right w-full text-center mt-2 px-2 whitespace-nowrap">
                       {getPositionStr(currentPlayer.position)}
                     </h1>
                   </div>
                )}
                
                {revealStage === 'session' && (
                   <div className="flex flex-col items-center overflow-hidden py-4 px-2 md:px-8 w-full max-w-2xl">
                     <h2 className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest mb-2 animate-slide-in-left w-full text-center">Player Session</h2>
                     <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-2 animate-slide-in-left" style={{ animationDelay: '100ms' }}></div>
                     <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight animate-slide-in-right w-full text-center mt-2 px-2 whitespace-nowrap">
                       {getSessionStr(currentPlayer.studentId)}
                     </h1>
                   </div>
                )}
                
                {(revealStage === 'full' || revealStage === 'ready') && (
                  <div className="w-full flex flex-col items-center justify-center overflow-hidden py-2">
                    <div className="w-40 h-40 md:w-56 md:h-56 mb-8 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-md animate-slide-in-top">
                        {currentPlayer.pic ? (
                          <img src={currentPlayer.pic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + currentPlayer.name + '&background=random'; }} />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <span className="text-6xl md:text-8xl font-black text-slate-300 dark:text-slate-600">{currentPlayer.name.charAt(0)}</span>
                          </div>
                        )}
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 text-slate-900 dark:text-white text-center leading-tight tracking-tight animate-slide-in-right w-full break-words px-2 max-w-full" style={{ animationDelay: '100ms' }}>
                      {currentPlayer.name}
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-6 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
                       <span className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest">{getPositionStr(currentPlayer.position)}</span>
                       <span className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest">{getSessionStr(currentPlayer.studentId)}</span>
                    </div>
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 px-6 py-2.5 rounded-xl animate-slide-in-bottom" style={{ animationDelay: '300ms' }}>
                       <p className="text-xs text-slate-900 dark:text-white font-bold uppercase tracking-[0.1em]">
                          Base Price: <span className="text-indigo-700 dark:text-indigo-300 text-lg ml-1">{auctionSettings?.defaultBasePrice || 100}</span> pts
                       </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Bidding Action Card */}
              <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-center shadow-sm">
                <div key={`bid-${liveAuction.currentBid}-${liveAuction.highestBidderId}`} className="text-center mb-8 animate-pop-in">
                  <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Current Highest Bid
                  </p>
                  <h2 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
                    {liveAuction.currentBid?.toLocaleString()} <span className="text-2xl text-slate-400">pts</span>
                  </h2>
                  {highestBidder ? (
                    <div className="inline-flex items-center gap-3 bg-slate-50 dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-sm">Bid by</span>
                      <div className="flex items-center gap-2">
                        {highestBidder.teamLogo && <img src={highestBidder.teamLogo} alt="" className="w-6 h-6 object-cover rounded-full" />}
                        <span className="font-black text-sm uppercase tracking-wider">{highestBidder.teamName || highestBidder.name}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-400 bg-slate-50 dark:bg-[#1a1a1a] inline-block px-5 py-2 rounded-lg border border-slate-100 dark:border-slate-800">Waiting for bids...</p>
                  )}
                </div>

                {user?.role === 'manager' ? (
                  <div className="space-y-4 w-full mt-auto">
                    {liveAuction.passedTeams?.includes(myTeam?.id) ? (
                       <div className="w-full py-4 text-center font-black text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl uppercase tracking-widest text-sm">
                          You Have Withdrawn
                       </div>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                               setConfirmAction('withdraw');
                            }}
                            disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam?.id}
                            className="py-4 md:py-5 px-5 md:px-8 text-sm md:text-base font-black rounded-xl bg-slate-100 dark:bg-[#1a1a1a] text-slate-400 dark:text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest"
                          >
                            Out
                          </button>
                          <button 
                            onClick={() => handleBid(null)}
                            disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam?.id}
                            className="flex-1 py-4 md:py-5 text-xl font-black rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                          >
                            {liveAuction.highestBidderId === myTeam?.id ? 'YOU ARE HIGHEST' : isFirstBid ? `BID BASE (${liveAuction.currentBid})` : `BID +${currentIncrement}`}
                          </button>
                        </div>
                        
                        {auctionSettings?.allowCustomBids && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                              type="number" 
                              className="bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-xl h-14 px-4 flex-1 text-center sm:text-left text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                              placeholder="Custom bid..."
                              value={customBid}
                              onChange={e => setCustomBid(e.target.value)}
                              disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam?.id}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = parseInt(customBid);
                                  if (isNaN(val)) return showToast("Enter a valid amount", "error");
                                  if (isFirstBid ? val >= Number(liveAuction.currentBid) : val > Number(liveAuction.currentBid)) {
                                     handleBid(val);
                                  } else {
                                     showToast(`Bid must be ${isFirstBid ? 'at least' : 'higher than'} current bid!`, 'error');
                                  }
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                const val = parseInt(customBid);
                                if (isNaN(val)) return showToast("Enter a valid amount", "error");
                                if (isFirstBid ? val >= Number(liveAuction.currentBid) : val > Number(liveAuction.currentBid)) {
                                   handleBid(val);
                                } else {
                                   showToast(`Bid must be ${isFirstBid ? 'at least' : 'higher than'} current bid!`, 'error');
                                }
                              }}
                              disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam?.id}
                              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 px-6 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Place Bid
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-xs uppercase tracking-widest text-slate-500">Remaining Budget</span>
                      <span className="font-black text-lg text-slate-900 dark:text-white">{myTeam?.budget?.toLocaleString() || 0} pts</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6 max-h-[800px] lg:max-h-[calc(100vh-120px)]">
             
             {/* Team Status (Admin/Auctioneer only) */}
             {(user?.role === 'admin' || user?.role === 'auctioneer') && (
               <div className="card-minimal flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex items-center justify-between">
                     <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Team Budgets</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                     {managers.map(m => {
                        const stats = getTeamStats(m.id);
                        return (
                          <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a]">
                             <div className="flex items-center gap-3 overflow-hidden pr-2">
                                {m.teamLogo && <img src={m.teamLogo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0"/>}
                                <div className="overflow-hidden">
                                  <p className="font-bold text-xs md:text-sm truncate text-slate-800 dark:text-slate-200">{m.teamName || m.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stats.players} players bought</p>
                                </div>
                             </div>
                             <div className="text-right whitespace-nowrap">
                                <p className="font-black text-slate-900 dark:text-white text-sm md:text-base">{stats.remaining.toLocaleString()} <span className="text-[10px] opacity-60">pts</span></p>
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>
             )}

             {/* Bid History Area */}
             <div className="card-minimal flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex items-center justify-between">
                   <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Bid History</h3>
                   {(user?.role === 'admin' || user?.role === 'auctioneer') && liveAuction.history?.length > 0 && (
                     <button onClick={() => socket?.emit('revertBid')} className="hidden md:flex text-[10px] font-black tracking-widest uppercase text-slate-500 hover:text-red-500 items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                       REVERT LAST
                     </button>
                   )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                   {(!liveAuction.history || liveAuction.history.length === 0) ? (
                      <div className="text-center mt-12 text-slate-400">
                        <div className="font-black text-2xl text-slate-200 dark:text-slate-800 mb-2">---</div>
                        <p className="font-bold text-[10px] uppercase tracking-widest">No bids have been placed yet.</p>
                      </div>
                   ) : (
                      liveAuction.history.map((bid, i) => (
                         <div key={i} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${i === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 scale-100 shadow-md' : 'bg-slate-50 dark:bg-[#1a1a1a] border-slate-100 dark:border-slate-800 opacity-80'}`}>
                            <div>
                              <p className={`font-bold ${i === 0 ? 'text-indigo-700 dark:text-indigo-400 text-lg' : 'text-slate-700 dark:text-slate-300'}`}>{bid.managerName}</p>
                              <p className="text-xs text-slate-400 font-medium">{new Date(bid.time).toLocaleTimeString()}</p>
                            </div>
                            <p className={`font-black ${i === 0 ? 'text-slate-900 dark:text-white text-lg' : 'text-slate-600 dark:text-slate-500 text-base'}`}>
                              {bid.amount.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">pts</span>
                            </p>
                         </div>

                   ))
                )}
             </div>
          </div>
        </div>
          
        </div>
      )}

      {/* Spectator Overview (Visible to all) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {/* Franchises & Budgets */}
        <div className="card-minimal p-6 flex flex-col h-[500px]">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Franchises & Purse</h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {managers.map(team => {
                 const playersBought = players.filter(p => p.teamId === team.id).length;
                 return (
                   <div key={team.id} onClick={() => setSelectedTeamId(team.id)} className="bg-slate-50 dark:bg-[#151515] hover:bg-indigo-50 dark:hover:bg-indigo-900/10 p-4 rounded-2xl flex items-center justify-between cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 transition-colors">
                      <div className="flex items-center gap-3">
                         {team.teamLogo && <img src={team.teamLogo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />}
                         <div>
                           <p className="font-bold text-slate-900 dark:text-white text-base">{team.teamName || team.name}</p>
                           <p className="text-xs text-slate-500 font-medium">{playersBought} Players</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-slate-900 dark:text-white">{team.budget?.toLocaleString()}</p>
                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Remaining</p>
                      </div>
                   </div>
                 )
              })}
           </div>
        </div>

        {/* Top Signings */}
        <div className="card-minimal p-6 flex flex-col h-[500px]">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Top Signings</h3>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {topSignings.length === 0 ? (
                 <p className="text-slate-500 text-sm font-medium">No players sold yet.</p>
              ) : topSignings.map((p, idx) => (
                 <div key={p.id} className="bg-slate-50 dark:bg-[#151515] p-3 rounded-2xl flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 shrink-0">
                       {idx + 1}
                    </div>
                    {p.pic ? (
                       <img src={p.pic} alt={p.name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-slate-100 dark:ring-slate-800" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + p.name + '&background=random'; }} />
                    ) : (
                       <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">{p.name.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                       <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.name}</p>
                       <p className="text-[10px] text-slate-500 truncate">Bought by {managers.find(m => m.id === p.teamId)?.teamName || managers.find(m => m.id === p.teamId)?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="font-black text-emerald-600 dark:text-emerald-400">{p.soldPrice?.toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">PTS</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeamId && selectedTeam && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTeamId(null)}></div>
          <div className="relative bg-white dark:bg-[#111] w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
             <button onClick={() => setSelectedTeamId(null)} className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors">
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
             </button>
             <div className="flex items-center gap-3 mb-1 pr-8">
               {selectedTeam.teamLogo && <img src={selectedTeam.teamLogo} alt="" className="w-8 h-8 rounded-full object-cover" />}
               <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedTeam.teamName || selectedTeam.name}</h2>
             </div>
             <p className="text-sm font-bold text-slate-500 mb-6">Remaining Budget: <span className="text-slate-900 dark:text-white">{selectedTeam.budget?.toLocaleString()} pts</span></p>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {teamPlayers.length === 0 ? (
                   <p className="text-slate-500 text-sm font-medium">No players signed yet.</p>
                ) : teamPlayers.map(p => (
                   <div key={p.id} className="bg-slate-50 dark:bg-[#1a1a1a] p-3 rounded-xl flex items-center gap-3">
                      {p.pic ? (
                         <img src={p.pic} alt={p.name} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + p.name + '&background=random'; }} />
                      ) : (
                         <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">{p.name.charAt(0)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                         <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.name}</p>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{p.position}</p>
                      </div>
                      <div className="text-right shrink-0">
                         <p className="font-black text-slate-700 dark:text-slate-300">{p.soldPrice?.toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">PTS</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}      {/* Confirmation Modal */}
      {confirmAction && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl w-full max-w-sm shadow-2xl text-center">
             <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-3xl font-black text-slate-400">
                ?
             </div>
             <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">
                {confirmAction === 'sell' ? 'Finalize Sale?' : confirmAction === 'unsold' ? 'Mark Unsold?' : confirmAction === 'cancel' ? 'Cancel Auction?' : 'Withdraw?'}
             </h3>
             <p className="text-sm text-slate-500 mb-6">
                {confirmAction === 'sell' 
                  ? `Are you sure you want to sell ${currentPlayer?.name} to ${highestBidder?.name || highestBidder?.teamName} for ${liveAuction.currentBid} points?`
                  : confirmAction === 'unsold' 
                  ? `Are you sure you want to skip ${currentPlayer?.name} and mark them as unsold?`
                  : confirmAction === 'cancel'
                  ? `Are you sure you want to cancel this auction? No changes will be saved.`
                  : `Are you sure you want to withdraw from bidding for this player? You cannot bid again.`}
             </p>
             <div className="flex gap-3">
                <button onClick={() => setConfirmAction(null)} className="flex-1 btn-secondary py-3">Cancel</button>
                <button 
                  onClick={() => {
                     if (confirmAction === 'withdraw') {
                        socket?.emit('passBid', myTeam.id);
                     } else {
                        socket?.emit('stopAuction', confirmAction);
                     }
                     setConfirmAction(null);
                  }} 
                  className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmAction === 'sell' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  Confirm
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}

      {/* Undo Sale Confirmation Modal */}
      {confirmUndoPlayer && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl w-full max-w-sm shadow-2xl text-center border border-red-200 dark:border-red-900/30">
             <div className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4 text-3xl font-black">
                !
             </div>
             <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">
                Revert Sale?
             </h3>
             <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to revert the sale of <span className="font-bold text-slate-700 dark:text-slate-300">{confirmUndoPlayer.name}</span>? This will move them back to the Unsold queue and remove the record from {confirmUndoPlayer.teamName}.
             </p>
             <div className="flex gap-3">
                <button onClick={() => setConfirmUndoPlayer(null)} className="flex-1 btn-secondary py-3">Cancel</button>
                <button 
                  onClick={() => {
                     socket?.emit('undoSale', confirmUndoPlayer.id);
                     setConfirmUndoPlayer(null);
                  }} 
                  className="flex-1 py-3 font-bold rounded-xl text-white bg-red-500 hover:bg-red-600 shadow-sm"
                >
                  Yes, Revert
                </button>
             </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
