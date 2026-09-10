import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Countdown from './Countdown';

export default function TournamentDashboard() {
  const { user, fixtures = [], managers = [], players = [] } = useAuth();
  
  const [activeTab, setActiveTab] = useState('points'); // 'points', 'fixtures'
  const [filterType, setFilterType] = useState('all'); // 'all', 'mine'

  const nextGame = fixtures.find(f => f.status === 'upcoming');

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

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Tab Navigation */}
      <div className="flex bg-slate-200 dark:bg-[#161618] p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'points' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Points Table
        </button>
        <button 
          onClick={() => setActiveTab('fixtures')}
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'fixtures' ? 'bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          Fixtures
        </button>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-8 min-h-[500px]">
        {activeTab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                  <th className="py-4 px-4 font-black">Pos</th>
                  <th className="py-4 px-4 font-black">Team</th>
                  <th className="py-4 px-2 font-black text-center">P</th>
                  <th className="py-4 px-2 font-black text-center hidden md:table-cell">W</th>
                  <th className="py-4 px-2 font-black text-center hidden md:table-cell">D</th>
                  <th className="py-4 px-2 font-black text-center hidden md:table-cell">L</th>
                  <th className="py-4 px-2 font-black text-center hidden sm:table-cell">GF</th>
                  <th className="py-4 px-2 font-black text-center hidden sm:table-cell">GA</th>
                  <th className="py-4 px-2 font-black text-center">GD</th>
                  <th className="py-4 px-4 font-black text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {pointsTable.map((team, idx) => (
                  <tr key={team.id} className={`hover:bg-slate-50 dark:hover:bg-[#161618] transition-colors relative ${idx < 2 ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : ''}`}>
                    <td className="py-4 px-4 text-sm font-bold text-slate-900 dark:text-white relative">
                       {idx < 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>}
                       {idx + 1}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {team.logo ? (
                          <img src={team.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                            {team.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[120px] md:max-w-[200px]">{team.name}</span>
                        {idx < 2 && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">Q</span>}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{team.played}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-slate-500 hidden md:table-cell">{team.won}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-slate-500 hidden md:table-cell">{team.drawn}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-slate-500 hidden md:table-cell">{team.lost}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-emerald-500 hidden sm:table-cell">{team.gf}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-red-500 hidden sm:table-cell">{team.ga}</td>
                    <td className="py-4 px-2 text-center text-sm font-bold text-slate-700 dark:text-slate-300">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                    <td className="py-4 px-4 text-right text-base font-black text-indigo-600 dark:text-indigo-400">{team.points}</td>
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
            
            {fixtures.filter(f => filterType === 'all' || f.teamAId === user?.id || f.teamBId === user?.id).length === 0 && (
              <p className="text-center py-8 text-slate-500 font-bold text-sm">No fixtures scheduled.</p>
            )}
            {fixtures.filter(f => filterType === 'all' || f.teamAId === user?.id || f.teamBId === user?.id).map(f => {
              const teamA = managers.find(m => m.id === f.teamAId) || { teamName: 'Unknown' };
              const teamB = managers.find(m => m.id === f.teamBId) || { teamName: 'Unknown' };
              const events = f.events || [];
              const teamAEvents = events.filter(e => e.teamId === teamA.id);
              const teamBEvents = events.filter(e => e.teamId === teamB.id);

              return (
                <div key={f.id} className="bg-slate-50 dark:bg-[#161618] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 overflow-hidden relative">
                  {f.status === 'live' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-l border-b border-red-200 dark:border-red-900/30 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Live
                    </div>
                  )}
                  {f.status === 'completed' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                      Full Time
                    </div>
                  )}
                  {f.status === 'upcoming' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg">
                      Upcoming
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{f.date ? new Date(f.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBD'}</p>
                    {f.venue && <p className="text-[10px] font-bold text-slate-400 mt-1">{f.venue}</p>}
                  </div>

                  <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex-1 flex flex-col items-center text-center gap-3">
                      {teamA.teamLogo ? (
                        <img src={teamA.teamLogo} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-[#111]" />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400 shadow-lg ring-4 ring-white dark:ring-[#111]">
                          {(teamA.teamName || teamA.name || 'T').charAt(0)}
                        </div>
                      )}
                      <span className="font-black text-sm md:text-base text-slate-900 dark:text-white leading-tight">{teamA.teamName || teamA.name}</span>
                    </div>

                    <div className="px-6 flex flex-col items-center">
                      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl px-4 py-2 font-black text-2xl md:text-3xl shadow-xl flex items-center gap-3 min-w-[100px] justify-center">
                        {f.status === 'upcoming' ? (
                          <span className="text-sm md:text-base tracking-widest">V S</span>
                        ) : (
                          <>
                            <span>{f.teamAGoals}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-lg md:text-xl">-</span>
                            <span>{f.teamBGoals}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center text-center gap-3">
                      {teamB.teamLogo ? (
                        <img src={teamB.teamLogo} alt="" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-[#111]" />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400 shadow-lg ring-4 ring-white dark:ring-[#111]">
                          {(teamB.teamName || teamB.name || 'T').charAt(0)}
                        </div>
                      )}
                      <span className="font-black text-sm md:text-base text-slate-900 dark:text-white leading-tight">{teamB.teamName || teamB.name}</span>
                    </div>
                  </div>

                  {/* Goal Scorers */}
                  {(teamAEvents.length > 0 || teamBEvents.length > 0) && (
                    <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex">
                      <div className="flex-1 border-r border-slate-200 dark:border-slate-800 pr-4">
                        {teamAEvents.map((e, i) => {
                          const player = players.find(p => p.id === e.playerId);
                          return (
                            <div key={i} className="flex justify-between items-center text-xs py-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                              <span className="text-slate-400 font-medium">⚽ {e.minute && `${e.minute}'`}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex-1 pl-4">
                        {teamBEvents.map((e, i) => {
                          const player = players.find(p => p.id === e.playerId);
                          return (
                            <div key={i} className="flex justify-between items-center text-xs py-1">
                              <span className="text-slate-400 font-medium">⚽ {e.minute && `${e.minute}'`}</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{player?.name || 'Unknown'}</span>
                            </div>
                          );
                        })}
                      </div>
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
