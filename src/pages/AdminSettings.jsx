import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function AdminSettings() {
  const { auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  
  const [localSettings, setLocalSettings] = useState(auctionSettings || {
    incrementRules: [], defaultManagerBudget: 10000, maxSquadSize: 15, allowCustomBids: true, defaultBasePrice: 100, auctionTimerDuration: 30, defaultIncrement: 10, auctioneerPassword: '123', globalNotice: '', auctionStartDate: ''
  });

  const [activeTab, setActiveTab] = useState('general');
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [draftNotice, setDraftNotice] = useState('');

  useEffect(() => {
    if (auctionSettings) {
      setLocalSettings(auctionSettings);
    }
  }, [auctionSettings]);

  const handleSave = () => {
    socket?.emit('updateSettings', localSettings);
    showToast('System Settings Saved Successfully!');
  };

  const handleSendNotice = () => {
    if (!draftNotice.trim()) return;
    const updatedHistory = [{ text: draftNotice, date: new Date().toISOString() }, ...(localSettings.noticeHistory || [])];
    const newSettings = { ...localSettings, globalNotice: draftNotice, noticeHistory: updatedHistory };
    setLocalSettings(newSettings);
    socket?.emit('updateSettings', newSettings);
    showToast('Notice sent globally!');
    setDraftNotice('');
  };

  const handleClearNotice = () => {
    const newSettings = { ...localSettings, globalNotice: '' };
    setLocalSettings(newSettings);
    socket?.emit('updateSettings', newSettings);
    showToast('Active notice cleared!');
  };

  const handleStartAuctionNow = () => {
    const newSettings = { ...localSettings, auctionStartDate: '' };
    setLocalSettings(newSettings);
    socket?.emit('updateSettings', newSettings);
    showToast('Timer cleared! Auction is live.');
  };

  const handleDeleteHistory = (index) => {
    const updatedHistory = (localSettings.noticeHistory || []).filter((_, i) => i !== index);
    const newSettings = { ...localSettings, noticeHistory: updatedHistory };
    setLocalSettings(newSettings);
    socket?.emit('updateSettings', newSettings);
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

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <div className="sticky top-0 z-50 bg-slate-50/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 -mx-4 md:-mx-10 px-4 md:px-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            System Configuration
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage core auction rules, global constants, and security.</p>
        </div>
        <button onClick={handleSave} className="btn-primary py-3.5 px-8 text-xs tracking-widest uppercase font-black shadow-xl shadow-indigo-600/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save Changes
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Navigation Sidebar (Desktop) */}
        <div className="hidden md:block col-span-3">
           <div className="sticky top-40 space-y-2">
              <a href="#general" className="block px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">General Settings</a>
              <a href="#announcements" className="block px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all">Notice & Schedule</a>
              <a href="#engine" className="block px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all">Auction Engine</a>
              <a href="#increments" className="block px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">Bid Increments</a>
              <a href="#danger" className="block px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">Danger Zone</a>
           </div>
        </div>

        {/* Content */}
        <div className="col-span-12 md:col-span-9 space-y-12">
          
          {/* Notice & Schedule Section */}
          <section id="announcements" className="scroll-mt-40">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </span>
              Notice & Schedule
            </h2>
            <div className="card-minimal p-6 md:p-8 flex flex-col gap-6 shadow-sm">
              <div className="space-y-6">
                
                {localSettings.globalNotice && (
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl p-5 relative">
                    <span className="absolute -top-3 left-4 bg-cyan-100 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Active Notice</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{localSettings.globalNotice}</p>
                    <button onClick={handleClearNotice} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Clear Active Notice</button>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Draft New Notice</label>
                  <textarea 
                    className="input-field min-h-[100px] resize-y py-3 text-sm font-bold" 
                    value={draftNotice} 
                    onChange={e => setDraftNotice(e.target.value)}
                    placeholder="Enter a notice that will be broadcasted globally across all pages..."
                  />
                  <button onClick={handleSendNotice} disabled={!draftNotice.trim()} className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-cyan-600/20">
                    Send Notice Now
                  </button>
                </div>

                {localSettings.noticeHistory?.length > 0 && (
                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Notice History</label>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {localSettings.noticeHistory.map((notice, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-100 dark:border-slate-800/60">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{notice.text}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(notice.date).toLocaleString()}</p>
                          </div>
                          <button onClick={() => handleDeleteHistory(idx)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-900/20 rounded">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Auction Start Schedule</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <input 
                    type="datetime-local" 
                    className="input-field text-sm font-bold max-w-sm flex-1" 
                    value={localSettings.auctionStartDate || ''} 
                    onChange={e => setLocalSettings({...localSettings, auctionStartDate: e.target.value})}
                  />
                  <button 
                    onClick={handleStartAuctionNow} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                  >
                    Start Auction Now
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-medium">Sets a global countdown timer. Clicking "Start Auction Now" will instantly clear the timer.</p>
              </div>
            </div>
          </section>

          {/* General Section */}
          <section id="general" className="scroll-mt-40">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </span>
              General Settings
            </h2>
            <div className="card-minimal p-6 md:p-8 grid md:grid-cols-2 gap-8 shadow-sm">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Default Manager Budget</label>
                <div className="relative">
                  <input type="number" className="input-field pl-12 text-lg font-bold" value={localSettings.defaultManagerBudget} onChange={e => setLocalSettings({...localSettings, defaultManagerBudget: parseInt(e.target.value)})} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">pts</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Starting budget for new managers.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Default Base Price</label>
                <div className="relative">
                  <input type="number" className="input-field pl-12 text-lg font-bold" value={localSettings.defaultBasePrice} onChange={e => setLocalSettings({...localSettings, defaultBasePrice: parseInt(e.target.value)})} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">pts</span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Initial bid price for unsold players.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Max Squad Size</label>
                <div className="relative">
                  <input type="number" className="input-field pl-12 text-lg font-bold" value={localSettings.maxSquadSize} onChange={e => setLocalSettings({...localSettings, maxSquadSize: parseInt(e.target.value)})} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Limit on players per team.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Auctioneer Password</label>
                <div className="relative">
                  <input type="text" className="input-field pl-12 text-lg font-bold" value={localSettings.auctioneerPassword} onChange={e => setLocalSettings({...localSettings, auctioneerPassword: e.target.value})} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Access code for the auctioneer login.</p>
              </div>
            </div>
          </section>

          {/* Auction Engine */}
          <section id="engine" className="scroll-mt-40">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </span>
              Auction Engine
            </h2>
            <div className="card-minimal p-6 md:p-8 space-y-8 shadow-sm border border-orange-100 dark:border-orange-900/30 bg-gradient-to-br from-white to-orange-50/30 dark:from-[#111] dark:to-[#1a1310]">
              <div className="max-w-md space-y-3">
                <label className="block text-[11px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">Countdown Duration</label>
                <div className="relative">
                  <input type="number" className="input-field pl-12 text-lg font-bold" value={localSettings.auctionTimerDuration || 30} onChange={e => setLocalSettings({...localSettings, auctionTimerDuration: parseInt(e.target.value)})} />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-orange-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">The timer resets to this value (in seconds) whenever a new bid is placed.</p>
              </div>

              <div className="flex items-center justify-between p-5 bg-white dark:bg-[#151515] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="pr-4">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Allow Custom Manual Bids</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">If disabled, managers can only use the automated "+ Increment" button.</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer shrink-0">
                   <input type="checkbox" className="sr-only peer" checked={localSettings.allowCustomBids} onChange={e => setLocalSettings({...localSettings, allowCustomBids: e.target.checked})} />
                   <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                 </label>
              </div>
            </div>
          </section>

          {/* Bid Increments */}
          <section id="increments" className="scroll-mt-40">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </span>
              Dynamic Bid Increments
            </h2>
            <div className="card-minimal p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <p className="text-xs text-slate-500 font-medium max-w-sm">
                  Configure how much the bid increases automatically based on the current bid value.
                </p>
                <button onClick={addRule} className="btn-secondary bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-900/40 py-2.5 text-[10px] font-black tracking-widest uppercase px-5 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  ADD RULE
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#161618] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-1">
                     <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">*</span>
                     <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Default Increment</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">By</span>
                     <input type="number" value={localSettings.defaultIncrement} onChange={e => setLocalSettings({...localSettings, defaultIncrement: parseInt(e.target.value)})} className="input-field w-24 h-10 font-black text-center text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                
                {(localSettings.incrementRules || []).length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-sm font-medium">No dynamic rules set. Default increment will always be used.</p>
                  </div>
                )}
                
                {(localSettings.incrementRules || []).map((rule, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                    <div className="flex items-center gap-3 flex-1">
                       <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-black text-emerald-600">{i+1}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Below</span>
                       <input type="number" value={rule.threshold} onChange={e => updateRule(i, 'threshold', e.target.value)} className="input-field w-28 h-10 font-bold text-center" />
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><svg className="w-3 h-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> Incr. By</span>
                       <input type="number" value={rule.increment} onChange={e => updateRule(i, 'increment', e.target.value)} className="input-field w-24 h-10 font-black text-center text-emerald-600 dark:text-emerald-400" />
                       <button onClick={() => removeRule(i)} className="w-10 h-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove Rule">
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section id="danger" className="scroll-mt-40 pt-8">
            <div className="card-minimal border-red-500/20 border-2 overflow-hidden bg-gradient-to-br from-red-50/50 to-white dark:from-[#1a0f0f] dark:to-[#111]">
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-black text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Danger Zone
                </h2>
                <p className="text-red-800/70 dark:text-red-200/70 text-sm font-medium mb-8">Destructive actions that cannot be undone. Proceed with extreme caution.</p>
                
                <div className="bg-white dark:bg-[#0a0a0c] border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-base text-red-700 dark:text-red-400 mb-1">Factory Reset System</h3>
                  <p className="text-slate-500 text-xs font-medium mb-6">
                    This will permanently delete all players, managers, and reset all auction histories.
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-5 bg-red-50/50 dark:bg-[#160a0a] rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-black text-red-500 mb-2 uppercase tracking-widest">Type "CONFIRM" to proceed</label>
                      <input 
                        type="text" 
                        placeholder="CONFIRM" 
                        className="input-field border-red-200 dark:border-red-900/50 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-[#000] text-red-600 dark:text-red-400 font-bold" 
                        value={resetConfirmText}
                        onChange={(e) => setResetConfirmText(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleReset}
                      disabled={resetConfirmText !== 'CONFIRM'}
                      className="w-full md:w-auto py-3.5 px-8 font-black text-xs tracking-widest rounded-xl transition-all text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-600/20 md:mt-6 whitespace-nowrap"
                    >
                      NUKE SYSTEM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
