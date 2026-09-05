import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function GlobalNotice() {
  const { auctionSettings } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('dismissedNotice') === auctionSettings?.globalNotice;
  });
  const [currentNotice, setCurrentNotice] = useState(auctionSettings?.globalNotice);

  useEffect(() => {
    if (auctionSettings?.globalNotice !== currentNotice) {
      setCurrentNotice(auctionSettings?.globalNotice);
      if (localStorage.getItem('dismissedNotice') === auctionSettings?.globalNotice) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false); // Pop back up if admin sets a new notice!
      }
    }
  }, [auctionSettings?.globalNotice, currentNotice]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (auctionSettings?.globalNotice) {
      localStorage.setItem('dismissedNotice', auctionSettings.globalNotice);
    }
  };

  if (!auctionSettings?.globalNotice || isDismissed) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[9999] w-[calc(100vw-32px)] md:w-96 animate-slide-up pointer-events-auto">
      <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[1.5rem] p-5 relative overflow-hidden group hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)] transition-all">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/20 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
             <span className="text-[10px] font-black tracking-widest uppercase text-cyan-600 dark:text-cyan-400">Official Notice</span>
          </div>
          <button 
            onClick={handleDismiss} 
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 relative z-10 leading-relaxed pr-2">
          {auctionSettings.globalNotice}
        </p>
      </div>
    </div>
  );
}
