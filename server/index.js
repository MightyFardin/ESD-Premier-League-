const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDB, loadState, savePlayer, deletePlayerDB, saveManager, saveSettings, clearSystem } = require('./db');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const defaultSettings = {
  incrementRules: [
    { threshold: 100, increment: 5 },
    { threshold: 500, increment: 10 },
    { threshold: 1000, increment: 20 },
    { threshold: 1000000, increment: 50 }
  ],
  defaultManagerBudget: 10000,
  maxSquadSize: 15,
  allowCustomBids: true,
  defaultBasePrice: 100,
  defaultIncrement: 10,
  auctionTimerDuration: 30,
  auctioneerPassword: '123'
};

let state = {
  players: [],
  managers: [],
  settings: defaultSettings,
  liveAuction: {
    status: 'idle',
    currentPlayerId: null,
    currentBid: 0,
    currentIncrement: 5,
    highestBidderId: null,
    history: [],
    auctionEndAt: null,
    timerPaused: false,
    timerRemaining: 0
  }
};

function calculateIncrement(currentBid) {
  const sortedRules = [...(state.settings.incrementRules || [])].sort((a, b) => a.threshold - b.threshold);
  for (let rule of sortedRules) {
    if (currentBid < rule.threshold) {
      return rule.increment;
    }
  }
  return sortedRules.length > 0 ? sortedRules[sortedRules.length - 1].increment : (state.settings.defaultIncrement || 10);
}

function broadcastState() {
  const processedState = {
    ...state,
    managers: state.managers.map(m => {
      const spent = state.players.filter(p => p.status === 'sold' && p.teamId === m.id).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      return { ...m, budget: state.settings.defaultManagerBudget - spent };
    })
  };
  io.emit('stateUpdate', processedState);
}

async function startServer() {
  try {
    await initDB();
    const dbState = await loadState(defaultSettings);
    state.players = dbState.players || [];
    state.managers = dbState.managers || [];
    state.settings = dbState.settings || defaultSettings;
    console.log("Successfully connected to Supabase Postgres and loaded state.");
  } catch (err) {
    console.error("WARNING: Failed to connect to Supabase DB.", err.message);
    console.error("Falling back to empty in-memory state.");
  }

  io.on('connection', (socket) => {
    broadcastState();

    // Settings
    socket.on('updateSettings', (newSettings) => {
      state.settings = { ...state.settings, ...newSettings };
      if (state.liveAuction.status === 'active') {
        state.liveAuction.currentIncrement = calculateIncrement(state.liveAuction.currentBid);
      }
      broadcastState();
      saveSettings(state.settings).catch(e => console.error(e));
    });

    // Player Actions
    socket.on('addPlayer', (player) => {
      state.players.push(player);
      broadcastState();
      savePlayer(player).catch(e => console.error(e));
    });

    socket.on('editPlayer', (updatedPlayer) => {
      state.players = state.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
      broadcastState();
      savePlayer(updatedPlayer).catch(e => console.error(e));
    });

    socket.on('deletePlayer', (playerId) => {
      state.players = state.players.filter(p => p.id !== playerId);
      broadcastState();
      deletePlayerDB(playerId).catch(e => console.error(e));
    });

    socket.on('undoSale', (playerId) => {
      state.players = state.players.map(p => {
        if (p.id === playerId) {
          const updatedPlayer = { ...p, status: 'unsold', teamId: null, soldPrice: null };
          savePlayer(updatedPlayer).catch(e => console.error(e));
          return updatedPlayer;
        }
        return p;
      });
      broadcastState();
    });

    // Manager Actions
    socket.on('createManager', (manager) => {
      const exists = state.managers.find(m => m.username === manager.username);
      if (!exists) {
        const newManager = { ...manager, budget: state.settings.defaultManagerBudget };
        state.managers.push(newManager);
        broadcastState();
        saveManager(newManager).catch(e => console.error(e));
      }
    });

    socket.on('editManager', (updatedManager) => {
      state.managers = state.managers.map(m => m.id === updatedManager.id ? updatedManager : m);
      broadcastState();
      saveManager(updatedManager).catch(e => console.error(e));
    });

    // Auction Actions
    socket.on('startAuction', (playerId) => {
      const player = state.players.find(p => p.id === playerId);
      if (player) {
        const basePrice = state.settings.defaultBasePrice;
        state.liveAuction = {
          status: 'active',
          currentPlayerId: playerId,
          currentBid: basePrice,
          currentIncrement: calculateIncrement(basePrice),
          highestBidderId: null,
          history: [],
          auctionEndAt: Date.now() + 4000 + (state.settings.auctionTimerDuration * 1000),
          timerPaused: true,
          timerRemaining: state.settings.auctionTimerDuration
        };
        broadcastState();
        
        // Auto-resume timer after animation finishes (4.0s)
        setTimeout(() => {
          // Only unpause if the auction is still active for the SAME player and no one has bid yet
          if (state.liveAuction.status === 'active' && state.liveAuction.currentPlayerId === playerId && state.liveAuction.timerPaused && state.liveAuction.history.length === 0) {
            state.liveAuction.timerPaused = false;
            state.liveAuction.auctionEndAt = Date.now() + (state.liveAuction.timerRemaining * 1000);
            broadcastState();
          }
        }, 4000);
      }
    });

    socket.on('stopAuction', (action) => {
      let updatedPlayer = null;

      if (action === 'sell' && state.liveAuction.highestBidderId && state.liveAuction.currentPlayerId) {
        state.players = state.players.map(p => {
          if (p.id === state.liveAuction.currentPlayerId) {
            updatedPlayer = { ...p, status: 'sold', teamId: state.liveAuction.highestBidderId, soldPrice: state.liveAuction.currentBid };
            return updatedPlayer;
          }
          return p;
        });
      } else if (action === 'unsold' && state.liveAuction.currentPlayerId) {
        state.players = state.players.map(p => {
          if (p.id === state.liveAuction.currentPlayerId) {
            updatedPlayer = { ...p, status: 'unsold', teamId: null, soldPrice: null };
            return updatedPlayer;
          }
          return p;
        });
      }
      
      state.liveAuction = { 
        status: 'idle', 
        currentPlayerId: null, 
        currentBid: 0, 
        currentIncrement: 10, 
        highestBidderId: null, 
        history: [],
        auctionEndAt: null,
        timerPaused: false,
        timerRemaining: 0
      };
      
      broadcastState();

      if(updatedPlayer) { 
        savePlayer(updatedPlayer).catch(e => console.error(e)); 
      }
    });

    socket.on('placeBid', ({ amount, managerId }) => {
      const manager = state.managers.find(m => m.id === managerId);
      const spent = state.players.filter(p => p.status === 'sold' && p.teamId === managerId).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      const remainingBudget = state.settings.defaultManagerBudget - spent;
      
      const isFirstBid = state.liveAuction.highestBidderId === null;
      const isValidAmount = isFirstBid ? amount >= state.liveAuction.currentBid : amount > state.liveAuction.currentBid;
      const isConsecutiveBid = state.liveAuction.highestBidderId === managerId;
      
      console.log(`Bid Attempt: amount=${amount}, managerId=${managerId}, managerExists=${!!manager}, remainingBudget=${remainingBudget}, isValidAmount=${isValidAmount}, isFirstBid=${isFirstBid}, isConsecutiveBid=${isConsecutiveBid}`);
      
      if (isConsecutiveBid) {
         socket.emit('bidError', { message: "You are already the highest bidder!" });
         return;
      }
      
      if (state.liveAuction.timerPaused) {
         socket.emit('bidError', { message: "Cannot place bid while timer is paused!" });
         return;
      }
      
      if (manager && remainingBudget >= amount && isValidAmount) {
        state.liveAuction.currentBid = amount;
        state.liveAuction.highestBidderId = managerId;
        state.liveAuction.currentIncrement = calculateIncrement(amount);
        state.liveAuction.auctionEndAt = Date.now() + (state.settings.auctionTimerDuration * 1000);
        state.liveAuction.timerPaused = false;
        state.liveAuction.timerRemaining = state.settings.auctionTimerDuration;
        state.liveAuction.history.unshift({
          managerId,
          managerName: manager.teamName || manager.name,
          amount,
          time: new Date().toISOString()
        });
        broadcastState();
      } else {
        socket.emit('bidError', { message: "Bid rejected by server", details: { managerExists: !!manager, remainingBudget, amount, isValidAmount } });
      }
    });
    
    socket.on('revertBid', () => {
       if(state.liveAuction.history.length > 0) {
          state.liveAuction.history.shift(); 
          if(state.liveAuction.history.length > 0) {
             const lastBid = state.liveAuction.history[0];
             state.liveAuction.currentBid = lastBid.amount;
             state.liveAuction.highestBidderId = lastBid.managerId;
             state.liveAuction.currentIncrement = calculateIncrement(lastBid.amount);
          } else {
             state.liveAuction.currentBid = state.settings.defaultBasePrice;
             state.liveAuction.highestBidderId = null;
             state.liveAuction.currentIncrement = calculateIncrement(state.liveAuction.currentBid);
          }
          broadcastState();
       }
    });

    socket.on('pauseTimer', () => {
      if (state.liveAuction.status === 'active' && !state.liveAuction.timerPaused && state.liveAuction.auctionEndAt) {
        state.liveAuction.timerPaused = true;
        state.liveAuction.timerRemaining = Math.max(0, Math.floor((state.liveAuction.auctionEndAt - Date.now()) / 1000));
        state.liveAuction.auctionEndAt = null;
        broadcastState();
      }
    });

    socket.on('resumeTimer', () => {
      if (state.liveAuction.status === 'active' && state.liveAuction.timerPaused) {
        state.liveAuction.timerPaused = false;
        state.liveAuction.auctionEndAt = Date.now() + (state.liveAuction.timerRemaining * 1000);
        broadcastState();
      }
    });

    socket.on('addTime', (seconds) => {
      if (state.liveAuction.status === 'active') {
        if (state.liveAuction.timerPaused) {
          state.liveAuction.timerRemaining += seconds;
        } else if (state.liveAuction.auctionEndAt) {
          const now = Date.now();
          if (state.liveAuction.auctionEndAt < now) {
            state.liveAuction.auctionEndAt = now + (seconds * 1000);
          } else {
            state.liveAuction.auctionEndAt += (seconds * 1000);
          }
        }
        broadcastState();
      }
    });

    socket.on('resetSystem', () => {
        state = {
           players: [],
           managers: [],
           settings: state.settings,
           liveAuction: { status: 'idle', currentPlayerId: null, currentBid: 0, currentIncrement: 10, highestBidderId: null, history: [], auctionEndAt: null, timerPaused: false, timerRemaining: 0 }
        };
        broadcastState();
        clearSystem().catch(e => console.error(e));
    });
  });

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`Socket.io Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
