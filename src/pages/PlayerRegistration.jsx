import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { CheckCircle } from 'lucide-react';

export default function PlayerRegistration() {
  const { user, players, socket } = useAuth();
  
  const existingPlayer = players.find(p => p.userId === user.id);

  const [formData, setFormData] = useState({
    name: user.name,
    age: '',
    position: 'Forward',
    basePrice: 1000000,
    stats: '',
    pic: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (existingPlayer) return;

    socket?.emit('addPlayer', {
      ...formData,
      id: Date.now().toString(),
      userId: user.id,
      status: 'unsold', // unsold, sold
      teamId: null,
      soldPrice: null
    });
  };

  if (existingPlayer) {
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className="card-minimal p-8 text-center bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Your profile is now live in the auction pool.</p>
          
          <div className="bg-white dark:bg-[#111] rounded-xl p-4 text-left border border-slate-200 dark:border-slate-800">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Profile</h3>
             <div className="flex items-center gap-3 mb-2">
               {existingPlayer.pic && <img src={existingPlayer.pic} alt="Profile" className="w-12 h-12 rounded-full object-cover" />}
               <p className="font-bold text-lg">{existingPlayer.name}</p>
             </div>
             <p className="text-sm text-slate-500">{existingPlayer.position} • Base: ${existingPlayer.basePrice?.toLocaleString()}</p>
             {existingPlayer.status === 'sold' && (
               <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold text-sm">
                 🎉 Sold for ${existingPlayer.soldPrice?.toLocaleString()}!
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Player Registration</h1>
        <p className="text-slate-500">Fill in your details to enter the auction draft.</p>
      </div>

      <div className="card-minimal p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Age</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Base Price ($)</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.basePrice}
                onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Position</label>
            <select 
              className="input-field"
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
            >
              <option>Attacker</option>
              <option>Midfield</option>
              <option>Defender</option>
              <option>GK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Profile Picture URL (Optional)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="https://..."
              value={formData.pic}
              onChange={e => setFormData({...formData, pic: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Previous Stats (Optional)</label>
            <textarea 
              className="input-field min-h-[100px]" 
              placeholder="Goals, Assists, Clean sheets..."
              value={formData.stats}
              onChange={e => setFormData({...formData, stats: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 mt-4">
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
}
