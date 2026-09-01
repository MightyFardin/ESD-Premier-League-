import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { Save, UserPlus, X, Edit, Lock, Users, Trash2 } from 'lucide-react';

export default function ManagerManagement() {
  const { managers, auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  
  const [editingManager, setEditingManager] = useState(null);
  const [isAddingManager, setIsAddingManager] = useState(false);

  const saveManager = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: editingManager?.id || Date.now().toString(),
      name: formData.get('name'),
      teamName: formData.get('teamName'),
      username: formData.get('username'),
      password: formData.get('password')
    };

    if (editingManager?.id) {
      socket?.emit('editManager', data);
      showToast('Team/Manager updated successfully!');
    } else {
      socket?.emit('createManager', data);
      showToast('Team/Manager added successfully!');
    }
    
    setEditingManager(null);
    setIsAddingManager(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Team & Manager Setup</h1>
        <p className="text-slate-500">Create login credentials and allocate budgets for participating teams.</p>
      </div>

      <div className="card-minimal p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Users size={20} />
            <h2 className="text-lg font-bold">Registered Teams</h2>
          </div>
          <button onClick={() => { setIsAddingManager(true); setEditingManager(null); }} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <UserPlus size={16} /> Add Team
          </button>
        </div>

        {(isAddingManager || editingManager) && (
          <form onSubmit={saveManager} className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm relative">
            <button type="button" onClick={() => { setIsAddingManager(false); setEditingManager(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-red-500">
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg mb-4">{editingManager ? 'Edit Team Details' : 'Register New Team'}</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Manager Name</label>
                <input name="name" defaultValue={editingManager?.name} required className="input-field" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Team Name</label>
                <input name="teamName" defaultValue={editingManager?.teamName} required className="input-field" placeholder="e.g. The Invincibles" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Login Username</label>
                <input name="username" defaultValue={editingManager?.username} required className="input-field" placeholder="e.g. manager1" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Login Password</label>
                <input name="password" type="text" defaultValue={editingManager?.password} required className="input-field" placeholder="Secret Password" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="btn-primary py-2 px-8 text-sm"><Save size={16} /> Save Team</button>
            </div>
          </form>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.length === 0 && (
            <p className="text-sm text-slate-500 col-span-full text-center py-8">No teams registered yet. Click "Add Team" to start.</p>
          )}
          {managers.map(m => (
            <div key={m.id} className="bg-white dark:bg-[#1a1a1a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 group">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">{m.teamName || 'Unnamed Team'}</h3>
                <p className="text-sm text-slate-500">Manager: <span className="font-bold text-slate-700 dark:text-slate-300">{m.name}</span></p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col gap-1">
                <p className="text-xs text-slate-500 font-bold uppercase">Login Credentials</p>
                <p className="text-sm font-mono bg-white dark:bg-[#111] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 truncate">user: {m.username}</p>
                <p className="text-sm font-mono bg-white dark:bg-[#111] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 truncate">pass: {m.password}</p>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Remaining Budget</p>
                   <p className="font-black text-indigo-600 dark:text-indigo-400">{m.budget?.toLocaleString()} pts</p>
                </div>
                <button onClick={() => setEditingManager(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                  <Edit size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
