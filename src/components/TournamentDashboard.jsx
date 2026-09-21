import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../AuthContext';
import Countdown from './Countdown';

const PLStatCard = ({ title, data, valueKey, label, colorClass, bgGradient, managers, expandedId, setExpandedId, expandedRender }) => {
   if (data.length === 0) {
      return (
         <div className="flex flex-col bg-white dark:bg-[#0a0a0c] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-full">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
               <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
            </div>
            <div className="p-8 flex items-center justify-center flex-1">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No data yet</p>
            </div>
         </div>
      );
   }

   const top = data[0];
   const rest = data.slice(1, 10);

   return (
     <div className="flex flex-col bg-white dark:bg-[#0a0a0c] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#111]">
           <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
        </div>
        
        <div 
          className={`relative ${bgGradient} p-6 flex items-end justify-between overflow-hidden group min-h-[160px] ${setExpandedId ? 'cursor-pointer' : ''}`} 
          onClick={() => setExpandedId && setExpandedId(expandedId === top.id ? null : top.id)}
        >
           <div className="absolute -right-4 -bottom-4 text-[160px] font-black text-white/40 dark:text-black/20 select-none pointer-events-none group-hover:scale-110 transition-transform duration-500 leading-none">
             1
           </div>
           
           {top.pic && (
              <img src={top.pic} referrerPolicy="no-referrer" className="absolute right-0 bottom-0 h-full w-1/2 object-cover object-left opacity-30 drop-shadow-2xl [mask-image:linear-gradient(to_right,transparent,black_50%)]" />
           )}

           <div className="relative z-10 flex flex-col gap-1 w-2/3">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-tight drop-shadow-md">{top.name}</span>
              <span className="text-xs font-black text-slate-800/70 dark:text-white/70 uppercase tracking-widest">{managers.find(m => m.id === top.teamId)?.teamName || 'Unknown'}</span>
           </div>
           
           <div className="relative z-10 text-right flex flex-col items-end justify-end">
              <span className={`text-6xl font-black ${colorClass} leading-none drop-shadow-lg`}>{top[valueKey]}</span>
              <span className="text-[10px] font-black text-slate-800/70 dark:text-white/70 uppercase tracking-widest mt-1">{label}</span>
           </div>
        </div>
        
        {expandedId === top.id && expandedRender && (
           <div className="p-4 bg-slate-100 dark:bg-[#161618] border-b border-slate-200 dark:border-slate-800 shadow-inner">
              {expandedRender(top)}
           </div>
        )}

        <div className="flex flex-col">
           {rest.map((p, i) => (
             <React.Fragment key={p.id}>
             <div 
               onClick={() => setExpandedId && setExpandedId(expandedId === p.id ? null : p.id)}
               className={`flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-[#111] transition-colors ${setExpandedId ? 'cursor-pointer' : ''} last:border-0`}
             >
                <div className="flex items-center gap-4">
                   <span className="font-black text-slate-400 text-sm w-4">{i + 2}</span>
                   {p.pic ? (
                      <img src={p.pic} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                   ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-500">{p.name.charAt(0)}</div>
                   )}
                   <div className="flex flex-col">
                      <span className="font-black text-sm text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{managers.find(m => m.id === p.teamId)?.teamName || 'Unknown'}</span>
                   </div>
                </div>
                <span className={`font-black text-lg ${colorClass}`}>{p[valueKey]}</span>
             </div>
             {expandedId === p.id && expandedRender && (
                <div className="p-4 bg-slate-100 dark:bg-[#161618] border-b border-slate-200 dark:border-slate-800 shadow-inner">
                   {expandedRender(p)}
                </div>
             )}
             </React.Fragment>
           ))}
        </div>
     </div>
   )
}


export default function TournamentDashboard() {
  const { user, fixtures = [], managers = [], players = [] } = useAuth();
  
  const [activeTab, setActiveTab] = useState('points'); // 'points', 'fixtures'
  const [filterType, setFilterType] = useState('all'); // 'all', 'mine'
  const [expandedScorer, setExpandedScorer] = useState(null);
  const [expandedAssist, setExpandedAssist] = useState(null);
  const [expandedFixtures, setExpandedFixtures] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const toggleFixture = (fixtureId) => {
    setExpandedFixtures(prev => ({
      ...prev,
      [fixtureId]: !prev[fixtureId]
    }));
  };

  const [nowTime, setNowTime] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 10000); // 10s
    return () => clearInterval(timer);
  }, []);

  const getDynamicStatus = (f) => {
    if (f.status !== 'upcoming') return f.status;
    if (!f.date) return 'upcoming';
    const matchTime = new Date(f.date.replace(/-/g, '/').replace('T', ' ')).getTime();
    if (isNaN(matchTime)) return 'upcoming';
    
    if (nowTime >= matchTime) return 'live';
    return 'upcoming';
  };

  const processedFixtures = fixtures.map(f => ({
    ...f,
    computedStatus: getDynamicStatus(f)
  }));

  const upcomingGames = processedFixtures.filter(f => f.computedStatus === 'upcoming' && f.date).sort((a,b) => new Date(a.date.replace(/-/g, '/').replace('T', ' ')) - new Date(b.date.replace(/-/g, '/').replace('T', ' ')));
  const nextGame = upcomingGames[0];

  const pointsTable = managers.map(m => ({
    id: m.id,
    name: m.teamName || m.name,
    logo: m.teamLogo,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0
  }));

  fixtures.forEach(f => {
    if (f.status === 'completed') {
       const teamA = pointsTable.find(t => t.id === f.teamAId);
       const teamB = pointsTable.find(t => t.id === f.teamBId);
       if (teamA && teamB) {
          teamA.played++; teamB.played++;
          teamA.gf += f.teamAGoals; teamB.gf += f.teamBGoals;
          teamA.ga += f.teamBGoals; teamB.ga += f.teamAGoals;
          if (f.teamAGoals > f.teamBGoals) {
             teamA.won++; teamB.lost++;
             teamA.points += 3;
          } else if (f.teamAGoals < f.teamBGoals) {
             teamB.won++; teamA.lost++;
             teamB.points += 3;
          } else {
             teamA.drawn++; teamB.drawn++;
             teamA.points += 1; teamB.points += 1;
          }
       }
    }
  });

  pointsTable.forEach(t => t.gd = t.gf - t.ga);
  pointsTable.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  const playerStats = players.filter(p => p.status === 'sold').map(p => {
    let goals = 0;
    let assists = 0;
    let saves = 0;
    let cleanSheets = 0;
    let motms = 0;
    fixtures.forEach(f => {
      (f.events || []).forEach(e => {
        if (e.type === 'goal') {
          if (e.playerId === p.id) goals += (e.count || 1);
          if (e.assistId === p.id) assists += (e.count || 1);
        }
        if (e.type === 'save' && e.playerId === p.id) {
          saves += (e.count || 1);
        }
        if (e.type === 'clean_sheet' && e.playerId === p.id) {
          cleanSheets += (e.count || 1);
        }
      });
      if (f.status === 'completed' && f.motmId === p.id) {
         motms++;
      }
    });
    return { ...p, goals, assists, saves, cleanSheets, motms };
  });
  
  const topScorers = [...playerStats].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name)).slice(0, 10);
  const topAssists = [...playerStats].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name)).slice(0, 10);
  const topMotms = [...playerStats].filter(p => p.motms > 0).sort((a, b) => b.motms - a.motms || a.name.localeCompare(b.name)).slice(0, 10);
  const topSaves = [...playerStats].filter(p => p.saves > 0).sort((a, b) => b.saves - a.saves || a.name.localeCompare(b.name)).slice(0, 10);
  const topCleanSheets = [...playerStats].filter(p => p.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets || a.name.localeCompare(b.name)).slice(0, 10);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Tab Navigation */}
      <div className="flex bg-slate-200 dark:bg-[#161618] p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'points' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Points
        </button>
        <button 
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'fixtures' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Fixtures
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Stats
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${activeTab === 'teams' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Teams
        </button>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-slate-800 p-3 md:p-5 min-h-[500px]">
        {activeTab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="py-2 px-3 font-semibold">Pos</th>
                  <th className="py-2 px-3 font-semibold">Team</th>
                  <th className="py-2 px-2 font-semibold text-center">P</th>
                  <th className="py-2 px-2 font-semibold text-center hidden md:table-cell">W</th>
                  <th className="py-2 px-2 font-semibold text-center hidden md:table-cell">D</th>
                  <th className="py-2 px-2 font-semibold text-center hidden md:table-cell">L</th>
                  <th className="py-2 px-2 font-semibold text-center hidden sm:table-cell">GF</th>
                  <th className="py-2 px-2 font-semibold text-center hidden sm:table-cell">GA</th>
                  <th className="py-2 px-2 font-semibold text-center">GD</th>
                  <th className="py-2 px-3 font-semibold text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {pointsTable.map((team, idx) => (
                  <tr key={team.id} className={`hover:bg-slate-50 dark:hover:bg-[#161618] transition-colors relative ${idx < 2 ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="py-2 px-3 text-xs font-semibold text-slate-900 dark:text-white relative">
                       {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>}
                       {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {team.logo ? (
                          <img src={team.logo} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                            {team.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-xs text-slate-900 dark:text-white whitespace-nowrap">{team.name}</span>
                        {idx < 2 && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Q</span>}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300">{team.played}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300 hidden md:table-cell">{team.won}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300 hidden md:table-cell">{team.drawn}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300 hidden md:table-cell">{team.lost}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300 hidden sm:table-cell">{team.gf}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300 hidden sm:table-cell">{team.ga}</td>
                    <td className="py-2 px-2 text-center text-xs text-slate-700 dark:text-slate-300">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="py-2 px-3 text-right font-bold text-xs text-indigo-600 dark:text-indigo-400">{team.points}</td>
                  </tr>
                ))}
                {pointsTable.length === 0 && (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-500 text-sm font-bold">No teams registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="space-y-4">
            {user?.role === 'manager' && (
              <div className="flex bg-slate-100 dark:bg-[#161618] p-1 rounded-xl mb-6 max-w-xs mx-auto border border-slate-200 dark:border-slate-800">
                 <button onClick={() => setFilterType('all')} className={`flex-1 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${filterType === 'all' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>All Matches</button>
                 <button onClick={() => setFilterType('mine')} className={`flex-1 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${filterType === 'mine' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>My Matches</button>
              </div>
            )}
            
            {processedFixtures.filter(f => filterType === 'all' || f.teamAId === user?.id || f.teamBId === user?.id).length === 0 && (
              <p className="text-center py-8 text-slate-500 font-bold text-sm">No fixtures scheduled.</p>
            )}
            
            {activeTab === 'fixtures' && nextGame && filterType === 'all' && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950 dark:to-[#0a0a0c] rounded-2xl border border-indigo-200 dark:border-indigo-800/50 p-4 mb-6 relative overflow-hidden shadow-sm">
                
                <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-bl-xl shadow-md z-10 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                  Next Match
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                   <p className="text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Kicks off in</p>
                   
                   <div className="scale-75 sm:scale-90 origin-top mb-[-10px]">
                     <Countdown targetDate={nextGame.date} compact={false} />
                   </div>

                   <div className="mt-4 pt-4 border-t border-indigo-200/50 dark:border-white/5 w-full flex items-center justify-between max-w-sm mx-auto">
                     {(() => {
                        const teamA = managers.find(m => m.id === nextGame.teamAId) || { teamName: 'TBA' };
                        const teamB = managers.find(m => m.id === nextGame.teamBId) || { teamName: 'TBA' };
                        return (
                           <>
                              <div className="flex-1 flex flex-col items-center text-center gap-2">
                                {teamA.teamLogo ? (
                                  <img src={teamA.teamLogo} alt="" referrerPolicy="no-referrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-300 dark:text-slate-400 shadow-sm ring-2 ring-white dark:ring-[#111]">
                                    {(teamA.teamName || 'T').charAt(0)}
                                  </div>
                                )}
                                <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{teamA.teamName}</span>
                              </div>
                              
                              <div className="px-3 flex flex-col items-center">
                                 <div className="bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-300 rounded-lg px-2 py-1 font-bold text-xs shadow-sm flex items-center justify-center border border-transparent dark:border-indigo-500/30">
                                    <span className="tracking-widest">VS</span>
                                 </div>
                              </div>
                              
                              <div className="flex-1 flex flex-col items-center text-center gap-2">
                                {teamB.teamLogo ? (
                                  <img src={teamB.teamLogo} alt="" referrerPolicy="no-referrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-300 dark:text-slate-400 shadow-sm ring-2 ring-white dark:ring-[#111]">
                                    {(teamB.teamName || 'T').charAt(0)}
                                  </div>
                                )}
                                <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{teamB.teamName}</span>
                              </div>
                           </>
                        );
                     })()}
                   </div>
                </div>
              </div>
            )}

            {[...processedFixtures].filter(f => filterType === 'all' || f.teamAId === user?.id || f.teamBId === user?.id).sort((a, b) => {
               const order = { 'live': 1, 'upcoming': 2, 'completed': 3 };
               return (order[a.computedStatus] || 4) - (order[b.computedStatus] || 4);
            }).map(f => {
              const teamA = managers.find(m => m.id === f.teamAId) || { teamName: 'Unknown' };
              const teamB = managers.find(m => m.id === f.teamBId) || { teamName: 'Unknown' };
              const events = f.events || [];
              const teamAEvents = events.filter(e => e.teamId === teamA.id);
              const teamBEvents = events.filter(e => e.teamId === teamB.id);

              return (
                <div key={f.id} className="bg-slate-50 dark:bg-[#161618] rounded-xl border border-slate-200 dark:border-slate-800 p-3 md:p-4 overflow-hidden relative">
                  {f.computedStatus === 'live' && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-l border-b border-red-200 dark:border-red-900/30 text-[9px] font-bold uppercase tracking-widest rounded-bl-lg shadow-sm flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                      Live
                    </div>
                  )}
                  {f.computedStatus === 'completed' && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded-bl-lg">
                      FT
                    </div>
                  )}
                  {f.computedStatus === 'upcoming' && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-widest rounded-bl-lg">
                      Up
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{f.date ? new Date(f.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</p>
                    {f.venue && <p className="text-[9px] font-medium text-slate-400 mt-0.5">{f.venue}</p>}
                  </div>

                  <div className="flex items-center justify-between max-w-sm mx-auto">
                    <div className="flex-1 flex flex-col items-center text-center gap-2">
                      {teamA.teamLogo ? (
                        <img src={teamA.teamLogo} alt="" referrerPolicy="no-referrer" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 shadow-sm ring-2 ring-white dark:ring-[#111]">
                          {(teamA.teamName || teamA.name || 'T').charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">{teamA.teamName || teamA.name}</span>
                    </div>

                    <div className="px-4 flex flex-col items-center">
                      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-3 py-1 font-bold text-lg md:text-xl shadow-sm flex items-center gap-2 min-w-[70px] justify-center">
                        {f.computedStatus === 'upcoming' ? (
                          <span className="text-xs tracking-widest">VS</span>
                        ) : (
                          <>
                            <span>{f.teamAGoals}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base">-</span>
                            <span>{f.teamBGoals}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center gap-2">
                      {teamB.teamLogo ? (
                        <img src={teamB.teamLogo} alt="" referrerPolicy="no-referrer" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-[#111]" />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 shadow-sm ring-2 ring-white dark:ring-[#111]">
                          {(teamB.teamName || teamB.name || 'T').charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">{teamB.teamName || teamB.name}</span>
                    </div>
                  </div>

                  {/* Goal Scorers */}
                  {(teamAEvents.length > 0 || teamBEvents.length > 0) && (
                    <div className="mt-6 flex justify-center">
                      <button onClick={() => toggleFixture(f.id)} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600 transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full">
                        {expandedFixtures[f.id] ? 'Hide Match Details' : 'View Match Details'}
                        <svg className={`w-3 h-3 transition-transform ${expandedFixtures[f.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  )}

                  {expandedFixtures[f.id] && (
                    <div className="animate-fade-in">
                      {(teamAEvents.length > 0 || teamBEvents.length > 0) && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex">
                          <div className="flex-1 border-r border-slate-200 dark:border-slate-800 pr-4">
                            {(() => {
                              const groupedA = [];
                              const savesA = {};
                              teamAEvents.forEach(e => {
                                if (e.type === 'save') {
                                  savesA[e.playerId] = (savesA[e.playerId] || 0) + 1;
                                } else {
                                  groupedA.push(e);
                                }
                              });
                              Object.entries(savesA).forEach(([playerId, count]) => {
                                groupedA.push({ type: 'save', playerId, count });
                              });
                              return groupedA.map((e, i) => {
                                const player = players.find(p => p.id === e.playerId);
                                const assistPlayer = e.assistId && e.assistId !== 'none' ? players.find(p => p.id === e.assistId) : null;
                                return (
                                  <div key={i} className="flex justify-between items-center text-xs py-1">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                                      {assistPlayer && <span className="text-[9px] text-slate-400 font-medium">(A: {assistPlayer.name})</span>}
                                    </div>
                                    <span className="text-slate-400 font-medium shrink-0 ml-2">
                                      {e.type === 'goal' ? '⚽' : e.type === 'save' ? '🧤' : '🛡️'} {e.count ? `x${e.count}` : (e.minute ? `${e.minute}'` : '')}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          <div className="flex-1 pl-4">
                            {(() => {
                              const groupedB = [];
                              const savesB = {};
                              teamBEvents.forEach(e => {
                                if (e.type === 'save') {
                                  savesB[e.playerId] = (savesB[e.playerId] || 0) + 1;
                                } else {
                                  groupedB.push(e);
                                }
                              });
                              Object.entries(savesB).forEach(([playerId, count]) => {
                                groupedB.push({ type: 'save', playerId, count });
                              });
                              return groupedB.map((e, i) => {
                                const player = players.find(p => p.id === e.playerId);
                                const assistPlayer = e.assistId && e.assistId !== 'none' ? players.find(p => p.id === e.assistId) : null;
                                return (
                                  <div key={i} className="flex justify-between items-center text-xs py-1">
                                    <span className="text-slate-400 font-medium shrink-0 mr-2">
                                      {e.type === 'goal' ? '⚽' : e.type === 'save' ? '🧤' : '🛡️'} {e.count ? `x${e.count}` : (e.minute ? `${e.minute}'` : '')}
                                    </span>
                                    <div className="flex flex-col text-right">
                                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                                      {assistPlayer && <span className="text-[9px] text-slate-400 font-medium">(A: {assistPlayer.name})</span>}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Man of the Match */}
                      {f.computedStatus === 'completed' && f.motmId && (
                         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center animate-fade-in">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg> Man of the Match</p>
                        {(() => {
                           const motm = players.find(p => p.id === f.motmId);
                           if (!motm) return null;
                           return (
                              <div className="flex items-center gap-3 bg-white dark:bg-[#0a0a0c] px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm w-full max-w-[200px] justify-center">
                                 {motm.pic ? <img src={motm.pic} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-400" /> : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs ring-2 ring-amber-400 text-amber-500">{motm.name.charAt(0)}</div>}
                                 <div className="text-left overflow-hidden">
                                    <p className="font-black text-sm text-slate-900 dark:text-white leading-tight truncate">{motm.name}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{managers.find(m => m.id === motm.teamId)?.teamName || 'Unknown'}</p>
                                 </div>
                              </div>
                           );
                        })()}
                     </div>
                  )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'teams' && (
           <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {managers.map(team => {
                    const teamPlayers = players.filter(p => p.teamId === team.id && p.status === 'sold');
                    const isExpanded = expandedTeams[team.id];
                    return (
                       <div key={team.id} className="bg-slate-50 dark:bg-[#161618] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="bg-slate-100 dark:bg-[#111] p-3 flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50">
                             {team.teamLogo ? (
                                <img src={team.teamLogo} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                             ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500">
                                   {(team.teamName || 'T').charAt(0)}
                                </div>
                             )}
                             <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{team.teamName || team.name}</h3>
                                <p className="text-[10px] font-medium text-slate-500">{teamPlayers.length} Players</p>
                             </div>
                             <button
                                onClick={() => setExpandedTeams(prev => ({ ...prev, [team.id]: !prev[team.id] }))}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shrink-0"
                             >
                                {isExpanded ? 'Hide' : 'View Players'}
                             </button>
                          </div>
                          {isExpanded && (
                             <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                {teamPlayers.length === 0 ? (
                                   <p className="text-center text-xs text-slate-500 py-4">No players yet.</p>
                                ) : (
                                   teamPlayers.map(p => (
                                      <div 
                                        key={p.id} 
                                        onClick={() => setSelectedPlayer(p)}
                                        className="flex items-center gap-2 bg-white dark:bg-[#0a0a0c] p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                                      >
                                         {p.pic ? (
                                            <img src={p.pic} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                                         ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-400">{p.name.charAt(0)}</div>
                                         )}
                                         <div className="overflow-hidden flex-1 flex items-center justify-between">
                                            <p className="font-medium text-xs text-slate-800 dark:text-slate-300 truncate">{p.name}</p>
                                            <p className="text-[9px] text-slate-400 uppercase">{p.position}</p>
                                         </div>
                                      </div>
                                   ))
                                )}
                             </div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

        {activeTab === 'stats' && (
           <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 items-start">
              <PLStatCard 
                 title="Goals" 
                 data={topScorers} 
                 valueKey="goals" 
                 label="Goals" 
                 colorClass="text-indigo-600 dark:text-indigo-400" 
                 bgGradient="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40"
                 managers={managers}
                 expandedId={expandedScorer}
                 setExpandedId={setExpandedScorer}
                 expandedRender={(p) => (
                    <div>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Goals Scored Against</p>
                       <div className="space-y-1.5">
                          {fixtures.flatMap(f => (f.events || []).filter(e => e.type === 'goal' && e.playerId === p.id).map((e, idx) => {
                             const oppTeamId = f.teamAId === p.teamId ? f.teamBId : f.teamAId;
                             const oppTeam = managers.find(m => m.id === oppTeamId);
                             return (
                                <div key={`${e.id}-${idx}`} className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161618] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                   <span className="truncate">vs {oppTeam?.teamName || 'Unknown Team'}</span>
                                   <span className="text-indigo-500 shrink-0 ml-2">{e.minute ? `${e.minute}'` : 'N/A'}</span>
                                </div>
                             );
                          }))}
                       </div>
                    </div>
                 )}
              />

              <PLStatCard 
                 title="Assists" 
                 data={topAssists} 
                 valueKey="assists" 
                 label="Assists" 
                 colorClass="text-emerald-600 dark:text-emerald-400" 
                 bgGradient="bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40"
                 managers={managers}
                 expandedId={expandedAssist}
                 setExpandedId={setExpandedAssist}
                 expandedRender={(p) => (
                    <div>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Assists Against</p>
                       <div className="space-y-1.5">
                          {fixtures.flatMap(f => (f.events || []).filter(e => e.type === 'goal' && e.assistId === p.id).map((e, idx) => {
                             const oppTeamId = f.teamAId === p.teamId ? f.teamBId : f.teamAId;
                             const oppTeam = managers.find(m => m.id === oppTeamId);
                             return (
                                <div key={`${e.id}-${idx}`} className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161618] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                   <span className="truncate">vs {oppTeam?.teamName || 'Unknown Team'}</span>
                                   <span className="text-emerald-500 shrink-0 ml-2">{e.minute ? `${e.minute}'` : 'N/A'}</span>
                                </div>
                             );
                          }))}
                       </div>
                    </div>
                 )}
              />
              
              <PLStatCard 
                 title="Clean Sheets" 
                 data={topCleanSheets} 
                 valueKey="cleanSheets" 
                 label="Clean Sheets" 
                 colorClass="text-teal-600 dark:text-teal-400" 
                 bgGradient="bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40"
                 managers={managers}
              />

              <PLStatCard 
                 title="Saves" 
                 data={topSaves} 
                 valueKey="saves" 
                 label="Saves" 
                 colorClass="text-orange-600 dark:text-orange-400" 
                 bgGradient="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40"
                 managers={managers}
              />

              <PLStatCard 
                 title="Man of the Match" 
                 data={topMotms} 
                 valueKey="motms" 
                 label="Awards" 
                 colorClass="text-amber-600 dark:text-amber-400" 
                 bgGradient="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40"
                 managers={managers}
              />
           </div>
        )}
      </div>

      {/* Player Stats Modal */}
      {selectedPlayer && createPortal(
         <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPlayer(null)}></div>
            <div className="relative bg-white dark:bg-[#111] w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-slide-up overflow-hidden flex flex-col items-center text-center">
               <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
               </button>
               
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 overflow-hidden mb-4 shadow-lg shrink-0">
                  {selectedPlayer.pic ? (
                     <img src={selectedPlayer.pic} alt={selectedPlayer.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-5xl text-slate-400">
                        {selectedPlayer.name.charAt(0)}
                     </div>
                  )}
               </div>
               
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 leading-tight">{selectedPlayer.name}</h2>
               <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md">{selectedPlayer.position}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                     {managers.find(m => m.id === selectedPlayer.teamId)?.teamName || 'Unknown'}
                  </span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 w-full">
                  {(() => {
                     const stats = playerStats.find(p => p.id === selectedPlayer.id) || { goals: 0, assists: 0, saves: 0, cleanSheets: 0, motms: 0 };
                     return (
                        <>
                           <div className="bg-slate-50 dark:bg-[#161618] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.goals}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Goals</span>
                           </div>
                           <div className="bg-slate-50 dark:bg-[#161618] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.assists}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Assists</span>
                           </div>
                           <div className="bg-slate-50 dark:bg-[#161618] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.saves}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Saves</span>
                           </div>
                           <div className="bg-slate-50 dark:bg-[#161618] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center">
                              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{stats.cleanSheets}</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Clean Sheets</span>
                           </div>
                           <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex flex-col items-center mt-1">
                              <span className="text-xl font-black text-amber-600 dark:text-amber-500 leading-none mb-1">{stats.motms}</span>
                              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                 <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                                 Man of the Match
                              </span>
                           </div>
                        </>
                     );
                  })()}
               </div>
            </div>
         </div>,
         document.body
      )}
    </div>
  );
}
