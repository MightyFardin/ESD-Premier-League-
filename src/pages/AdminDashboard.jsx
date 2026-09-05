import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import CustomSelect from '../components/CustomSelect';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

const getSessionStr = (studentId) => {
  if (!studentId || studentId.length < 2) return 'Unknown';
  const prefixStr = studentId.substring(0, 2);
  const prefix = parseInt(prefixStr);
  if (isNaN(prefix)) return 'Unknown';
  return `20${prefixStr}-20${prefix + 1}`;
};

export default function AdminDashboard() {
  const { players = [], managers = [], socket, auctionSettings, liveAuction, bids = [] } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('players'); // 'players', 'teams'
  
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingManager, setEditingManager] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedBidHistoryPlayer, setSelectedBidHistoryPlayer] = useState(null);
  const [deletingPlayer, setDeletingPlayer] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmStopAuction, setConfirmStopAuction] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPicUrl, setUploadedPicUrl] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  
  const [filterSession, setFilterSession] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const allSessions = ['All', ...Array.from(new Set(players.map(p => getSessionStr(p.studentId)))).sort()];
  
  const filteredPlayers = players.filter(p => {
    const matchSession = filterSession === 'All' || getSessionStr(p.studentId) === filterSession;
    const matchPos = filterPosition === 'All' || p.position === filterPosition;
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSession && matchPos && matchStatus;
  });

  const handleStartAuction = (playerId) => {
    socket?.emit('startAuction', playerId);
    navigate('/auction');
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

  const savePlayer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const studentId = formData.get('studentId').trim();
    
    // Duplicate check removed per user request
    
    let finalPicUrl = editingPlayer?.pic || '';
    if (uploadedPicUrl) {
      finalPicUrl = uploadedPicUrl;
    } else {
      const formPicUrl = formData.get('picUrl');
      if (formPicUrl && formPicUrl.trim() !== '') {
        finalPicUrl = formPicUrl.trim();
      }
    }
    
    // Convert Google Drive links
    if (finalPicUrl && finalPicUrl.includes('drive.google.com')) {
       try {
          const urlObj = new URL(finalPicUrl);
          let fileId = urlObj.searchParams.get('id');
          if (!fileId) {
            const match = finalPicUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) fileId = match[1];
          }
          if (fileId) {
            finalPicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
          }
       } catch (e) {
          console.error('Invalid URL:', finalPicUrl);
       }
    }
    
    const player = {
      id: editingPlayer?.id || Date.now().toString(),
      name: formData.get('name'),
      studentId: studentId,
      position: selectedPosition,
      pic: finalPicUrl,
      status: editingPlayer?.status || 'unsold',
      teamId: editingPlayer?.teamId || null,
      soldPrice: editingPlayer?.soldPrice || null
    };

    if (editingPlayer?.id) {
      socket?.emit('editPlayer', player);
      showToast('Player updated!');
    } else {
      socket?.emit('addPlayer', player);
      showToast('Player added!');
    }
    setEditingPlayer(null);
    setIsAddingPlayer(false);
  };

  const handleImportPlayers = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const processImported = (imported) => {
        const filteredImported = [];
        let unknownSkipped = 0;
        
        for (const p of imported) {
           if (p.name && p.name.trim().toLowerCase() === 'unknown') {
             unknownSkipped++;
           } else {
             filteredImported.push(p);
           }
        }
        
        if (filteredImported.length > 0) {
           socket?.emit('importPlayers', filteredImported);
           if (unknownSkipped > 0) {
             showToast(`Imported ${filteredImported.length} players. Skipped ${unknownSkipped} 'Unknown' players.`, 'success');
           } else {
             showToast(`Imported ${filteredImported.length} players!`, 'success');
           }
        } else {
           if (unknownSkipped > 0) {
             showToast(`All players in file were 'Unknown' and skipped.`, 'error');
           } else {
             showToast('No valid players found in file.', 'error');
           }
        }
    };

    if (file.name.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          showToast('Reading PDF (Experimental)...', 'info');
          const pdfjsLib = await import('pdfjs-dist/build/pdf.min.js');
          
          pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
          
          const typedarray = new Uint8Array(evt.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
             const page = await pdf.getPage(i);
             const content = await page.getTextContent();
             fullText += content.items.map(item => item.str).join(' ') + ' ';
          }
          
          // Naive heuristic: look for alphanumeric strings with at least 4 digits
          const words = fullText.split(/\s+/).filter(w => w.trim());
          const imported = [];
          for (let i = 0; i < words.length; i++) {
             // Match something that looks like an ID (contains digits, length >= 4)
             if (/\d{4,}/.test(words[i]) && words[i].length <= 15) { 
                // Grab up to 3 previous words as name
                const nameParts = [];
                for(let j = 1; j <= 4; j++) {
                   if (i - j >= 0 && !/\d{4,}/.test(words[i-j])) {
                      nameParts.unshift(words[i-j]);
                   } else {
                      break;
                   }
                }
                const name = nameParts.length > 0 ? nameParts.join(' ').substring(0, 30) : 'Unknown';
                imported.push({
                   id: Date.now().toString() + Math.random().toString(),
                   name: name,
                   studentId: words[i],
                   position: 'Unknown',
                   pic: '',
                   status: 'unsold',
                   teamId: null,
                   soldPrice: null
                });
             }
          }
          
          if(imported.length > 0) {
             processImported(imported);
          } else {
             showToast('Could not extract valid players from PDF.', 'error');
          }
          
        } catch (err) {
          console.error(err);
          showToast(`Error parsing PDF: ${err.message || 'Unknown error'}`, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let imported = [];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(evt.target.result);
          imported = Array.isArray(parsed) ? parsed : [parsed];
          imported = imported.map(p => ({
            id: p.id || Date.now().toString() + Math.random().toString(),
            name: p.name || 'Unknown',
            studentId: p.studentId || p.studentid || 'Unknown',
            position: p.position || 'Unknown',
            pic: p.pic || '',
            status: 'unsold',
            teamId: null,
            soldPrice: null
          }));
        } else if (file.name.endsWith('.csv')) {
           const lines = evt.target.result.split('\n');
           // Simple CSV parser to handle quotes
           const parseCSVLine = (line) => {
             const row = [];
             let inQuotes = false;
             let currentValue = '';
             for (let i = 0; i < line.length; i++) {
               const char = line[i];
               if (char === '"' && line[i+1] === '"') {
                 currentValue += '"';
                 i++; // skip escaped quote
               } else if (char === '"') {
                 inQuotes = !inQuotes;
               } else if (char === ',' && !inQuotes) {
                 row.push(currentValue);
                 currentValue = '';
               } else {
                 currentValue += char;
               }
             }
             row.push(currentValue);
             return row;
           };
           
           if (lines.length > 0) {
             const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
             for (let i = 1; i < lines.length; i++) {
               if (!lines[i].trim()) continue;
               const values = parseCSVLine(lines[i]);
               let p = {};
               headers.forEach((h, idx) => p[h] = values[idx]?.trim());
               
               const rawName = p['full name'] || p.name || '';
               const name = rawName.replace(/^"|"$/g, '').trim();
               if (!name) continue; // Skip if no name
               
               let picUrl = p['player photo'] || p.pic || '';
               
               // Convert Google Drive links to direct image links
               if (picUrl && picUrl.includes('drive.google.com')) {
                 try {
                    const urlObj = new URL(picUrl);
                    let fileId = urlObj.searchParams.get('id');
                    if (!fileId) {
                      // Check if it's in the path like /file/d/ID/view
                      const match = picUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                      if (match) fileId = match[1];
                    }
                    if (fileId) {
                      picUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                    }
                 } catch (e) {
                    console.error('Invalid URL:', picUrl);
                 }
               }
               
               imported.push({
                 id: Date.now().toString() + Math.random().toString(),
                 name: name,
                 studentId: p.id || p.studentid || p['student id'] || 'Unknown',
                 position: p['player position'] || p.position || 'Unknown',
                 pic: picUrl,
                 status: 'unsold',
                 teamId: null,
                 soldPrice: null
               });
             }
           }
        }
        
        if (imported.length > 0) {
           processImported(imported);
        } else {
           showToast('No valid players found in file.', 'error');
        }
      } catch (err) {
        showToast('Error parsing file.', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const getExportData = () => {
    return filteredPlayers.map(p => ({
      'Name': p.name || '',
      'Student ID': p.studentId || '',
      'Session': getSessionStr(p.studentId),
      'Position': p.position || '',
      'Status': p.status || '',
      'Team': p.teamId ? managers.find(m => m.id === p.teamId)?.teamName || 'Unknown Team' : 'None',
      'Sold Price': p.soldPrice || ''
    }));
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if(data.length === 0) return showToast('No players to export.', 'error');
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => obj[h]).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\\n' + rows.join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `players_export_${filterSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported!');
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if(data.length === 0) return showToast('No players to export.', 'error');
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players");
    XLSX.writeFile(workbook, `players_export_${filterSession}.xlsx`);
    showToast('Excel exported!');
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if(data.length === 0) return showToast('No players to export.', 'error');
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(h => obj[h]));
    doc.text(`Player List - Session: ${filterSession}`, 14, 15);
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`players_export_${filterSession}.pdf`);
    showToast('PDF exported!');
    setIsExportMenuOpen(false);
  };

  const deletePlayer = () => {
    if (deletingPlayer) {
      socket?.emit('deletePlayer', deletingPlayer.id);
      setDeletingPlayer(null);
      showToast('Player deleted.', 'success');
    }
  };

  const deleteAllPlayers = () => {
    if (deleteConfirmText.toLowerCase() === 'delete all') {
      socket?.emit('deleteAllPlayers');
      setConfirmDeleteAll(false); setDeleteConfirmText('');
      showToast('All players deleted.', 'success');
    } else {
      showToast('Please type "delete all" to confirm.', 'error');
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
                     {p.pic ? <img src={p.pic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + p.name + '&background=random'; }} /> : p.name.charAt(0)}
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-slate-50 dark:bg-[#161618] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => { setIsAddingPlayer(true); setEditingPlayer({}); setUploadedPicUrl(''); setSelectedPosition(''); }} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors shadow-sm">
                    + Add
                  </button>
                  <label className="flex-1 sm:flex-none px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer text-center">
                    Import
                    <input type="file" accept=".csv,.json,.pdf" onChange={handleImportPlayers} className="hidden" />
                  </label>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none relative">
                    <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors">
                      Export ▼
                    </button>
                    {isExportMenuOpen && (
                      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                        <button onClick={handleExportCSV} className="w-full text-left px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">CSV</button>
                        <button onClick={handleExportExcel} className="w-full text-left px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800">Excel</button>
                        <button onClick={handleExportPDF} className="w-full text-left px-4 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800">PDF</button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setConfirmDeleteAll(true); setDeleteConfirmText(''); }} className="flex-1 sm:flex-none px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors">
                    Delete All
                  </button>
                </div>
              </div>
            )}

            {/* FILTERS */}
            {!isAddingPlayer && !editingPlayer && (
              <div className="grid grid-cols-3 gap-2 mb-4 relative z-10 bg-slate-50 dark:bg-[#161618] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                 <div className="col-span-1">
                    <CustomSelect 
                       name="filterSession" 
                       value={filterSession} 
                       onChange={setFilterSession} 
                       placeholder="Session" 
                       options={allSessions.map(s => ({value: s, label: s === 'All' ? 'Session' : s}))} 
                    />
                 </div>
                 <div className="col-span-1">
                    <CustomSelect 
                       name="filterPosition" 
                       value={filterPosition} 
                       onChange={setFilterPosition} 
                       placeholder="Position" 
                       options={[
                         { value: 'All', label: 'Position' },
                         { value: 'Goalkeeper', label: 'Goalkeeper' },
                         { value: 'Defender', label: 'Defender' },
                         { value: 'Midfielder', label: 'Midfielder' },
                         { value: 'Attacker', label: 'Attacker' }
                       ]} 
                    />
                 </div>
                 <div className="col-span-1">
                    <CustomSelect 
                       name="filterStatus" 
                       value={filterStatus} 
                       onChange={setFilterStatus} 
                       placeholder="Status" 
                       options={[
                         { value: 'All', label: 'Status' },
                         { value: 'sold', label: 'Sold' },
                         { value: 'unsold', label: 'Unsold' }
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
                      <img src={uploadedPicUrl || editingPlayer?.pic} alt="Preview" className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-indigo-500" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=Player&background=random'; }} />
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

            <div className="space-y-1.5">
              {filteredPlayers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No players found.</p>}
              {filteredPlayers.map(p => (
                <div key={p.id} className="p-2 px-3 bg-slate-50 dark:bg-[#161618] rounded-xl border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center shrink-0 overflow-hidden text-sm">
                       {p.pic ? <img src={p.pic} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + p.name + '&background=random'; }} /> : p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.position} • Base: {auctionSettings?.defaultBasePrice || 100}</p>
                      {p.status === 'sold' && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">Sold: {p.soldPrice} pts</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0 ml-10 sm:ml-0">
                    {p.status === 'unsold' && liveAuction.status === 'idle' && (
                      <button onClick={() => handleStartAuction(p.id)} className="flex-1 sm:flex-none px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> START
                      </button>
                    )}
                    <Link to={`/logs?q=${encodeURIComponent(p.name)}`} className="flex-1 sm:flex-none px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-colors text-center">LOGS</Link>
                    <button onClick={() => { setEditingPlayer(p); setUploadedPicUrl(''); setSelectedPosition(p.position); }} className="flex-1 sm:flex-none px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 dark:bg-slate-800 rounded-lg text-center">EDIT</button>
                    <button onClick={() => setDeletingPlayer(p)} className="flex-1 sm:flex-none px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">DEL</button>
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
             <p className="text-xs font-bold text-slate-500 mb-6">Are you sure you want to delete <span className="text-red-500">{deletingPlayer.name}</span>?</p>
             
             <div className="flex gap-2">
                <button onClick={() => setDeletingPlayer(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={deletePlayer} 
                  className="flex-1 py-3 font-bold rounded-xl text-white bg-red-500"
                >Delete</button>
             </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] p-5 rounded-t-2xl sm:rounded-2xl w-full max-w-sm border-t sm:border border-red-200 dark:border-red-900/30 shadow-2xl">
             <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-3 text-2xl font-black">
               !
             </div>
             <h3 className="font-black text-xl mb-2 text-slate-900 dark:text-white">Delete All Players?</h3>
             <p className="text-sm font-bold text-slate-500 mb-4">
                This action is irreversible. It will delete all players and their bids from the database. Type <span className="text-red-500">delete all</span> to confirm.
             </p>
             
             <input 
                type="text" 
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder='delete all'
                className="w-full bg-slate-50 dark:bg-[#161618] border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-2.5 text-sm focus:border-red-500 outline-none text-center mb-4 text-red-500 font-bold"
             />
             
             <div className="flex gap-3">
                <button onClick={() => { setConfirmDeleteAll(false); setDeleteConfirmText(''); }} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold">Cancel</button>
                <button 
                  onClick={deleteAllPlayers} 
                  disabled={deleteConfirmText.toLowerCase() !== 'delete all'}
                  className="flex-1 py-3 font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:grayscale"
                >Confirm Delete</button>
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
