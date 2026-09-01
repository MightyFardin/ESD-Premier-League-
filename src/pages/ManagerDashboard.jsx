import React from 'react';
import { useAuth } from '../AuthContext';
import { Users, DollarSign, Activity } from 'lucide-react';

export default function ManagerDashboard() {
  const { user, managers, players } = useAuth();
  
  const myTeam = managers.find(m => m.id === user.id) || { id: user.id, budget: 10000, name: user.name };
  const myPlayers = players.filter(p => p.teamId === myTeam.id);

  const getPosCount = (pos) => myPlayers.filter(p => p.position === pos).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Team Dashboard</h1>
        <p className="text-slate-500">Manage your squad and budget.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-minimal p-6 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
              <DollarSign className="text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Remaining Budget</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{myTeam.budget?.toLocaleString() || 0} pts</h2>
            </div>
          </div>
        </div>

        <div className="card-minimal p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Users className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Squad Size</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{myPlayers.length}</h2>
            </div>
          </div>
        </div>

        <div className="card-minimal p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Activity className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Squad Balance</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-bold">
                 <div className="flex justify-between"><span>GK:</span> <span>{getPosCount('GK')}</span></div>
                 <div className="flex justify-between"><span>DEF:</span> <span>{getPosCount('Defender')}</span></div>
                 <div className="flex justify-between"><span>MID:</span> <span>{getPosCount('Midfield')}</span></div>
                 <div className="flex justify-between"><span>ATT:</span> <span>{getPosCount('Attacker')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-minimal p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
          <h3 className="font-bold">Your Squad</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {myPlayers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No players bought yet. Go to Live Auction!
            </div>
          ) : (
            myPlayers.map(p => (
              <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors">
                <div className="flex items-center gap-3">
                  {p.pic ? (
                    <img src={p.pic} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                       <span className="text-sm font-black text-slate-400">{p.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.position}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{p.soldPrice?.toLocaleString()} pts</p>
                  <p className="text-[10px] text-slate-400 uppercase">Bought For</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
