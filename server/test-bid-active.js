const io = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server");
  
  socket.on("bidError", (err) => {
    console.log("BID ERROR:", err);
    process.exit(0);
  });
  
  socket.on("stateUpdate", (state) => {
     if (state.players.length > 0 && state.liveAuction.status === 'idle') {
        console.log("Starting auction for", state.players[0].id);
        socket.emit("startAuction", state.players[0].id);
     } else if (state.liveAuction.status === 'active') {
        if (state.managers.length > 0) {
           const manager = state.managers[0];
           if (state.liveAuction.highestBidderId !== manager.id) {
               console.log(`Bidding ${state.liveAuction.currentBid} as`, manager.id);
               socket.emit("placeBid", { amount: state.liveAuction.currentBid, managerId: manager.id });
           } else {
               console.log("Bid was successful!");
               process.exit(0);
           }
        }
     }
  });
});
