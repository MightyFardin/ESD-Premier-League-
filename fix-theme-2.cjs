const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/data/data/com.termux/files/home/football-auction/src/**/*.jsx').concat(['/data/data/com.termux/files/home/football-auction/src/index.css']);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Additional Gradients
  content = content.replace(/bg-gradient-to-br from-indigo-900\/5 to-fuchsia-900\/5 dark:from-indigo-400\/5 dark:to-fuchsia-400\/5/g, 'bg-slate-100 dark:bg-[#161616]');
  content = content.replace(/bg-gradient-to-br from-indigo-900 to-indigo-950/g, 'bg-slate-900 dark:bg-white text-white dark:text-slate-900');
  content = content.replace(/bg-gradient-to-br from-white to-orange-50\/30 dark:from-\[\#111\] dark:to-\[\#1a1310\]/g, 'bg-white dark:bg-[#111]');
  content = content.replace(/bg-gradient-to-br from-red-50\/50 to-white dark:from-\[\#1a0f0f\] dark:to-\[\#111\]/g, 'bg-white dark:bg-[#111]');
  content = content.replace(/bg-gradient-to-br from-indigo-100 via-purple-50 to-emerald-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950;/g, 'bg-slate-50 dark:bg-[#030303];');
  content = content.replace(/bg-gradient-to-r from-rose-500 to-rose-400/g, 'bg-slate-900 dark:bg-slate-300');
  
  // Leftover glassmorphism
  content = content.replace(/backdrop-blur-(?:md|xl|lg)/g, '');
  content = content.replace(/bg-white\/[0-9]{2} dark:bg-\[[^\]]+\]\/[0-9]{2} border border-slate-200\/50 dark:border-slate-800\/50/g, 'bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800');
  content = content.replace(/shadow-\[0_[-]?10px_40px_rgba\([^)]+\)\]/g, 'shadow-sm border-t border-slate-200 dark:border-slate-800');
  
  // Specific fix in ManagerDashboard for text color if we changed background to white in dark mode
  content = content.replace(/className="text-indigo-200 uppercase/g, 'className="text-slate-500 uppercase');
  content = content.replace(/className="text-white text-2xl/g, 'className="text-slate-900 dark:text-slate-900 text-2xl');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
