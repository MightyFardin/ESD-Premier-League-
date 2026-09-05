import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import CustomSelect from '../components/CustomSelect';
import { Link } from 'react-router-dom';

const getSessionStr = (studentId) => {
  if (!studentId || studentId.length < 2) return 'Unknown';
  const prefixStr = studentId.substring(0, 2);
  const prefix = parseInt(prefixStr);
  if (isNaN(prefix)) return 'Unknown';
  return `20${prefixStr}-20${prefix + 1}`;
};

export default function AdminDashboard() {
  const { players, managers, liveAuction, auctionSettings, bids, socket } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('players'); // 'players', 'teams'
  
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingManager, setEditingManager] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [selectedBidHistoryPlayer, setSelectedBidHistoryPlayer] = useState(null);
  const [deletingPlayer, setDeletingPlayer] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmStopAuction, setConfirmStopAuction] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPicUrl, setUploadedPicUrl] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  
  const [filterSession, setFilterSession] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');
  
  const allSessions = ['All', ...Array.from(new Set(players.map(p => getSessionStr(p.studentId)))).sort()];
  
  const filteredPlayers = players.filter(p => {
    const matchSession = filterSession === 'All' || getSessionStr(p.studentId) === filterSession;
    const matchPos = filterPosition === 'All' || p.position === filterPosition;
    return matchSession && matchPos;
  });

  const handleStartAuction = (playerId) => {
    socket?.emit('startAuction', playerId);
  };

  const handleStopAuction = () => {
    socket?.emit('stopAuction', 'sell');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'football_preset');
    
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/nex8nsti/image/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      
      setUploadedPicUrl(data.secure_url);
      showToast("Image uploaded to Cloudinary successfully!", "success");
    } catch (err) {
      console.error("Cloudinary Error:", err);
      showToast(`Cloudinary Error: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const savePlayer = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const picValue = uploadedPicUrl || formData.get('picUrl') || editingPlayer?.pic || '';
    if (!selectedPosition) return showToast("Please select a position", 'error');

    const data = {
      id: editingPlayer.id || Date.now().toString(),
      studentId: formData.get('studentId') || '',
      name: formData.get('name'),
      position: selectedPosition,
      pic: picValue,
      status: editingPlayer.status || 'unsold',
      teamId: editingPlayer.teamId || null,
      soldPrice: editingPlayer.soldPrice || null
    };

    if (editingPlayer.id) {
      socket?.emit('editPlayer', data);
      showToast('Player updated successfully!', 'success');
    } else {
      socket?.emit('addPlayer', data);
      showToast('Player added successfully!', 'success');
    }
    
    setEditingPlayer(null); setIsAddingPlayer(false); setUploadedPicUrl(''); setSelectedPosition('');
  };

  const deletePlayer = () => {
    if (deletingPlayer && deleteConfirmText.toLowerCase() === 'confirm') {
      socket?.emit('deletePlayer', deletingPlayer.id);
      setDeletingPlayer(null); setDeleteConfirmText('');
      showToast('Player deleted.', 'success');
    } else {
      showToast('Please type "confirm" to delete.', 'error');
    }
  };

  const saveManager = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    socket?.emit('editManager', {
      ...editingManager,
      teamName: formData.get('teamName'),
      budget: parseInt(formData.get('budget'))
    });
    showToast('Manager updated successfully!', 'success');
    setEditingManager(null);
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto space-y-4">
      
      {/* App-like Header / Live Auction Control */}
      <div className={`${liveAuction.status === 'active' ? 'fixed bottom-4 left-4 right-4 lg:static z-[100] shadow-2xl' : 'static'}`}>
        {liveAuction.status === 'active' ? (
          <div className="bg-red-50 dark:bg-red-950/80 backdrop-blur-xl border border-red-200 dark:border-red-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <div>
                <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Live: Current Bid</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{liveAuction.currentBid?.toLocaleString()} pts</p>
              </div>
            </div>
            <button onClick={() => setConfirmStopAuction(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 sm:py-2 px-6 rounded-xl font-bold transition-colors uppercase text-[10px] tracking-widest">
              Stop & Sell
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-center py-4">
            <p className="text-sm font-bold text-slate-500">No active auction.</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Select a player from the list to start</p>
          </div>
        )}
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white dark:bg-[#111] rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Total Spent</p>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
               {players.filter(p => p.status === 'sold').reduce((sum, p) => sum + (p.soldPrice || 0), 0).toLocaleString()} <span className="text-[10px]">pts</span>
            </p>
         </div>
         <div className="bg-white dark:bg-[#111] rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Players Sold</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
               {players.filter(p => p.status === 'sold').length} <span className="text-xs text-slate-400">/ {players.length}</span>
            </p>
         </div>
      </div>

      {/* Top Sales (Horizontal Scroll) */}
      <div className="bg-white dark:bg-[#111] rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
         <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Top Sales</p>
         <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {players.filter(p => p.status === 'sold').sort((a, b) => b.soldPrice - a.soldPrice).slice(0, 5).map(p => (
               <div key={p.id} onClick={() => setSelectedBidHistoryPlayer(p)} className="flex-shrink-0 w-32 bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 p-2 rounded-xl flex items-center gap-2 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-xs overflow-hidden">
                     {p.pic ? <img src={p.pic} alt="" className="w-full h-full object-cover"/> : p.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                     <p className="font-bold text-[10px] truncate text-slate-900 dark:text-white">{p.name}</p>
                     <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate">{p.soldPrice} pts</p>
                  </div>
               </div>
            ))}
            {players.filter(p => p.status === 'sold').length === 0 && (
               <p className="text-xs text-slate-400 italic font-bold">No sales yet.</p>
            )}
         </div>
      </div>

      {/* Mobile-Style Tabs */}
      <div className="flex bg-slate-200 dark:bg-[#161618] p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('players')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'players' ? 'bg-white dark:bg-[#111] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
        >
          Players ({players.length})
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'teams' ? 'bg-white dark:bg-[#111] text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
        >
          Teams ({managers.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[500px]">
        
        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div className="p-3 sm:p-4">
            {!isAddingPlayer && !editingPlayer && (
              <button onClick={() => { setIsAddingPlayer(true); setEditingPlayer({}); setUploadedPicUrl(''); setSelectedPosition(''); }} className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] mb-4 active:scale-[0.98] transition-transform">
                + Add New Player
              </button>
            )}

            {/* FILTERS */}
            {!isAddingPlayer && !editingPlayer && (
              <div className="flex gap-2 mb-4 relative z-10">
                 <div className="flex-1">
                    <CustomSelect 
                       name="filterSession" 
                       value={filterSession} 
                       onChange={setFilterSession} 
                       placeholder="All Sessions" 
                       options={allSessions.map(s => ({value: s, label: s}))} 
                    />
                 </div>
                 <div className="flex-1">
                    <CustomSelect 
                       name="filterPosition" 
                       value={filterPosition} 
                       onChange={setFilterPosition} 
                       placeholder="All Positions" 
                       options={[
                         { value: 'All', label: 'All Positions' },
                         { value: 'Goalkeeper', label: 'Goalkeeper' },
                         { value: 'Defender', label: 'Defender' },
                         { value: 'Midfielder', label: 'Midfielder' },
                         { value: 'Attacker', label: 'Attacker' }
                       ]} 
                    />
                 </div>
              </div>
            )}

            {(isAddingPlayer || editingPlayer) && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <form onSubmit={savePlayer} className="w-full max-w-sm p-5 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-2xl relative">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">{isAddingPlayer ? 'Add New Player' : 'Edit Player'}</h3>
                    <button type="button" onClick={() => { setEditingPlayer(null); setIsAddingPlayer(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                  </div>
                  
                  <input name="name" defaultValue={editingPlayer?.name} placeholder="Player Name" required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400" />
                  <input name="studentId" defaultValue={editingPlayer?.studentId} placeholder="Student ID" required className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400" />
                  
                  <div className="bg-slate-50 dark:bg-[#161618] p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <label className={`flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-black tracking-widest uppercase text-[10px] ${isUploading ? 'opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'}`}>
                      {isUploading ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    </label>
                    {(uploadedPicUrl || editingPlayer?.pic) && (
                      <img src={uploadedPicUrl || editingPlayer?.pic} alt="Preview" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-indigo-500" />
                    )}
                  </div>
                  
                  <div className="relative" style={{ zIndex: 1010 }}>
                    <CustomSelect name="position" value={selectedPosition} onChange={setSelectedPosition} placeholder="Select Position" required
                      options={[
                        { value: 'Goalkeeper', label: 'Goalkeeper' },
                        { value: 'Defender', label: 'Defender' },
                        { value: 'Midfielder', label: 'Midfielder' },
                        { value: 'Attacker', label: 'Attacker' }
                      ]}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => { setEditingPlayer(null); setIsAddingPlayer(false); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-colors" disabled={isUploading}>Save Player</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {filteredPlayers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No players found.</p>}
              {filteredPlayers.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center shrink-0 overflow-hidden text-sm">
                       {p.pic ? <img src={p.pic} alt="" className="w-full h-full object-cover"/> : p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.position} • Base: {auctionSettings?.defaultBasePrice || 100}</p>
                      {p.status === 'sold' && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Sold: {p.soldPrice} pts</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
                    {p.status === 'unsold' && liveAuction.status === 'idle' && (
                      <button onClick={() => handleStartAuction(p.id)} className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-lg active:scale-95 transition-transform text-center">START</button>
                    )}
                    <Link to={`/logs?q=${encodeURIComponent(p.name)}`} className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-colors text-center">LOGS</Link>
                    <button onClick={() => { setEditingPlayer(p); setUploadedPicUrl(''); setSelectedPosition(p.position); }} className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-slate-800 rounded-lg text-center">EDIT</button>
                    <button onClick={() => setDeletingPlayer(p)} className="flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="p-3 sm:p-4">
            {editingManager && (
              <form onSubmit={saveManager} className="mb-4 p-4 bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <p className="font-bold text-sm">{editingManager.name}</p>
                <input name="teamName" type="text" defaultValue={editingManager.teamName || ''} placeholder="Team Name" className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none" />
                <input name="budget" type="number" defaultValue={editingManager.budget} required className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingManager(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg font-bold text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {managers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No teams found.</p>}
              {managers.map(m => (
                <div key={m.id} className="p-3 bg-slate-50 dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.teamName || m.name}</p>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{typeof m.budget === 'number' ? m.budget.toLocaleString() : '0'} pts remaining</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingManager(m)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">EDIT</button>
                    <button onClick={() => {
                      if(window.confirm(`Are you sure you want to delete ${m.teamName || m.name}? This will unassign any players they have bought.`)) {
                        socket.emit('deleteManager', m.id);
                      }
                    }} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bid History Modal */}
      {selectedBidHistoryPlayer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#111] p-5 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col">
             <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Bid History</h3>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{selectedBidHistoryPlayer.name}</p>
                </div>
                <button onClick={() => setSelectedBidHistoryPlayer(null)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full">CLOSE</button>
             </div>
             
             <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
                {bids.filter(b => b.playerId === selectedBidHistoryPlayer.id).length === 0 ? (
                   <p className="text-slate-500 font-bold text-xs text-center py-4">No bids.</p>
                ) : (
                   bids.filter(b => b.playerId === selectedBidHistoryPlayer.id).sort((a,b) => b.amount - a.amount).map((bid, i) => {
                      const manager = managers.find(m => m.id === bid.managerId);
                      return (
                         <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-[#161618]">
                            <div>
                               <p className="font-bold text-xs text-slate-900 dark:text-white">{manager?.teamName || manager?.name || 'Unknown'}</p>
                               <p className="text-[9px] text-slate-500">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <p className="font-black text-sm text-indigo-600 dark:text-indigo-400">{bid.amount}</p>
                         </div>
                      );
                   })
                )}
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlayer && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#111] p-5 rounded-t-2xl sm:rounded-2xl w-full max-w-sm border-t sm:border border-red-200 dark:border-red-900/30">
             <h3 className="font-black text-lg mb-1 text-slate-900 dark:text-white">Delete Player</h3>
             <p className="text-xs font-bold text-slate-500 mb-4">Type "confirm" to delete <span className="text-red-500">{deletingPlayer.name}</span></p>
             
             <input 
                type="text" 
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder='confirm'
                className="w-full bg-slate-50 dark:bg-[#161618] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 outline-none text-center mb-4"
             />
             
             <div className="flex gap-2">
                <button onClick={() => { setDeletingPlayer(null); setDeleteConfirmText(''); }} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={deletePlayer} 
                  disabled={deleteConfirmText.toLowerCase() !== 'confirm'}
                  className="flex-1 py-3 font-bold rounded-xl text-white bg-red-500 disabled:opacity-50"
                >Delete</button>
             </div>
          </div>
        </div>
      )}

      {/* Stop Auction Confirmation Modal */}
      {confirmStopAuction && (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-[#111] p-5 rounded-t-2xl sm:rounded-2xl w-full max-w-sm border-t sm:border border-red-200 dark:border-red-900/30 shadow-2xl">
             <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-3 text-2xl font-black">
               !
             </div>
             <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">Stop Auction?</h3>
             <p className="text-sm font-bold text-slate-500 mb-6">
                Are you sure you want to end the current auction? The player will be sold to the highest bidder.
             </p>
             
             <div className="flex gap-3">
                <button onClick={() => setConfirmStopAuction(false)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold">Cancel</button>
                <button 
                  onClick={() => {
                    handleStopAuction();
                    setConfirmStopAuction(false);
                  }} 
                  className="flex-1 py-3.5 font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/30"
                >Confirm & Sell</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
