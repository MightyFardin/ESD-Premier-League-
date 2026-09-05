import React, { useState, useEffect } from 'react';

export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
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

  if (!targetDate || !timeLeft) return null;

  return (
    <div className="flex justify-center gap-2 sm:gap-4 my-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 flex items-center justify-center shadow-lg hover:bg-white/60 dark:hover:bg-black/60 transition-colors">
            <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-widest">{unit}</span>
        </div>
      ))}
    </div>
  );
}
