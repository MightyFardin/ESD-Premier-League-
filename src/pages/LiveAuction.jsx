import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { Gavel, Undo2, XSquare, CheckSquare, Maximize, Minimize, Play, Search, TimerReset, Timer, Pause, Play as PlayIcon, Plus, TrendingUp, ShieldAlert, History, Users } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

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
  if (upper === 'MID' || upper === 'MIDFIELD' || upper === 'MIDFIELDER') return 'Midfielder';
  if (upper === 'FWD' || upper === 'ATTACKER' || upper === 'FORWARD') return 'Attacker';
  return pos;
};

export default function LiveAuction() {
  const { user, liveAuction, players, managers, auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  const [customBid, setCustomBid] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
  
  // Cinematic Reveal State
  const [revealStage, setRevealStage] = useState('ready'); // 'position', 'session', 'full', 'ready'

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
    
    socket.on('bidError', handleBidError);
    return () => socket.off('bidError', handleBidError);
  }, [socket, showToast]);

  useEffect(() => {
    if (liveAuction.timerPaused) {
      setTimeLeft(liveAuction.timerRemaining);
      return;
    }
    
    let interval = null;
    if (liveAuction.status === 'active' && liveAuction.auctionEndAt) {
      interval = setInterval(() => {
        const now = Date.now();
        const end = liveAuction.auctionEndAt;
        if (now >= end) {
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.ceil((end - now) / 1000));
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
  const myTeam = managers.find(m => m.id === user.id) || { id: user.id, budget: auctionSettings?.defaultManagerBudget || 10000, name: user.name };

  const currentIncrement = liveAuction.currentIncrement || 10;
  const isFirstBid = !liveAuction.highestBidderId;

  const handleBid = (overrideAmount = null) => {
    if (user.role !== 'manager') return;
    
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
          className="btn-secondary py-1.5 px-3 text-xs"
        >
          {isFullscreen ? <><Minimize size={14} /> Exit Fullscreen</> : <><Maximize size={14} /> Fullscreen</>}
        </button>
      </div>

      {liveAuction.status === 'idle' || !currentPlayer ? (
        <div className="space-y-6">
          {(!user.role || user.role === 'manager' || user.role === 'spectator') && (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center p-8 card-minimal">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Gavel size={40} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Active Auction</h2>
              <p className="text-slate-500">Wait for the admin to start the next player bidding.</p>
            </div>
          )}

          {(user.role === 'admin' || user.role === 'auctioneer') && (
            <div className="card-minimal p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold">Player Queue</h2>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
                     <button onClick={() => setViewTab('unsold')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'unsold' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Unsold</button>
                     <button onClick={() => setViewTab('sold')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'sold' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Sold</button>
                     <button onClick={() => setViewTab('all')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${viewTab === 'all' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>All</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:flex gap-2 z-20 w-full md:w-auto">
                  <div className="relative col-span-2 md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search player..." 
                      className="input-field pl-9 h-10 w-full md:min-w-[200px]"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-40">
                    <CustomSelect 
                      name="position"
                      value={selectedPosition}
                      onChange={setSelectedPosition}
                      options={allPositions.map(p => ({ value: p, label: p === 'All' ? 'All Positions' : p }))}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <CustomSelect 
                      name="session"
                      value={selectedSession}
                      onChange={setSelectedSession}
                      options={allSessions.map(s => ({ value: s, label: s === 'All' ? 'All Sessions' : s }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.length === 0 && (
                  <p className="text-slate-500 col-span-full text-center py-8">No players found matching the filters.</p>
                )}
                {filteredPlayers.map(p => (
                  <div key={p.id} className="bg-slate-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                       {p.pic ? (
                          <img src={p.pic} alt={p.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                       ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">{p.name.charAt(0)}</div>
                       )}
                       <div className="overflow-hidden">
                         <p className="font-bold text-sm truncate">{p.name}</p>
                         <p className="text-xs text-slate-500 truncate">{p.position} • {getSessionStr(p.studentId)}</p>
                         {p.status === 'sold' && (
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                               Sold to {managers.find(m => m.id === p.teamId)?.name || 'Unknown'} for {p.soldPrice} pts
                            </p>
                         )}
                         {p.status === 'unsold' && viewTab !== 'unsold' && (
                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Unsold</p>
                         )}
                       </div>
                     </div>
                     {p.status === 'unsold' && (
                       <button onClick={() => handleStartAuction(p.id)} className="btn-primary w-full py-2 flex items-center justify-center gap-2">
                         <Play size={16} /> Start Auction
                       </button>
                     )}
                     {p.status === 'sold' && (user.role === 'admin' || user.role === 'auctioneer') && (
                       <button onClick={() => socket?.emit('undoSale', p.id)} className="btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 dark:border-red-900/50 w-full py-2 flex items-center justify-center gap-2">
                         <Undo2 size={16} /> Mark Unsold
                       </button>
                     )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 relative">
          
          <div className="lg:col-span-2 card-minimal overflow-hidden relative min-h-[600px] flex flex-col">
            {/* Timer Overlay / Section */}
            {(liveAuction.auctionEndAt || liveAuction.timerPaused) && (
              <div className="md:absolute md:top-6 md:right-6 z-20 flex flex-col items-center md:items-end gap-2 p-4 md:p-0 border-b border-slate-200 dark:border-slate-800 md:border-none bg-white/80 dark:bg-black/50 md:bg-transparent md:dark:bg-transparent backdrop-blur-md md:backdrop-blur-none">
                <div className={`w-full md:w-auto justify-center md:justify-start px-4 py-3 md:py-2 rounded-xl flex items-center gap-2 font-black text-2xl md:text-xl md:shadow-lg border backdrop-blur-md transition-colors ${
                  timeLeft === 0 ? 'bg-red-500/90 text-white border-red-400' 
                  : liveAuction.timerPaused ? 'bg-amber-500/90 text-white border-amber-400'
                  : timeLeft <= 10 ? 'bg-orange-500/90 text-white border-orange-400 animate-pulse'
                  : 'bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
                }`}>
                  {timeLeft === 0 ? <TimerReset size={24} /> : liveAuction.timerPaused ? <Pause size={24} /> : <Timer size={24} />}
                  {timeLeft === 0 ? 'TIME UP!' : liveAuction.timerPaused ? `PAUSED (00:${timeLeft.toString().padStart(2, '0')})` : `00:${timeLeft.toString().padStart(2, '0')}`}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row flex-1">
              {/* Left Side: Player Info */}
              <div key={currentPlayer.id} className="p-4 md:p-8 text-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151515] md:w-[50%] lg:w-[45%] md:pt-8 overflow-hidden min-h-[300px] flex flex-col items-center justify-center relative">
                
                {revealStage === 'position' && (
                   <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 px-6 py-6 md:px-12 md:py-10 rounded-3xl shadow-2xl flex flex-col items-center gap-3 animate-smooth-reveal w-full max-w-sm mx-auto">
                     <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap text-center">
                       {getPositionStr(currentPlayer.position)}
                     </h1>
                   </div>
                )}
                
                {revealStage === 'session' && (
                   <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 px-6 py-6 md:px-12 md:py-10 rounded-3xl shadow-2xl flex flex-col items-center gap-3 animate-smooth-reveal w-full max-w-sm mx-auto">
                     <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-widest whitespace-nowrap text-center">
                       SESSION<br/>{getSessionStr(currentPlayer.studentId)}
                     </h1>
                   </div>
                )}
                
                {(revealStage === 'full' || revealStage === 'ready') && (
                  <>
                    <div className="animate-cinematic-image mb-6 w-full max-w-[240px] aspect-square mx-auto" style={{ animationDelay: '0.1s' }}>
                      {currentPlayer.pic ? (
                        <img src={currentPlayer.pic} alt="Profile" className="w-full h-full rounded-full object-cover drop-shadow-xl border-4 md:border-8 border-white dark:border-[#222]" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 border-4 md:border-8 border-white dark:border-[#222] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex items-center justify-center">
                           <span className="text-5xl md:text-7xl font-black text-slate-400">{currentPlayer.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 text-slate-900 dark:text-white leading-tight tracking-tight animate-cinematic-text" style={{ animationDelay: '0.9s' }}>
                      {currentPlayer.name}
                    </h1>
                    <p className="text-sm md:text-lg text-slate-500 font-medium px-4 animate-cinematic-text" style={{ animationDelay: '1.2s' }}>
                      {getPositionStr(currentPlayer.position)} • <span className="whitespace-nowrap">{getSessionStr(currentPlayer.studentId)}</span>
                    </p>
                    <p className="text-xs md:text-base text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 inline-block px-4 py-1.5 rounded-full font-bold mt-3 animate-cinematic-text" style={{ animationDelay: '1.4s' }}>
                      Base: {auctionSettings?.defaultBasePrice || 100} pts
                    </p>
                    
                    {revealStage === 'full' && (
                       <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[1000]">
                          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 tracking-widest uppercase font-black text-2xl md:text-4xl px-12 py-4 rounded-full shadow-2xl animate-time-start">
                             Time Starts
                          </div>
                       </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Side: Bidding Action */}
              <div className="p-4 md:p-8 bg-white dark:bg-[#111] flex-1 flex flex-col justify-center">
                <div key={`bid-${liveAuction.currentBid}-${liveAuction.highestBidderId}`} className="text-center mb-6 md:mb-10 animate-pop-in">
                  <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 flex items-center justify-center gap-2">
                    <TrendingUp size={16} /> Current Highest Bid
                  </p>
                  <h2 className="text-5xl md:text-7xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
                    {liveAuction.currentBid?.toLocaleString()} <span className="text-xl md:text-3xl text-slate-500">pts</span>
                  </h2>
                  {highestBidder ? (
                    <p className="text-sm md:text-lg font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 inline-block px-4 py-1.5 rounded-full">
                      by {highestBidder.teamName || highestBidder.name}
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm font-bold text-slate-500">Waiting for bids...</p>
                  )}
                </div>

                {user.role === 'manager' ? (
                  <div className="space-y-4 max-w-lg mx-auto w-full">
                    <button 
                      onClick={() => handleBid(null)}
                      disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam.id}
                      className="btn-primary w-full py-4 md:py-6 text-xl md:text-2xl font-black shadow-xl md:shadow-2xl shadow-indigo-500/20 md:shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {liveAuction.highestBidderId === myTeam.id ? 'HIGHEST BIDDER' : isFirstBid ? `BID BASE PRICE (${liveAuction.currentBid})` : `BID +${currentIncrement} Points`}
                    </button>
                    
                    {auctionSettings?.allowCustomBids && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <input 
                          type="number" 
                          className="input-field h-12 md:h-14 flex-1 text-center sm:text-left text-base md:text-lg font-bold" 
                          placeholder="Custom amount..."
                          value={customBid}
                          onChange={e => setCustomBid(e.target.value)}
                          disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam.id}
                        />
                        <button 
                          onClick={() => {
                            const val = parseInt(customBid);
                            if (val > liveAuction.currentBid) handleBid(val);
                            else showToast("Bid must be higher than current bid!", 'error');
                          }}
                          disabled={liveAuction.timerPaused || (timeLeft === 0 && liveAuction.auctionEndAt) || liveAuction.highestBidderId === myTeam.id}
                          className="btn-secondary h-12 md:h-14 px-8 text-base md:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Bid Custom
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-4 md:mt-6 p-4 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-sm md:text-base text-slate-500">Your Remaining Budget</span>
                      <span className="font-black text-lg md:text-xl text-slate-900 dark:text-white">{myTeam?.budget?.toLocaleString() || 0} pts</span>
                    </div>
                  </div>
                ) : (user.role === 'admin' || user.role === 'auctioneer') ? (
                  <div className="hidden md:flex flex-col gap-4 justify-center max-w-lg mx-auto mt-8 w-full">
                     <div className="flex flex-col md:flex-row gap-2 w-full">
                       <button onClick={() => socket?.emit(liveAuction.timerPaused ? 'resumeTimer' : 'pauseTimer')} className="btn-secondary flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2">
                         {liveAuction.timerPaused ? <><PlayIcon size={16} className="text-emerald-500" /> Resume Timer</> : <><Pause size={16} className="text-amber-500" /> Pause Timer</>}
                       </button>
                       <button onClick={() => socket?.emit('addTime', 10)} className="btn-secondary flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 text-indigo-600 dark:text-indigo-400">
                         <Plus size={16} /> Add 10s
                       </button>
                     </div>
                     <div className="flex flex-col md:flex-row gap-4 w-full">
                       <button onClick={() => socket?.emit('stopAuction', 'sell')} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 py-4 text-lg shadow-lg shadow-emerald-500/20">
                         <CheckSquare size={18} className="w-5 h-5" /> Finalize Sale
                       </button>
                       <button onClick={() => socket?.emit('stopAuction', 'unsold')} className="btn-secondary flex-1 py-4 text-lg text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/50">
                         <XSquare size={18} className="w-5 h-5" /> Mark Unsold
                       </button>
                     </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6 max-h-[800px] lg:max-h-[calc(100vh-120px)]">
             
             {/* Team Status (Admin/Auctioneer only) */}
             {(user.role === 'admin' || user.role === 'auctioneer') && (
               <div className="card-minimal flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex items-center justify-between">
                     <h3 className="font-bold text-sm md:text-base flex items-center gap-2"><Users size={16} /> Team Budgets</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                     {managers.map(m => {
                        const stats = getTeamStats(m.id);
                        return (
                          <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1a1a1a]">
                             <div className="overflow-hidden pr-2">
                                <p className="font-bold text-xs md:text-sm truncate text-slate-800 dark:text-slate-200">{m.teamName || m.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{stats.players} players bought</p>
                             </div>
                             <div className="text-right whitespace-nowrap">
                                <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm md:text-base">{stats.remaining.toLocaleString()} <span className="text-[10px] opacity-60">pts</span></p>
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
                   <h3 className="font-bold text-sm md:text-base flex items-center gap-2"><History size={16} /> Bid History</h3>
                {(user.role === 'admin' || user.role === 'auctioneer') && liveAuction.history?.length > 0 && (
                  <button onClick={() => socket?.emit('revertBid')} className="hidden md:flex text-sm font-bold text-slate-500 hover:text-red-500 items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                    <Undo2 size={16} /> Revert Last
                  </button>
                )}
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {(!liveAuction.history || liveAuction.history.length === 0) ? (
                   <div className="text-center mt-12 text-slate-400">
                     <History size={48} className="mx-auto mb-4 opacity-20" />
                     <p className="font-medium">No bids have been placed yet.</p>
                   </div>
                ) : (
                   liveAuction.history.map((bid, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${i === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 scale-100 shadow-md' : 'bg-slate-50 dark:bg-[#1a1a1a] border-slate-100 dark:border-slate-800 opacity-80'}`}>
                         <div>
                           <p className={`font-bold ${i === 0 ? 'text-indigo-700 dark:text-indigo-400 text-lg' : 'text-slate-700 dark:text-slate-300'}`}>{bid.managerName}</p>
                           <p className="text-xs text-slate-400 font-medium">{new Date(bid.time).toLocaleTimeString()}</p>
                         </div>
                         <p className={`font-black ${i === 0 ? 'text-indigo-600 dark:text-indigo-400 text-lg' : 'text-slate-600 dark:text-slate-500 text-base'}`}>
                           {bid.amount.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">pts</span>
                         </p>
                      </div>
                   ))
                )}
             </div>
          </div>
        </div>
          
          {/* Mobile Admin Action Bar (Kept intact for mobile) */}
          {(user.role === 'admin' || user.role === 'auctioneer') && liveAuction.status === 'active' && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-3 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-3 pb-6">
              <div className="flex gap-2">
                <button onClick={() => socket?.emit('stopAuction', 'sell')} className="flex-1 bg-emerald-600 active:bg-emerald-700 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-600/20">
                  <CheckSquare size={22} /> <span className="text-[10px] uppercase tracking-wider">Finalize</span>
                </button>
                <button onClick={() => socket?.emit('stopAuction', 'unsold')} className="flex-1 bg-red-500 active:bg-red-600 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-500/20">
                  <XSquare size={22} /> <span className="text-[10px] uppercase tracking-wider">Unsold</span>
                </button>
                
                {liveAuction.history?.length > 0 && (
                  <button onClick={() => socket?.emit('revertBid')} className="flex-1 bg-slate-800 dark:bg-slate-700 active:bg-slate-900 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg shadow-slate-900/20">
                    <Undo2 size={22} /> <span className="text-[10px] uppercase tracking-wider">Undo Bid</span>
                  </button>
                )}
              </div>
              
              {true && (
                <div className="flex gap-2">
                  <button onClick={() => socket?.emit(liveAuction.timerPaused ? 'resumeTimer' : 'pauseTimer')} className="flex-[2] bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700">
                    {liveAuction.timerPaused ? <><PlayIcon size={16} /> Resume Timer</> : <><Pause size={16} /> Pause Timer</>}
                  </button>
                  <button onClick={() => socket?.emit('addTime', 10)} className="flex-1 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-1 text-sm text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700">
                    <Plus size={16} /> 10s
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
