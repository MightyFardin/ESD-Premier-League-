import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function SystemLogs() {
  const { logs, socket } = useAuth(); // assuming logs and socket are exposed in AuthContext
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearLogs = () => {
    if (socket) {
      socket.emit('clearLogs');
      setShowClearConfirm(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'auction_start': return <div className="text-[10px] font-black text-emerald-500">A</div>;
      case 'bid': return <div className="text-[10px] font-black text-blue-500">B</div>;
      case 'sale': return <div className="text-[10px] font-black text-indigo-500">S</div>;
      case 'unsold': return <div className="text-[10px] font-black text-red-500">U</div>;
      case 'penalty': return <div className="text-[10px] font-black text-amber-500">P</div>;
      case 'system_reset': return <div className="text-[10px] font-black text-fuchsia-500">!</div>;
      default: return <div className="text-[10px] font-black text-slate-500">O</div>;
    }
  };

  const [viewMode, setViewMode] = useState('player'); // default to player view
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [expandedPlayers, setExpandedPlayers] = useState({});

  const togglePlayer = (playerName) => {
    setExpandedPlayers(prev => ({ ...prev, [playerName]: !prev[playerName] }));
  };

  useEffect(() => {
    if (searchParams.get('q')) {
      setSearchQuery(searchParams.get('q'));
      setViewMode('player');
      setExpandedPlayers({ [searchParams.get('q')]: true });
    }
  }, [searchParams]);

  // Helper to extract player name from our known log string formats
  const extractPlayerName = (msg) => {
    let match = msg.match(/Auction started for (.*?) at base price/);
    if (match) return match[1];
    
    match = msg.match(/placed a bid of .* pts for (.*?)\./);
    if (match) return match[1];
    
    match = msg.match(/^(.*?) sold to .* for .* pts\./);
    if (match) return match[1];
    
    match = msg.match(/^(.*?) was marked as unsold\./);
    if (match) return match[1];
    
    match = msg.match(/Sale undone for player (.*?)\. Marked as unsold\./);
    if (match) return match[1];
    
    match = msg.match(/Penalty: .* ran out of budget\. (.*?) was returned to unsold\./);
    if (match) return match[1];
    
    match = msg.match(/Last bid for (.*?) was reverted/);
    if (match) return match[1];
    
    return 'System & Other';
  };

  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => log.message.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [logs, searchQuery]);

  const groupedLogs = useMemo(() => {
    const groups = {};
    filteredLogs.forEach(log => {
      const pName = extractPlayerName(log.message);
      if (!groups[pName]) groups[pName] = [];
      groups[pName].push(log);
    });
    return groups;
  }, [filteredLogs]);

  return (
    <div className="pb-20 max-w-5xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white flex items-center gap-2">
            System Logs
          </h1>
          <p className="text-slate-500 text-sm">
            A complete audit trail of all auction events, grouped for your convenience.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative">
             <input 
               type="text" 
               placeholder="Search logs..." 
               className="input-field pl-9 h-10 w-full sm:w-64"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>
           
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
             <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
               TIMELINE
             </button>
             <button onClick={() => setViewMode('player')} className={`flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-md transition-colors ${viewMode === 'player' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>
               BY PLAYER
             </button>
           </div>
           
           <button onClick={() => setShowClearConfirm(true)} className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-black text-[10px] tracking-widest uppercase rounded-lg border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40">
             Clear Logs
           </button>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">Clear All Logs?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone. All system logs will be permanently deleted from the database.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-sm">Cancel</button>
              <button onClick={handleClearLogs} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-transform">Yes, Clear</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#111] rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 min-h-[500px]">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="mb-4 opacity-20 text-4xl font-black">---</div>
            <p className="font-bold">No system logs recorded yet.</p>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="space-y-3">
            {filteredLogs.map((log, i) => (
              <div key={log.id || i} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#161618]">
                <div className="mt-1 w-8 h-8 rounded-full bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                  {getIconForType(log.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{log.message}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedLogs).sort().map(playerName => {
               const isExpanded = expandedPlayers[playerName];
               return (
                 <div key={playerName} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => togglePlayer(playerName)}
                      className="w-full text-left bg-slate-50 dark:bg-[#161618] px-4 py-3 sm:py-4 border-b border-transparent dark:border-transparent hover:bg-slate-100 dark:hover:bg-[#1a1a1c] transition-colors flex items-center justify-between"
                    >
                       <div className="flex items-center gap-3">
                         <div className="text-[10px] font-black uppercase text-indigo-500 w-5 text-center">
                           {playerName === 'System & Other' ? 'SYS' : 'USR'}
                         </div>
                         <div>
                           <h3 className="font-black text-slate-800 dark:text-slate-200">{playerName}</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{groupedLogs[playerName].length} Events</p>
                         </div>
                       </div>
                       <div className="text-slate-400 text-[10px] font-black">
                         {isExpanded ? '▼' : '▶'}
                       </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-white dark:bg-[#111] border-t border-slate-200 dark:border-slate-800">
                         {groupedLogs[playerName].map((log, i) => (
                            <div key={log.id || i} className="flex gap-3 items-start border-b border-slate-50 dark:border-slate-800/50 pb-3 last:border-0 last:pb-0">
                               <div className="mt-0.5 opacity-70">
                                  {getIconForType(log.type)}
                               </div>
                               <div className="flex-1">
                                  <p className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">{log.message}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                     {new Date(log.timestamp).toLocaleTimeString()}
                                  </p>
                               </div>
                            </div>
                         ))}
                      </div>
                    )}
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
