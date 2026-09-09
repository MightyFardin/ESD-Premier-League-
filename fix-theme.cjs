const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('/data/data/com.termux/files/home/football-auction/src/**/*.jsx');

let replaceCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Background Gradients on containers
  content = content.replace(/bg-gradient-to-br from-indigo-[456]00(?: via-purple-[456]00)? to-fuchsia-[456]00/g, 'bg-slate-900 dark:bg-slate-50');
  content = content.replace(/bg-gradient-to-r from-indigo-[456]00(?: via-purple-[456]00)? to-fuchsia-[456]00/g, 'bg-slate-900 dark:bg-slate-50');
  content = content.replace(/bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500/g, 'bg-slate-900 dark:bg-white');
  content = content.replace(/bg-gradient-to-br from-indigo-500 to-purple-600/g, 'bg-slate-900 dark:bg-white');
  content = content.replace(/bg-gradient-to-br from-amber-400 to-orange-500/g, 'bg-amber-500');
  content = content.replace(/bg-gradient-to-br from-emerald-400 to-teal-500/g, 'bg-emerald-500');
  content = content.replace(/bg-gradient-to-br from-blue-500 to-indigo-600/g, 'bg-indigo-600');
  content = content.replace(/bg-gradient-to-b from-indigo-50 to-white/g, 'bg-slate-50 dark:bg-[#030303]');
  content = content.replace(/bg-gradient-to-b from-\[\#030303\] to-\[\#111\]/g, 'bg-[#030303]');

  // Text Gradients
  content = content.replace(/text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-transparent bg-clip-text bg-gradient-to-r from-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-transparent bg-clip-text bg-gradient-to-r from-[a-z]+-[0-9]+ via-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+/g, 'text-slate-900 dark:text-white');

  // Glassmorphism panels
  content = content.replace(/bg-white\/[46]0 backdrop-blur-(?:md|xl|lg)/g, 'bg-white dark:bg-[#111]');
  content = content.replace(/bg-white\/80 backdrop-blur-(?:md|xl|lg)/g, 'bg-white dark:bg-[#111]');
  content = content.replace(/bg-white\/90 backdrop-blur-(?:md|xl|lg)/g, 'bg-white dark:bg-[#111]');
  content = content.replace(/bg-slate-900\/40 backdrop-blur-sm/g, 'bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm');

  // Button styling fixes to make them minimal
  content = content.replace(/shadow-lg shadow-indigo-[0-9]+\/[0-9]+/g, 'shadow-sm');
  content = content.replace(/shadow-lg shadow-[a-z]+-500\/[0-9]+/g, 'shadow-sm');
  
  // Clean borders instead of glow
  content = content.replace(/ring-4 ring-[a-z]+-500\/30/g, 'ring-2 ring-slate-900 dark:ring-white');
  
  // Specific heavy background meshes
  content = content.replace(/<div className="absolute top-\[-20%\][^>]+bg-indigo-400\/20[^>]+><\/div>/g, '');
  content = content.replace(/<div className="absolute bottom-\[-20%\][^>]+bg-fuchsia-400\/20[^>]+><\/div>/g, '');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    replaceCount++;
    console.log('Updated theme in', path.basename(file));
  }
});

console.log('Total files updated:', replaceCount);
