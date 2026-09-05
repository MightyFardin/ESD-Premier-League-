import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function ManagerManagement() {
  const { managers, players, socket } = useAuth();
  const { showToast } = useToast();
  
  const [editingManager, setEditingManager] = useState(null);
  const [isAddingManager, setIsAddingManager] = useState(false);

  const saveManager = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: editingManager?.id || Date.now().toString(),
      name: formData.get('name') || '',
      teamName: formData.get('teamName') || '',
      username: formData.get('username') || '',
      password: formData.get('password') || ''
    };

    if (editingManager?.id) {
      socket?.emit('editManager', data);
      showToast('Team updated successfully!', 'success');
    } else {
      socket?.emit('createManager', data);
      showToast('Team registered successfully!', 'success');
    }
    
    setEditingManager(null);
    setIsAddingManager(false);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Section */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-white border border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Team Management</h1>
          <p className="text-slate-400 text-sm">
            Register franchises, assign manager credentials, and allocate team budgets.
          </p>
        </div>
        
        <button 
          onClick={() => { setIsAddingManager(true); setEditingManager(null); }} 
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl font-bold transition-colors"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">+ REGISTER TEAM</span>
        </button>
      </div>

      {/* Form Section */}
      {(isAddingManager || editingManager) && (
        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
              {editingManager ? 'EDIT FRANCHISE' : 'NEW FRANCHISE'}
            </h3>
            <button onClick={() => { setIsAddingManager(false); setEditingManager(null); }} className="p-2 text-[10px] font-black tracking-widest text-slate-500 hover:text-red-500 rounded-full transition-colors uppercase">
              CLOSE
            </button>
          </div>
          
          <form onSubmit={saveManager} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manager Name</label>
                <input name="name" defaultValue={editingManager?.name || ''} required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="e.g. Pep Guardiola" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Franchise Name</label>
                <input name="teamName" defaultValue={editingManager?.teamName || ''} required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="e.g. Manchester City" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Login Username</label>
                <input name="username" defaultValue={editingManager?.username || ''} required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="e.g. mancity1" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Login Password</label>
                <input name="password" type="text" defaultValue={editingManager?.password || ''} required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="Secure Password" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors">
                {editingManager ? 'SAVE' : 'REGISTER'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(!managers || managers.length === 0) && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
               <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <p className="font-bold text-lg text-slate-900 dark:text-white mb-1">No Franchises Yet</p>
            <p className="text-xs font-medium max-w-sm mx-auto">Register a team to begin.</p>
          </div>
        )}
        
        {managers && managers.map((m, idx) => {
          if (!m) return null;
          return (
            <div key={m.id || idx} className="bg-white dark:bg-[#111] rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1a1a1c] text-slate-700 dark:text-slate-300 font-black flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                      {m.teamName ? m.teamName.charAt(0).toUpperCase() : 'T'}
                   </div>
                   <div className="overflow-hidden">
                     <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{m.teamName || 'Unnamed Franchise'}</h3>
                     <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5 truncate">{m.name || 'Unknown Manager'}</p>
                   </div>
                </div>
                
                <button 
                  onClick={() => setEditingManager(m)} 
                  className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-[#1a1a1c] text-slate-400 hover:text-indigo-500 rounded-lg transition-colors shrink-0"
                  title="Edit Team"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                 <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Budget</p>
                   <p className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                     {typeof m.budget === 'number' ? m.budget.toLocaleString() : '0'} <span className="text-[10px] text-slate-500 font-bold">pts</span>
                   </p>
                 </div>
              </div>
              
              {/* Squad Details */}
              <details className="group mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                <summary className="text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer list-none flex items-center justify-between hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-2">
                  View Squad ({(players || []).filter(p => p.teamId === m.id).length})
                  <svg className="w-3.5 h-3.5 transform group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </summary>
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1 mb-3">
                  {(() => {
                    const squad = (players || []).filter(p => p.teamId === m.id);
                    if (squad.length === 0) return <p className="text-xs text-slate-400 italic">No players bought yet.</p>;
                    return squad.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-[#161618] px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{p.name}</span>
                        <span className="text-[10px] font-black text-indigo-500 shrink-0">{p.soldPrice} pts</span>
                      </div>
                    ));
                  })()}
                </div>
              </details>
              
              <details className="group mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                <summary className="text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer list-none flex items-center justify-between hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  View Credentials
                  <svg className="w-3.5 h-3.5 transform group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-[#161618] rounded-lg p-2 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[9px] font-bold text-slate-400 mb-0.5">Username</p>
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{m.username || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#161618] rounded-lg p-2 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[9px] font-bold text-slate-400 mb-0.5">Password</p>
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{m.password || 'N/A'}</p>
                  </div>
                </div>
              </details>

            </div>
          );
        })}
      </div>
    </div>
  );
}
