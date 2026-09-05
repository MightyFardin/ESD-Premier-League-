import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function ManagerManagement() {
  const { managers, socket } = useAuth();
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!managers || managers.length === 0) && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="font-bold">No Franchises Registered</p>
          </div>
        )}
        
        {managers && managers.map((m, idx) => {
          if (!m) return null;
          return (
            <div key={m.id || idx} className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{m.name || 'Unknown Manager'}</p>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{m.teamName || 'Unnamed Franchise'}</h3>
                </div>
                
                <button 
                  onClick={() => setEditingManager(m)} 
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-[#1a1a1c] text-slate-500 hover:text-indigo-500 rounded-lg transition-colors"
                >
                  EDIT
                </button>
              </div>
              
              <div className="bg-slate-50 dark:bg-[#161618] rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">User:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{m.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Pass:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{m.password || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Budget</p>
                 <p className="font-black text-xl text-indigo-600 dark:text-indigo-400">
                   {typeof m.budget === 'number' ? m.budget.toLocaleString() : '0'} <span className="text-sm">pts</span>
                 </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
