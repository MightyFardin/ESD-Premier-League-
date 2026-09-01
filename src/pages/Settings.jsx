import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Moon, Sun, Monitor, Paintbrush, AlertTriangle, Lock, Bell, HardDrive, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Settings() {
 const { user, settings, setSettings, login } = useAuth();
 const [showEraseModal, setShowEraseModal] = useState(false);
 const [deletePassword, setDeletePassword] = useState('');
 const [isDeleting, setIsDeleting] = useState(false);
 const [deleteError, setDeleteError] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 const [showEditProfile, setShowEditProfile] = useState(false);
 const [newName, setNewName] = useState(user?.name || '');
 const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

 // Settings wrapper to ensure defaults
 const currentSettings = {
 theme: 'light',
 appStyle: 'minimalist',
 emailNotif: true,
 pushNotif: false,
 twoFactor: false,
 pinCode: '',
 glassmorphism: false,
 customDashboard: false,
 ...settings
 };

 const updateSetting = (key, value) => {
 setSettings({ ...currentSettings, [key]: value });
 };

 // PIN 2FA States
 const [showPinModal, setShowPinModal] = useState(false);
 const [pinInput, setPinInput] = useState('');
 const [pinAction, setPinAction] = useState(''); // 'enable' or 'disable'
 const [pinError, setPinError] = useState('');

 const handlePushNotifToggle = async () => {
 if (!currentSettings.pushNotif) {
 if (!("Notification" in window)) {
 alert("This browser does not support push notifications.");
 return;
 }
 const permission = await Notification.requestPermission();
 if (permission === "granted") {
 updateSetting('pushNotif', true);
 new Notification("Study Hub", { body: "Push notifications enabled successfully!" });
 } else {
 alert("Permission denied for push notifications.");
 }
 } else {
 updateSetting('pushNotif', false);
 }
 };

 const handle2FAToggle = () => {
 setPinInput('');
 setPinError('');
 if (!currentSettings.twoFactor) {
 setPinAction('enable');
 setShowPinModal(true);
 } else {
 setPinAction('disable');
 setShowPinModal(true);
 }
 };

 const submitPin = () => {
 if (pinAction === 'enable') {
 if (pinInput.length !== 4) {
 setPinError('PIN must be exactly 4 digits');
 return;
 }
 setSettings({ ...currentSettings, twoFactor: true, pinCode: pinInput });
 setShowPinModal(false);
 } else {
 if (pinInput !== currentSettings.pinCode) {
 setPinError('Incorrect PIN');
 return;
 }
 setSettings({ ...currentSettings, twoFactor: false, pinCode: '' });
 setShowPinModal(false);
 }
 };

 const handleThemeChange = (theme) => {
 updateSetting('theme', theme);
 };

 const handleEraseData = async (e) => {
 e.preventDefault();
 if (!deletePassword || !user?.email) return;
 
 setIsDeleting(true);
 setDeleteError('');
 
 try {
 await signInWithEmailAndPassword(auth, user.email, deletePassword);
 
 // Wipe data from Firebase
 const docRef = doc(db, 'users', user.id || 'my_personal_data');
 await setDoc(docRef, {});

 localStorage.clear();
 window.location.href = '/';
 } catch (err) {
 setDeleteError('Incorrect password. Please try again.');
 } finally {
 setIsDeleting(false);
 }
 };

 const handleUpdateProfile = async (e) => {
 e.preventDefault();
 if (!newName.trim()) return;
 setIsUpdatingProfile(true);
 try {
 if (auth.currentUser) {
 await updateProfile(auth.currentUser, { displayName: newName });
 }
 // Update local user state via setSettings or login context if available. Wait, useAuth has 'login'.
 login({ ...user, name: newName });
 setShowEditProfile(false);
 } catch (err) {
 console.error(err);
 } finally {
 setIsUpdatingProfile(false);
 }
 };

 return (
 <>
 <div className="max-w-3xl mx-auto animate-in fade-in">
 <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">App Settings</h1>

 <div className="space-y-6 pb-6">
 
 {/* Account Section */}
 <section className="card-minimal p-6 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
 <User className="text-blue-500" size={20} />
 <h2 className="text-lg font-bold">Account Overview</h2>
 </div>
 <div className="space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#151515] rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
 <div>
 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Full Name</p>
 <p className="text-sm font-medium flex items-center gap-2"><User size={16} className="text-slate-400"/> {user?.name || 'Student'}</p>
 </div>
 <button onClick={() => setShowEditProfile(true)} className="btn-secondary text-sm py-2 px-4 whitespace-nowrap">Edit Name</button>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#151515] rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
 <div>
 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Email Address</p>
 <p className="text-sm font-medium flex items-center gap-2"><Mail size={16} className="text-slate-400"/> {user?.email || 'user@example.com'}</p>
 </div>
 <button className="btn-secondary text-sm py-2 px-4 whitespace-nowrap opacity-50 cursor-not-allowed">Change Email</button>
 </div>
 </div>
 </section>

 {/* Appearance Section */}
 <section className="card-minimal p-6 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
 <Paintbrush className="text-indigo-500" size={20} />
 <h2 className="text-lg font-bold">Appearance</h2>
 </div>

 <div className="space-y-4">
 <div className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Color Theme</label>
 <div className="grid grid-cols-3 gap-3">
 <button 
 onClick={() => handleThemeChange('light')}
 className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'}`}
 >
 <Sun size={24} />
 <span className="text-xs font-bold uppercase tracking-wider">Light</span>
 </button>
 <button 
 onClick={() => handleThemeChange('dark')}
 className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'}`}
 >
 <Moon size={24} />
 <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
 </button>
 <button 
 onClick={() => handleThemeChange('system')}
 className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${settings.theme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'}`}
 >
 <Monitor size={24} />
 <span className="text-xs font-bold uppercase tracking-wider">System</span>
 </button>
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">App Style</label>
 <div className="grid grid-cols-2 gap-3">
 <button 
 onClick={() => updateSetting('appStyle', 'colorful')}
 className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.appStyle !== 'minimalist' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'}`}
 >
 <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
 <span className="text-xs font-bold uppercase tracking-wider">Colorful</span>
 </button>
 <button 
 onClick={() => updateSetting('appStyle', 'minimalist')}
 className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.appStyle === 'minimalist' ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-[#111] text-slate-900 dark:text-white' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500'}`}
 >
 <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white border border-slate-200 dark:border-slate-700"></div>
 <span className="text-xs font-bold uppercase tracking-wider">Minimalist B&W</span>
 </button>
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Experimental UI</label>
 <div className="space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#151515] rounded-xl border border-slate-100 dark:border-slate-800 gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-800/50">
 <div>
 <p className="text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"></div> Glassmorphism</p>
 <p className="text-xs text-slate-500 mt-1">Enable a premium frosted glass effect across the app.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input type="checkbox" className="sr-only peer" checked={currentSettings.glassmorphism} onChange={() => updateSetting('glassmorphism', !currentSettings.glassmorphism)} />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
 </label>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#151515] rounded-xl border border-slate-100 dark:border-slate-800 gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-800/50">
 <div>
 <p className="text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Customizable Dashboard</p>
 <p className="text-xs text-slate-500 mt-1">Allow rearranging widgets on the dashboard.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer shrink-0">
 <input type="checkbox" className="sr-only peer" checked={currentSettings.customDashboard} onChange={() => updateSetting('customDashboard', !currentSettings.customDashboard)} />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
 </label>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Notifications */}
 <section className="card-minimal p-6 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
 <Bell className="text-emerald-500" size={20} />
 <h2 className="text-lg font-bold">Notifications</h2>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-bold text-sm">Email Notifications</p>
 <p className="text-xs text-slate-500 mt-1">Receive weekly summaries and important alerts.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" checked={currentSettings.emailNotif} onChange={() => updateSetting('emailNotif', !currentSettings.emailNotif)} />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
 </label>
 </div>
 <div className="flex items-center justify-between">
 <div>
 <p className="font-bold text-sm">Push Notifications</p>
 <p className="text-xs text-slate-500 mt-1">Get notified about upcoming classes and tasks.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" checked={currentSettings.pushNotif} onChange={handlePushNotifToggle} />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
 </label>
 </div>
 </div>
 </section>

 {/* Security Section */}
 <section className="card-minimal p-6 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
 <Lock className="text-amber-500" size={20} />
 <h2 className="text-lg font-bold">Security</h2>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="font-bold text-sm">App PIN Code (2FA)</p>
 <p className="text-xs text-slate-500 mt-1">Require a 4-digit PIN every time you log in.</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" checked={currentSettings.twoFactor} onChange={handle2FAToggle} />
 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
 </label>
 </div>
 <div className="pt-2">
 <button className="btn-secondary text-sm py-2 px-4 w-full sm:w-auto">Update Password</button>
 </div>
 </div>
 </section>

 {/* Data Management Section */}
 <section className="card-minimal p-6 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
 <HardDrive className="text-red-500" size={20} />
 <h2 className="text-lg font-bold">Data & Storage</h2>
 </div>
 <p className="text-sm text-slate-500 mb-4">All your data is stored locally on this device and securely backed up to Firebase. You can wipe your data to start fresh.</p>
 
 <button 
 onClick={() => setShowEraseModal(true)}
 className="text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
 >
 <AlertTriangle size={16} /> Erase All Data
 </button>
 </section>
 </div>
 </div>

 {/* Erase Data Confirmation Modal */}
 {showEraseModal && (
 <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
 <div className="card-minimal w-full max-w-sm p-6 animate-in zoom-in-95 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
 <AlertTriangle size={24} />
 </div>
 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Erase All Data?</h2>
 </div>
 <p className="text-sm text-slate-500 mb-6">Are you absolutely sure? This will permanently delete all courses, notes, flashcards, tasks, and settings. This cannot be undone.</p>
 
 <form onSubmit={handleEraseData}>
 <div className="mb-6">
 <label className="block text-sm font-medium mb-1">Enter password to confirm</label>
 <div className="relative">
 <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input 
 type={showPassword ? "text" : "password"} 
 value={deletePassword}
 onChange={e => setDeletePassword(e.target.value)}
 className="input-field pl-9 pr-10" 
 placeholder="Your password"
 required
 />
 <button 
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
 >
 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 {deleteError && <p className="text-xs text-red-500 font-bold mt-2">{deleteError}</p>}
 </div>

 <div className="flex gap-3">
 <button type="button" onClick={() => { setShowEraseModal(false); setDeleteError(''); setDeletePassword(''); }} className="btn-secondary flex-1">Cancel</button>
 <button type="submit" disabled={isDeleting || !deletePassword} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 border-transparent text-white flex justify-center items-center">
 {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Erase Data'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* PIN Modal for 2FA */}
 {showPinModal && (
 <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
 <div className="card-minimal w-full max-w-sm p-6 animate-in zoom-in-95 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full">
 <Lock size={24} />
 </div>
 <h2 className="text-xl font-bold text-slate-900 dark:text-white">
 {pinAction === 'enable' ? 'Set App PIN' : 'Disable PIN'}
 </h2>
 </div>
 <p className="text-sm text-slate-500 mb-6">
 {pinAction === 'enable' 
 ? 'Create a 4-digit PIN. You will need this to log in securely next time.' 
 : 'Enter your 4-digit PIN to disable it.'}
 </p>
 
 <div className="mb-6 text-center">
 <input 
 type="text" 
 maxLength="4"
 value={pinInput}
 onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
 className="input-field text-center text-2xl tracking-[0.5em] font-mono h-14 w-full" 
 placeholder="••••"
 required
 />
 {pinError && <p className="text-xs text-red-500 font-bold mt-2 text-left">{pinError}</p>}
 </div>

 <div className="flex gap-3">
 <button type="button" onClick={() => setShowPinModal(false)} className="btn-secondary flex-1">Cancel</button>
 <button onClick={submitPin} disabled={pinInput.length !== 4} className="btn-primary flex-1 bg-amber-500 hover:bg-amber-600 border-transparent text-white">
 {pinAction === 'enable' ? 'Enable PIN' : 'Verify & Disable'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Edit Profile Modal */}
 {showEditProfile && (
 <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
 <div className="card-minimal w-full max-w-sm p-6 animate-in zoom-in-95 bg-white dark:bg-[#111]">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
 <User size={24} />
 </div>
 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
 </div>
 
 <form onSubmit={handleUpdateProfile}>
 <div className="mb-6">
 <label className="block text-sm font-medium mb-1">Full Name</label>
 <input 
 type="text"
 value={newName}
 onChange={e => setNewName(e.target.value)}
 className="input-field" 
 placeholder="Your Name"
 required
 />
 </div>

 <div className="flex gap-3">
 <button type="button" onClick={() => setShowEditProfile(false)} className="btn-secondary flex-1">Cancel</button>
 <button type="submit" disabled={isUpdatingProfile || !newName.trim()} className="btn-primary flex-1">
 {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>
 );
}
