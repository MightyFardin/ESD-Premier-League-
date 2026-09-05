import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function AdminSettings() {
  const { auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  
  const [localSettings, setLocalSettings] = useState(auctionSettings || {
    incrementRules: [], defaultManagerBudget: 10000, maxSquadSize: 15, allowCustomBids: true, defaultBasePrice: 100, auctionTimerDuration: 30, defaultIncrement: 10, auctioneerPassword: '123'
  });

  const [activeTab, setActiveTab] = useState('general');
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    if (auctionSettings) {
      setLocalSettings(auctionSettings);
    }
  }, [auctionSettings]);

  const handleSave = () => {
    socket?.emit('updateSettings', localSettings);
    showToast('System Settings Saved Successfully!');
  };

  const addRule = () => {
    setLocalSettings(prev => ({
      ...prev,
      incrementRules: [...(prev.incrementRules || []), { threshold: 1000, increment: 50 }]
    }));
  };

  const updateRule = (index, field, value) => {
    const newRules = [...(localSettings.incrementRules || [])];
    newRules[index][field] = parseInt(value);
    setLocalSettings(prev => ({ ...prev, incrementRules: newRules }));
  };

  const removeRule = (index) => {
    setLocalSettings(prev => ({
      ...prev,
      incrementRules: (prev.incrementRules || []).filter((_, i) => i !== index)
    }));
  };

  const handleReset = () => {
    if (resetConfirmText === 'CONFIRM') {
      socket?.emit('resetSystem');
      setResetConfirmText('');
      showToast("System has been completely reset!", 'error');
    }
  };

  const tabs = [
    { id: 'general', label: 'General Parameters' },
    { id: 'auction', label: 'Auction Rules & Timer' },
    { id: 'danger', label: 'Danger Zone', textClass: 'text-red-500' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">System Settings</h1>
          <p className="text-slate-500">Configure core auction rules and system-wide constants.</p>
        </div>
        <button onClick={handleSave} className="btn-primary py-3 px-8 text-[10px] tracking-widest uppercase font-black shadow-lg shadow-indigo-500/20 whitespace-nowrap">
          SAVE ALL SETTINGS
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black' 
                : `text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${tab.textClass || ''}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'general' && (
          <div className="card-minimal p-6 md:p-8 space-y-8">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-6">
              <h2 className="text-xl font-bold">General Parameters</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Default Manager Budget</label>
                <input 
                  type="number" 
                  className="input-field text-lg font-bold"
                  value={localSettings.defaultManagerBudget}
                  onChange={e => setLocalSettings({...localSettings, defaultManagerBudget: parseInt(e.target.value)})}
                />
                <p className="text-xs text-slate-500">Budget assigned to newly registering managers.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Default Player Base Price</label>
                <input 
                  type="number" 
                  className="input-field text-lg font-bold"
                  value={localSettings.defaultBasePrice}
                  onChange={e => setLocalSettings({...localSettings, defaultBasePrice: parseInt(e.target.value)})}
                />
                <p className="text-xs text-slate-500">Initial starting bid for all players.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Max Squad Size</label>
                <input 
                  type="number" 
                  className="input-field text-lg font-bold"
                  value={localSettings.maxSquadSize}
                  onChange={e => setLocalSettings({...localSettings, maxSquadSize: parseInt(e.target.value)})}
                />
                <p className="text-xs text-slate-500">Maximum players a manager can buy.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-indigo-600">Auctioneer Password</label>
                <input 
                  type="text" 
                  className="input-field text-lg font-bold"
                  value={localSettings.auctioneerPassword}
                  onChange={e => setLocalSettings({...localSettings, auctioneerPassword: e.target.value})}
                />
                <p className="text-xs text-slate-500">Password for the <b>auctioneer</b> login username.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auction' && (
          <div className="space-y-6">
            <div className="card-minimal p-6 md:p-8">
              <div className="flex items-center gap-2 text-orange-500 mb-6">
                <h2 className="text-xl font-bold">Auction Timer</h2>
              </div>
              
              <div className="space-y-2 max-w-sm">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Countdown Duration (Seconds)</label>
                <input 
                  type="number" 
                  className="input-field text-lg font-bold"
                  value={localSettings.auctionTimerDuration || 30}
                  onChange={e => setLocalSettings({...localSettings, auctionTimerDuration: parseInt(e.target.value)})}
                />
                <p className="text-xs text-slate-500">The timer resets to this value every time a new bid is placed.</p>
              </div>
            </div>

            <div className="card-minimal p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <h2 className="text-xl font-bold">Dynamic Bid Increments</h2>
                </div>
                <button onClick={addRule} className="btn-secondary py-2 text-[10px] font-black tracking-widest uppercase px-4">+ ADD RULE</button>
              </div>
              
              <div className="bg-slate-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <span className="text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider text-xs">Default Increment</span>
                    <input type="number" value={localSettings.defaultIncrement} onChange={e => setLocalSettings({...localSettings, defaultIncrement: parseInt(e.target.value)})} className="input-field w-24 px-3 py-1.5 h-10 font-bold text-indigo-600 dark:text-indigo-400 ml-auto" />
                  </div>
                  
                  {(localSettings.incrementRules || []).length === 0 && (
                    <p className="text-slate-500 text-sm mt-4">No dynamic rules set. Default increment will always be used.</p>
                  )}
                  {(localSettings.incrementRules || []).map((rule, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-sm bg-white dark:bg-[#111] p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">When Bid is Below</span>
                      <input type="number" value={rule.threshold} onChange={e => updateRule(i, 'threshold', e.target.value)} className="input-field w-32 px-3 py-1.5 h-10 font-bold" />
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs ml-2">&rarr; Increment By</span>
                      <input type="number" value={rule.increment} onChange={e => updateRule(i, 'increment', e.target.value)} className="input-field w-24 px-3 py-1.5 h-10 font-bold text-indigo-600 dark:text-indigo-400" />
                      <button onClick={() => removeRule(i)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 ml-auto px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">REMOVE</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl border border-slate-100 dark:border-slate-800">
                 <div>
                    <p className="font-bold text-sm">Allow Custom Manual Bids</p>
                    <p className="text-xs text-slate-500">If disabled, managers can only use the automatic increment button.</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={localSettings.allowCustomBids} onChange={e => setLocalSettings({...localSettings, allowCustomBids: e.target.checked})} />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                 </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="card-minimal border-red-500/20 border-2 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-900/10 p-6 md:p-8">
              <h2 className="text-2xl font-black text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
                Danger Zone
              </h2>
              <p className="text-red-800/70 dark:text-red-200/70 mb-6">Destructive actions that cannot be undone. Proceed with extreme caution.</p>
              
              <div className="bg-white dark:bg-[#111] border border-red-200 dark:border-red-900/50 rounded-xl p-6 shadow-sm">
                <h3 className="font-black text-lg text-red-700 dark:text-red-400 mb-2">Factory Reset System</h3>
                <p className="text-slate-500 text-sm mb-6">
                  This will permanently delete all players, all managers, and reset all auction histories. This action is irreversible.
                </p>
                
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-5 bg-red-50/50 dark:bg-[#2a1111]/50 rounded-lg border border-red-100 dark:border-red-900/30">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Type CONFIRM to proceed</label>
                    <input 
                      type="text" 
                      placeholder="CONFIRM" 
                      className="input-field border-red-200 dark:border-red-900/50 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-[#0a0a0a]" 
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleReset}
                    disabled={resetConfirmText !== 'CONFIRM'}
                    className="w-full md:w-auto py-3 px-8 font-black rounded-lg transition-all text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 md:mt-5"
                  >
                    NUKE SYSTEM
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
