import React, { useState, useEffect } from 'react';

export default function Countdown({ targetDate, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      let difference = 0;
      try {
        const parsedDate = typeof targetDate === 'string' ? new Date(targetDate.replace(/-/g, '/').replace('T', ' ')) : new Date(targetDate);
        difference = +parsedDate - +new Date();
      } catch (e) {
        console.error("Countdown Date parsing error:", e);
      }
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;
  if (!timeLeft) return <div className="text-red-500 font-bold text-center mt-4 border border-red-500 p-2 rounded">Timer Expired or Date Invalid: {targetDate}</div>;

  return (
    <div className={`flex justify-center ${compact ? 'gap-2 my-1' : 'gap-2 sm:gap-4 my-8'} animate-slide-up`} style={{ animationDelay: '300ms' }}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className={`${compact ? 'w-10 h-10 sm:w-12 sm:h-12 rounded-xl' : 'w-14 h-14 sm:w-20 sm:h-20 rounded-2xl'} bg-white/40 dark:bg-black/40 border border-slate-200/50 dark:border-white/10 flex items-center justify-center shadow-lg hover:bg-white/60 dark:hover:bg-black/60 transition-colors`}>
            <span className={`${compact ? 'text-sm sm:text-lg' : 'text-xl sm:text-3xl'} font-black text-slate-900 dark:text-white tracking-tighter`}>
              {value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className={`font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ${compact ? 'mt-1 text-[7px] sm:text-[8px]' : 'mt-2 text-[9px] sm:text-[10px]'}`}>{unit}</span>
        </div>
      ))}
    </div>
  );
}
