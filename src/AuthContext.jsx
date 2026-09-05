import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [players, setPlayers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [liveAuction, setLiveAuction] = useState({
    status: 'idle', currentPlayerId: null, currentBid: 0, currentIncrement: 10, highestBidderId: null, history: []
  });
  const [bids, setBids] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [auctionSettings, setAuctionSettings] = useState({ incrementRules: [] });

  const [settings, setSettings] = useState(() => { 
    const saved = localStorage.getItem('fa_settings'); 
    return saved ? JSON.parse(saved) : { theme: 'light', appStyle: 'minimalist', glassmorphism: false }; 
  });

  const [socket, setSocket] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;
    const newSocket = io(backendUrl);
    
    const originalEmit = newSocket.emit;
    newSocket.emit = function(...args) {
      setDbStatus('saving');
      originalEmit.apply(newSocket, args);
    };

    newSocket.on('connect', () => setDbStatus('connected'));
    newSocket.on('disconnect', () => setDbStatus('disconnected'));
    
    newSocket.on('bidError', (err) => {
      console.error("Bid failed:", err);
      setDbStatus('connected'); // Clear the saving status
    });
    
    newSocket.on('stateUpdate', (state) => {
      setPlayers(state.players);
      setManagers(state.managers);
      setLiveAuction(state.liveAuction);
      setBids(state.bids || []);
      setLogs(state.logs || []);
      if (state.settings) setAuctionSettings(state.settings);
      
      setDbStatus('saved');
      setTimeout(() => {
         setDbStatus(prev => prev === 'saved' ? 'connected' : prev);
      }, 2000);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => localStorage.setItem('fa_user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('fa_settings', JSON.stringify(settings)), [settings]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

    if (settings.appStyle === 'minimalist') root.classList.add('theme-minimalist');
    else root.classList.remove('theme-minimalist');
    
    if (settings.glassmorphism) root.classList.add('theme-glass');
    else root.classList.remove('theme-glass');
  }, [settings]);

  const login = (userData) => {
    setUser(userData);
    if (userData.role === 'manager' && socket) {
      // 10000 points default budget
      socket.emit('registerManager', { id: userData.id, name: userData.name, budget: 10000 });
    }
  };

  const logout = () => {
    localStorage.removeItem('fa_user');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      players, managers, liveAuction, auctionSettings, bids, logs,
      settings, setSettings,
      socket, dbStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
