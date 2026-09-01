import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { Play, Pause, Edit, Trash2, Save, X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export default function AdminDashboard() {
  const { players, managers, liveAuction, auctionSettings, socket } = useAuth();
  const { showToast } = useToast();
  
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingManager, setEditingManager] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPicUrl, setUploadedPicUrl] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

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
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }
      
      setUploadedPicUrl(data.secure_url);
      showToast("Image uploaded to Cloudinary successfully!");
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
    
    if (!selectedPosition) {
      showToast("Please select a position", 'error');
      return;
    }

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
      showToast('Player updated successfully!');
    } else {
      socket?.emit('addPlayer', data);
      showToast('Player added successfully!');
    }
    
    setEditingPlayer(null);
    setIsAddingPlayer(false);
    setUploadedPicUrl('');
    setSelectedPosition('');
  };

  const deletePlayer = (id) => {
    if (confirm("Are you sure?")) socket?.emit('deletePlayer', id);
  };

  const saveManager = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    socket?.emit('editManager', {
      ...editingManager,
      teamName: formData.get('teamName'),
      budget: parseInt(formData.get('budget'))
    });
    showToast('Manager updated successfully!');
    setEditingManager(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Admin Control Room</h1>
        <p className="text-slate-500">Manage players, teams, and the live auction status.</p>
      </div>

      <div className="card-minimal p-6">
        <h2 className="text-lg font-bold mb-4">Live Auction Control</h2>
        {liveAuction.status === 'active' ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">Auction is LIVE!</p>
              <p className="text-sm text-red-600 dark:text-red-500/80">Current Bid: {liveAuction.currentBid?.toLocaleString()} Points</p>
              <p className="text-xs text-red-500 mt-1">Next increment: +{liveAuction.currentIncrement} pts</p>
            </div>
            <button onClick={handleStopAuction} className="btn-primary bg-red-600 hover:bg-red-700">
              <Pause size={18} /> Stop Auction / Sell
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-xl text-center text-slate-500">
            No active auction. Select a player below to start.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-minimal p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Registered Players</h2>
            <button onClick={() => { 
              setIsAddingPlayer(true); 
              setEditingPlayer({}); 
              setUploadedPicUrl(''); 
              setSelectedPosition('');
            }} className="btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Add Player
            </button>
          </div>

          {(isAddingPlayer || editingPlayer) && !editingManager && (
            <form onSubmit={savePlayer} className="mb-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" defaultValue={editingPlayer?.name} placeholder="Player Name" required className="input-field" />
                <input name="studentId" defaultValue={editingPlayer?.studentId} placeholder="Player ID (e.g. 22esd006)" required className="input-field" />
              </div>
              
              <div className="flex flex-col gap-2 bg-white dark:bg-[#111] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-500 uppercase">Player Photo</label>
                <div className="flex items-center gap-3">
                  {(uploadedPicUrl || editingPlayer?.pic) && (
                    <img src={uploadedPicUrl || editingPlayer?.pic} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200" />
                  )}
                  <label className={`flex-1 btn-secondary py-2 flex items-center justify-center gap-2 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    <span className="font-bold text-sm">{isUploading ? 'Uploading...' : 'Upload from Device'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 my-1">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">OR</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </div>
                <input name="picUrl" defaultValue={editingPlayer?.pic} placeholder="Paste Image URL instead" className="input-field text-xs bg-transparent border-none shadow-none px-0 h-8" />
              </div>

              <div className="z-20 relative">
                <CustomSelect 
                  name="position"
                  value={selectedPosition}
                  onChange={setSelectedPosition}
                  placeholder="Select Position"
                  options={[
                    { value: 'Goalkeeper', label: 'Goalkeeper' },
                    { value: 'Defender', label: 'Defender' },
                    { value: 'Midfielder', label: 'Midfielder' },
                    { value: 'Attacker', label: 'Attacker' }
                  ]}
                  required
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 py-2 text-sm" disabled={isUploading}><Save size={16} /> Save Player</button>
                <button type="button" onClick={() => { setEditingPlayer(null); setIsAddingPlayer(false); setUploadedPicUrl(''); }} className="btn-secondary flex-1 py-2 text-sm"><X size={16} /> Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {players.length === 0 && <p className="text-sm text-slate-500">No players registered yet.</p>}
            {players.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.pic ? (
                     <img src={p.pic} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">{p.name.charAt(0)}</div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{p.name} <span className="text-slate-400 font-normal ml-1">({p.studentId || 'N/A'})</span></p>
                    <p className="text-xs text-slate-500">{p.position} • Base: {auctionSettings?.defaultBasePrice || 100} pts</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${p.status === 'sold' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : p.status === 'unsold' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                        {p.status}
                      </span>
                      {p.status === 'sold' && (
                        <span className="text-[10px] font-bold text-slate-500">
                          to <span className="text-indigo-600 dark:text-indigo-400">{managers.find(m => m.id === p.teamId)?.name || 'Unknown Team'}</span> for {p.soldPrice} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {p.status === 'unsold' && liveAuction.status === 'idle' && (
                    <button onClick={() => handleStartAuction(p.id)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"><Play size={16} /></button>
                  )}
                  <button onClick={() => { 
                    setEditingPlayer(p); 
                    setUploadedPicUrl(''); 
                    setSelectedPosition(p.position);
                  }} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"><Edit size={16} /></button>
                  <button onClick={() => deletePlayer(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-minimal p-6">
          <h2 className="text-lg font-bold mb-4">Teams (Managers)</h2>

          {editingManager && (
            <form onSubmit={saveManager} className="mb-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl space-y-3">
              <p className="font-bold text-sm mb-2">{editingManager.name} ({editingManager.username})</p>
              <input name="teamName" type="text" defaultValue={editingManager.teamName || ''} placeholder="Team Name (e.g. Real Madrid)" className="input-field" />
              <input name="budget" type="number" defaultValue={editingManager.budget} placeholder="Budget (Points)" required className="input-field" />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 py-2 text-xs"><Save size={14} /> Save</button>
                <button type="button" onClick={() => setEditingManager(null)} className="btn-secondary flex-1 py-2 text-xs"><X size={14} /> Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {managers.map(m => (
              <div key={m.id} className="p-3 bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{m.teamName || m.name} <span className="text-slate-400 font-normal ml-1">({m.username})</span></p>
                  <p className="text-xs text-slate-500">Budget: {m.budget?.toLocaleString()} pts</p>
                </div>
                <button onClick={() => setEditingManager(m)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md"><Edit size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
