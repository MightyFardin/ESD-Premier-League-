const fs = require('fs');
const glob = require('glob');

const files = glob.sync('/data/data/com.termux/files/home/football-auction/src/pages/*.jsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace primary indigo text with stark slate/white
  content = content.replace(/text-indigo-600 dark:text-indigo-400/g, 'text-slate-900 dark:text-white');
  
  // Replace primary indigo backgrounds (like buttons) with stark slate/white
  content = content.replace(/bg-indigo-600 hover:bg-indigo-700 text-white/g, 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200');
  
  // Tab/Selected states
  content = content.replace(/bg-indigo-100 dark:bg-indigo-900\/30/g, 'bg-slate-200 dark:bg-slate-800');
  
  // Specific Admin stats border
  content = content.replace(/border-indigo-500\/20/g, 'border-slate-300 dark:border-slate-700');
  content = content.replace(/bg-indigo-900\/10 dark:bg-indigo-900\/20/g, 'bg-slate-100 dark:bg-[#1a1a1c]');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated theme in', file);
  }
});
